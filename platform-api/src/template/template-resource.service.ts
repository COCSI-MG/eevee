import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import { Repository } from 'typeorm';
import type { ExecutionTemplateSnapshot } from '@eevee/execution-contracts';
import { ClassAccessService } from 'src/auth/class-access.service';
import {
  storeTemplateFile,
  templateStorageScope,
  TemplateStorageError,
} from 'src/file-storage/template-storage';
import { Template } from './entities/template.entity';
import { TemplateResource } from './entities/template-resource.entity';
import { storageLimits } from 'src/file-storage/storage-limits';

@Injectable()
export class TemplateResourceService {
  constructor(
    @InjectRepository(TemplateResource)
    private readonly resources: Repository<TemplateResource>,
    private readonly classAccess: ClassAccessService,
  ) {}

  private storageError(error: unknown): never {
    if (error instanceof TemplateStorageError) {
      if (error.unavailable) throw new ServiceUnavailableException(error.message);
      throw new BadRequestException(error.message);
    }
    throw error;
  }

  async upload(templateId: number, file: Express.Multer.File) {
    await this.classAccess.assertTemplateAccess(templateId, true);
    if (!file?.buffer) throw new BadRequestException('A template resource is required');
    const { maxFileBytes } = storageLimits();
    if (file.buffer.length > maxFileBytes) {
      throw new BadRequestException(`Template resource exceeds ${maxFileBytes} bytes`);
    }
    const digest = createHash('sha256').update(file.buffer).digest('hex');
    const resource = await this.resources.manager.transaction(async (manager) => {
      await manager.query("SET LOCAL lock_timeout = '5s'");
      // Serialize the storage snapshot and its DB commit across API instances.
      // Lock the parent even for the first upload (no resource rows exist yet).
      const template = await manager.getRepository(Template)
        .createQueryBuilder('template')
        .setLock('pessimistic_write')
        .where('template.id = :templateId', { templateId })
        .getOne();
      if (!template) throw new NotFoundException('Template not found');
      const repository = manager.getRepository(TemplateResource);
      const previous = await repository.findOne({
        where: { templateId, fileName: file.originalname },
      });
      if (
        previous?.digest === digest &&
        previous.snapshotId &&
        previous.size === file.size
      ) {
        return {
          id: previous.id,
          fileName: previous.fileName,
          size: previous.size,
          snapshotId: previous.snapshotId,
        };
      }

      const current = await repository.find({ where: { templateId } });
      if (current.some((row) => !row.snapshotId || !row.digest || row.size == null) ||
          new Set(current.map((row) => row.snapshotId)).size > 1) {
        throw new InternalServerErrorException('Template resources require snapshot reconciliation');
      }
      const committedFiles = Object.fromEntries(current.map((row) => [
        row.fileName, { digest: row.digest!, size: row.size! },
      ]));
      let snapshot: Awaited<ReturnType<typeof storeTemplateFile>>;
      try {
        snapshot = await storeTemplateFile(templateId, file.originalname, file.buffer, committedFiles);
      } catch (error) {
        this.storageError(error);
      }
      const byName = new Map(current.map((resource) => [resource.fileName, resource]));
      const rows = Object.entries(snapshot.files).map(([fileName, reference]) =>
        repository.create({
          ...(byName.get(fileName) ? { id: byName.get(fileName)!.id } : {}),
          templateId,
          fileName,
          snapshotId: snapshot.id,
          digest: reference.digest,
          size: reference.size,
        }),
      );
      const saved = await repository.save(rows);
      return saved.find((item) => item.fileName === file.originalname);
    });
    if (!resource) {
      throw new InternalServerErrorException('Template resource was not persisted');
    }
    return {
      id: resource.id,
      fileName: resource.fileName,
      size: resource.size,
      snapshotId: resource.snapshotId,
    };
  }

  async workerSnapshots(templateId: number): Promise<ExecutionTemplateSnapshot[]> {
    const resources = await this.resources.find({ where: { templateId } });
    const snapshots = new Set(
      resources
        .map((resource) => resource.snapshotId)
        .filter((value): value is string => Boolean(value)),
    );
    if (resources.length && !snapshots.size) {
      throw new InternalServerErrorException(
        'Template resources have not been migrated to immutable snapshots',
      );
    }
    if (resources.some((resource) => !resource.snapshotId)) {
      throw new InternalServerErrorException(
        'Template resources have an incomplete snapshot migration',
      );
    }
    if (!snapshots.size) return [];
    if (snapshots.size !== 1) {
      throw new InternalServerErrorException('Template resource snapshot is inconsistent');
    }
    return [
      {
        scope: templateStorageScope(templateId),
        id: [...snapshots][0],
        kind: 'template',
      },
    ];
  }

  async list(templateId: number) {
    await this.classAccess.assertTemplateAccess(templateId, true);
    return this.resources.find({
      where: { templateId },
      select: { id: true, fileName: true, digest: true, size: true },
      order: { id: 'ASC' },
    });
  }
}
