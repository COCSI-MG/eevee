import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import { DataSource, EntityManager, In } from 'typeorm';
import { MailService } from 'src/mail/mail.service';
import { RequestContextService } from 'src/request-context/request-context.service';
import { Class } from 'src/class/entities/class.entity';
import { User } from 'src/user/entities/user.entity';
import { UserClass } from 'src/user-class/entities/user-class.entity';
import { HashUtils } from 'src/utils/hash.utils';
import { PlatformInvitation } from './invitation.entity';
import { AcceptInvitationDto, CreateInvitationDto } from './invitation.dto';
import { invitationEmail } from './invitation.template';

const hash = (token: string) =>
  createHash('sha256').update(token).digest('hex');
const invalid = () =>
  new BadRequestException(
    'Convite inválido, expirado ou já utilizado. Solicite um novo convite ao professor.',
  );
@Injectable()
export class InvitationService {
  constructor(
    private readonly db: DataSource,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    private readonly context: RequestContextService,
  ) {}
  private admin() {
    const user = this.context.getUser();
    if (!user?.isAdmin) throw new ForbiddenException();
    return user;
  }
  private baseUrl() {
    try {
      const url = new URL(this.config.get<string>('FRONT_URL') || '');
      if (
        !['http:', 'https:'].includes(url.protocol) ||
        url.username ||
        url.password
      )
        throw new Error();
      return url.origin;
    } catch {
      throw new ServiceUnavailableException(
        'Configure FRONT_URL com o endereço público da plataforma.',
      );
    }
  }
  private async classes(manager: EntityManager, ids: number[]) {
    const classes = await manager.find(Class, { where: { id: In(ids) } });
    if (classes.length !== ids.length)
      throw new BadRequestException(
        'Uma das turmas não existe mais. Revise o convite.',
      );
    return classes;
  }
  private async emailLock(manager: EntityManager, email: string) {
    await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
      `invitation:${email}`,
    ]);
  }
  private async users(manager: EntityManager, email: string) {
    return manager
      .getRepository(User)
      .createQueryBuilder('u')
      .withDeleted()
      .where('LOWER(TRIM(u.email)) = :email', { email })
      .getMany();
  }
  async list(page = 1, pageSize = 20) {
    this.admin();
    const [data, total] = await this.db
      .getRepository(PlatformInvitation)
      .findAndCount({
        order: { createdAt: 'DESC', id: 'DESC' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
    return {
      data,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }
  async create(dto: CreateInvitationDto) {
    const admin = this.admin();
    const origin = this.baseUrl();
    const email = dto.email.trim().toLowerCase();
    const token = randomBytes(32).toString('hex');
    const record = await this.db.transaction(async (manager) => {
      await this.emailLock(manager, email);
      await this.classes(manager, dto.classIds);
      const users = await this.users(manager, email);
      if (users.length > 1 || users.some((u) => u.deletedAt))
        throw new ConflictException(
          'Revise a conta existente ou removida antes de convidar este e-mail.',
        );
      const previous = await manager.find(PlatformInvitation, {
        where: { email },
      });
      if (
        previous.some(
          (i) => !i.acceptedAt && !i.revokedAt && i.expiresAt > new Date(),
        )
      )
        throw new ConflictException(
          'Já existe um convite ativo para este e-mail. Use Reenviar ou revogue o anterior.',
        );
      return manager.save(
        PlatformInvitation,
        manager.create(PlatformInvitation, {
          email,
          name: dto.name.trim(),
          classIds: dto.classIds,
          tokenHash: hash(token),
          expiresAt: new Date(Date.now() + 7 * 86400000),
          invitedBy: admin.userId,
          deliveryStatus: 'pending',
          acceptedAt: null,
          revokedAt: null,
          sentAt: null,
        }),
      );
    });
    return this.deliver(record, token, origin);
  }
  async resend(id: number) {
    this.admin();
    const origin = this.baseUrl();
    const token = randomBytes(32).toString('hex');
    const record = await this.db.transaction(async (manager) => {
      const repo = manager.getRepository(PlatformInvitation);
      const candidate = await repo.findOneBy({ id });
      if (!candidate) throw new NotFoundException();
      await this.emailLock(manager, candidate.email);
      const row = await repo.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!row || row.acceptedAt || row.revokedAt)
        throw new ConflictException('Convite já aceito ou revogado.');
      const active = await repo.find({ where: { email: row.email } });
      if (
        active.some(
          (i) =>
            i.id !== id &&
            !i.acceptedAt &&
            !i.revokedAt &&
            i.expiresAt > new Date(),
        )
      )
        throw new ConflictException('Já existe um convite mais recente.');
      if (Date.now() - (row.sentAt || row.createdAt).getTime() < 60000)
        throw new ConflictException('Aguarde um minuto antes de reenviar.');
      await this.classes(manager, row.classIds);
      return repo.save({
        ...row,
        tokenHash: hash(token),
        expiresAt: new Date(Date.now() + 7 * 86400000),
        deliveryStatus: 'pending',
        sentAt: new Date(),
      });
    });
    return this.deliver(record, token, origin);
  }
  private async deliver(
    record: PlatformInvitation,
    token: string,
    origin: string,
  ) {
    const classes = await this.classes(this.db.manager, record.classIds);
    // Fragment keeps the token out of server access logs and Referer headers.
    const url = `${origin}/invitation#token=${token}`;
    let success = false;
    try {
      success = (
        await this.mail.sendEmail({
          to: record.email,
          ...invitationEmail(
            record.name,
            classes.map((c) => c.name),
            url,
          ),
        })
      ).success;
    } catch {
      success = false;
    }
    await this.db
      .getRepository(PlatformInvitation)
      .update(
        { id: record.id, tokenHash: hash(token) },
        {
          deliveryStatus: success ? 'sent' : 'failed',
          sentAt: success ? new Date() : null,
        },
      );
    return {
      id: record.id,
      email: record.email,
      deliveryStatus: success ? 'sent' : 'failed',
    };
  }
  async revoke(id: number) {
    this.admin();
    return this.db.transaction(async (manager) => {
      const row = await manager.findOne(PlatformInvitation, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!row) throw new NotFoundException();
      if (row.acceptedAt)
        throw new ConflictException(
          'O convite já foi aceito. Gerencie a matrícula na turma.',
        );
      row.revokedAt = new Date();
      await manager.save(row);
      return { success: true };
    });
  }
  private usable(row: PlatformInvitation | null) {
    if (
      !row ||
      row.acceptedAt ||
      row.revokedAt ||
      row.expiresAt <= new Date() ||
      row.deliveryStatus !== 'sent'
    )
      throw invalid();
    return row;
  }
  async inspect(token: string) {
    const row = this.usable(
      await this.db
        .getRepository(PlatformInvitation)
        .findOneBy({ tokenHash: hash(token) }),
    );
    const classes = await this.classes(this.db.manager, row.classIds);
    const users = await this.users(this.db.manager, row.email);
    return {
      name: row.name,
      email: row.email,
      classes: classes.map((c) => ({ id: c.id, name: c.name })),
      expiresAt: row.expiresAt,
      existingAccount: users.some((u) => !u.deletedAt),
    };
  }
  async accept(dto: AcceptInvitationDto) {
    if (Buffer.byteLength(dto.password, 'utf8') > 72)
      throw new BadRequestException('A senha deve ter no máximo 72 bytes.');
    return this.db.transaction(async (manager) => {
      const repo = manager.getRepository(PlatformInvitation);
      const candidate = this.usable(
        await repo.findOneBy({ tokenHash: hash(dto.token) }),
      );
      await this.emailLock(manager, candidate.email);
      const row = this.usable(
        await repo.findOne({
          where: { tokenHash: hash(dto.token) },
          lock: { mode: 'pessimistic_write' },
        }),
      );
      await this.classes(manager, row.classIds);
      const users = await this.users(manager, row.email);
      if (users.length > 1 || users.some((u) => u.deletedAt))
        throw new ConflictException(
          'Solicite ao professor a revisão da sua conta.',
        );
      let user = users[0];
      if (user) {
        if (!HashUtils.comparePassword(dto.password, user.passwordHash))
          throw new BadRequestException(
            'Use a senha atual da sua conta ou redefina-a na tela de entrada.',
          );
      } else {
        if (dto.password.length < 8)
          throw new BadRequestException(
            'Crie uma senha com pelo menos 8 caracteres.',
          );
        user = await manager.save(
          User,
          manager.create(User, {
            email: row.email,
            name: row.name,
            passwordHash: HashUtils.hashPassword(dto.password),
            isAdmin: false,
          }),
        );
      }
      for (const classId of row.classIds)
        await manager
          .createQueryBuilder()
          .insert()
          .into(UserClass)
          .values({ classId, userId: user.id })
          .orIgnore()
          .execute();
      row.acceptedAt = new Date();
      await repo.save(row);
      return {
        success: true,
        message:
          'Convite aceito. Entre na plataforma para acessar suas turmas.',
      };
    });
  }
}
