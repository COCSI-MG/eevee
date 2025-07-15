import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { resolve } from 'node:path';
import { existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { CreateFileEntryDto } from './dto/create-file-entry.dto';
import { UpdateFileEntryDto } from './dto/update-file-saver.dto';
import { FileEntry, FileStatus } from './entities/file-saver.entity';
import { SyncJob, JobType, JobStatus } from './entities/sync-job.entity';
import { FileUploadDto } from './dto/file-operation.dto';
import { Cron, Interval } from '@nestjs/schedule';
import { ProducerService } from 'src/kafka/producer.service';
import { readFile, rm } from 'node:fs/promises';
import GithubService from 'src/github/github.service';
import { ClsService } from 'nestjs-cls';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class FileSaverService {
  private logger = new Logger(FileSaverService.name);

  constructor(
    @InjectRepository(FileEntry)
    private fileEntryRepository: Repository<FileEntry>,
    @InjectRepository(SyncJob)
    private syncJobRepository: Repository<SyncJob>,
    private producerService: ProducerService,
    private githubService: GithubService,
    private clsService: ClsService,
  ) {}

  async createFileEntry(
    createFileEntryDto: CreateFileEntryDto,
  ): Promise<FileEntry> {
    const fileEntry = this.fileEntryRepository.create(createFileEntryDto);
    return this.fileEntryRepository.save(fileEntry);
  }

  async findFileEntry(id: number): Promise<FileEntry> {
    const fileEntry = await this.fileEntryRepository.findOne({
      where: { id },
      relations: ['assignment', 'user'],
    });
    if (!fileEntry) {
      throw new NotFoundException(`File entry with ID ${id} not found`);
    }
    return fileEntry;
  }

  async findFileEntriesByAssignment(
    assignmentId: number,
  ): Promise<FileEntry[]> {
    return this.fileEntryRepository.find({
      where: { assignmentId },
      relations: ['assignment', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findFileEntriesByUser(
    userId: number,
    assignmentId: number,
  ): Promise<FileEntry[]> {
    return this.fileEntryRepository.find({
      where: { userId, assignmentId },
      relations: ['assignment', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateFileEntry(
    id: number,
    updateFileEntryDto: UpdateFileEntryDto,
  ): Promise<FileEntry> {
    await this.fileEntryRepository.update(id, updateFileEntryDto);
    return this.findFileEntry(id);
  }

  async deleteFileEntry(id: number): Promise<void> {
    const result = await this.fileEntryRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`File entry with ID ${id} not found`);
    }
  }

  async createSyncJob(fileEntryId: number, jobType: JobType, priority?: number): Promise<SyncJob> {
    const syncJob = this.syncJobRepository.create({
      fileEntryId,
      jobType,
      scheduledAt: new Date(),
      priority
    });
    return this.syncJobRepository.save(syncJob);
  }

  async findPendingOrFailedSyncJobs(): Promise<SyncJob[]> {
    return this.syncJobRepository.find({
      where: {
        status: In([
          JobStatus.PROCESSING,
          JobStatus.FAILED
        ])
      },
      order: { priority: 'DESC', scheduledAt: 'ASC' },
      relations: ['fileEntry'],
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    fileUploadDto: FileUploadDto,
  ): Promise<FileEntry> {
    const user = this.clsService.get('user');
    const uploadDir = resolve(__dirname, '..', '..', '..', 'uploads');
    const assignmentDir = `${uploadDir}/assignment-${fileUploadDto.assignmentId}`;
    const userDir = `${assignmentDir}/user-${user.userId}`;

    if (!existsSync(userDir)) {
      await mkdir(userDir, { recursive: true });
    }

    const fileName = file.originalname;
    const localTempPath = `${userDir}/${fileName}`;
    const gitFilePath = `assignment-${fileUploadDto.assignmentId}/user-${user.userId}/${fileName}`;

    if (existsSync(localTempPath)) {
      const existingFile = await this.fileEntryRepository.findOne({
        where: {
          assignmentId: fileUploadDto.assignmentId,
          userId: user.userId,
          filePath: gitFilePath,
        },
      });

      if (existingFile) {
        await writeFile(localTempPath, file.buffer);
        await this.fileEntryRepository.update(existingFile.id, {
          fileSize: file.size,
          status: FileStatus.LOCAL_PENDING,
          syncAttempts: 0,
          lastSyncAttempt: undefined,
        });

        await this.createSyncJob(existingFile.id, JobType.UPLOAD);

        return this.findFileEntry(existingFile.id);
      }
    }

    try {
      await writeFile(localTempPath, file.buffer);

      const fileEntry = await this.createFileEntry({
        assignmentId: fileUploadDto.assignmentId,
        userId: user.userId,
        filePath: gitFilePath,
        localTempPath,
        fileSize: file.size,
        mimeType: file.mimetype,
      });

      await this.createSyncJob(fileEntry.id, JobType.UPLOAD);

      return fileEntry;
    } catch (error) {
      this.logger.error(`Error uploading file: ${error.message}`);
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  async downloadFile(
    fileEntryId: number,
  ): Promise<{ filePath: string; fileEntry: FileEntry }> {
    const fileEntry = await this.findFileEntry(fileEntryId);

    if (fileEntry.localTempPath && existsSync(fileEntry.localTempPath)) {
      return { filePath: fileEntry.localTempPath, fileEntry };
    }

    await this.createSyncJob(fileEntryId, JobType.DOWNLOAD);

    throw new NotFoundException(
      'File not available locally. Download job queued.',
    );
  }

  private async enqueueUploadJob(job: SyncJob): Promise<void> {
    this.logger.log(`Enqueue upload job for file: ${job.fileEntryId}`);
    if (job.attempts === job.maxAttempts) {
      throw new Error('Max attempts reached');
    }

    await this.producerService.produce('remote-file-saver-events', {
      key: crypto.randomUUID(),
      value: JSON.stringify({
        jobId: job.id,
        localTempPath: job.fileEntry.localTempPath,
        gitRemoteFilePath: job.fileEntry.filePath,
      }),
    });
  }

  @Cron('*/10 * * * *')
  // @Interval(10000) uncomment for testing purposes - DO NOT USE IN PRODUCTION
  async processPendindOrFailedSyncJobs() {
    this.logger.log('🚀 Processing pending sync jobs');
    const pendingJobs = await this.findPendingOrFailedSyncJobs();
    if (pendingJobs.length === 0) {
      this.logger.log('No pending sync jobs found');
      return;
    }

    for (const job of pendingJobs) {
      try {
        await Promise.all([
          this.fileEntryRepository.update(job.fileEntryId, {
            status: FileStatus.SYNCING,
          }),
          this.syncJobRepository.update(job.id, {
            status:
              job.attempts > 0 ? JobStatus.RETRYING : JobStatus.PROCESSING,
            startedAt: new Date(),
          }),
        ]);

        switch (job.jobType) {
          case JobType.UPLOAD:
            await this.enqueueUploadJob(job);
            break;
          // case JobType.DOWNLOAD:
          //   await this.processDownloadJob(job);
          //   break;
          default:
            this.logger.warn(`Unknown job type: ${job.jobType}`);
        }
      } catch (error) {
        this.logger.error(`Error processing job ${job.id}: ${error.message}`);
        await Promise.all([
          this.syncJobRepository.update(job.id, {
            status: JobStatus.FAILED,
            attempts: job.attempts + 1,
            errorMessage: error.message,
          }),
          this.fileEntryRepository.update(job.fileEntryId, {
            status: FileStatus.ERROR,
            syncAttempts: job.attempts + 1,
            lastSyncAttempt: new Date(),
          }),
        ]);
      }
    }
  }

  @Cron('*/30 * * * *')
  // @Interval(30000) uncomment for testing purposes - DO NOT USE IN PRODUCTION
  async cleanUpSyncedLocalFiles() {
    this.logger.log('🚀 Cleaning up synced local files');

    const syncedFiles = await this.fileEntryRepository.find({
      where: { status: FileStatus.SYNCED },
      relations: ['assignment', 'user'],
      order: { createdAt: 'DESC' },
    });
    if (syncedFiles.length === 0) {
      this.logger.log('No synced files found for cleanup');
      return;
    }

    for (const fileEntry of syncedFiles) {
      try {
        if (fileEntry.localTempPath && existsSync(fileEntry.localTempPath)) {
          this.logger.log(`Deleting local file: ${fileEntry.localTempPath}`);
          await rm(fileEntry.localTempPath);

          await this.fileEntryRepository.update(fileEntry.id, {
            localTempPath: "",
          });
        } else {
          this.logger.warn(
            `Local file path does not exist: ${fileEntry.localTempPath}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Error deleting local file ${fileEntry.localTempPath}: ${error.message}`,
        );
      }
    }
    this.logger.log('🚀 Local files cleanup completed');
  }

  async updateSyncJobStatus(
    jobId: number,
    status: JobStatus,
    errorMessage?: string,
  ): Promise<void> {
    const job = await this.syncJobRepository.findOne({
      where: { id: jobId },
      relations: ['fileEntry'],
    });
    if (!job) {
      throw new NotFoundException(`Sync job with ID ${jobId} not found`);
    }
    this.logger.log(`Updating sync job ${jobId} status to ${status}`);
    switch (status) {
      case JobStatus.COMPLETED:
        await Promise.all([
          this.syncJobRepository.update(jobId, {
            status: JobStatus.COMPLETED,
            completedAt: new Date(),
          }),
          this.fileEntryRepository.update(job.fileEntryId, {
            status: FileStatus.SYNCED,
            syncAttempts: job.attempts + 1,
            lastSyncAttempt: new Date(),
          }),
        ])
        break;
      case JobStatus.FAILED:
        await Promise.all([
          this.syncJobRepository.update(jobId, {
            status: JobStatus.FAILED,
            errorMessage: errorMessage || 'Unknown error',
            priority: 1,
            attempts: job.attempts + 1,
          }),
          this.fileEntryRepository.update(job.fileEntryId, {
            status: FileStatus.ERROR,
            syncAttempts: job.attempts + 1,
            lastSyncAttempt: new Date(),
          }),
        ]);
        break;
      default:
        this.logger.warn(`Unhandled job status: ${status}`);
    }
  }

  async uploadFileToGithubRepo({
    jobId,
    localFilePath,
    gitRemoteFilePath,
  }: {
    jobId: number;
    localFilePath: string;
    gitRemoteFilePath: string;
  }) {
    const file = await readFile(localFilePath, {
      encoding: 'utf8',
    });
    if (file.length === 0 || file.trim() === '') {
      throw new Error(`File in ${localFilePath} is empty`);
    }

    const owner = process.env.GITHUB_REPO_OWNER!;
    const repo = process.env.GITHUB_REPO_NAME!;

    this.logger.log(
      `Making request to url: https://api.github.com/repos/${owner}/${repo}/contents/${gitRemoteFilePath}`,
    );

    let fileSha: string | undefined;
    try {
      const existingFile = await this.githubService.getRepoContents({
        repo,
        owner,
        remoteGithubFilePath: gitRemoteFilePath,
      });
      if (existingFile) {
        this.logger.log(`File ${gitRemoteFilePath} already exists in GitHub`);
        fileSha = existingFile.sha; // Get the SHA of the existing file
      }
    } catch (error) {
      this.logger.error(`Error fetching file from GitHub: ${error.message}`);
    }

    try {
      const response = await this.githubService.createOrUpdateRepoContents({
        repo,
        owner,
        remoteGithubFilePath: gitRemoteFilePath,
        contents: file,
        sha: fileSha, // Pass the SHA if the file exists
      });
      this.logger.log(`File uploaded successfully: ${response}`);
    } catch (error) {
      this.logger.error(`Error uploading file to GitHub: ${error.message}`);
      await this.updateSyncJobStatus(jobId, JobStatus.FAILED, error.message);
      return;
    }
    await this.updateSyncJobStatus(jobId, JobStatus.COMPLETED);
  }

  findAll() {
    return this.fileEntryRepository.find({
      relations: ['assignment', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  findOne(id: number) {
    return this.findFileEntry(id);
  }

  update(id: number, updateFileEntryDto: UpdateFileEntryDto) {
    return this.updateFileEntry(id, updateFileEntryDto);
  }

  remove(id: number) {
    return this.deleteFileEntry(id);
  }
}
