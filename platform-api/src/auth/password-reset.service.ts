import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes, createHash } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PasswordReset } from './entities/password-reset.entity';
import { UserService } from 'src/user/user.service';
import { MailService } from 'src/mail/mail.service';
import { buildPasswordResetEmailHtml } from 'src/user/templates/password-reset.template';

@Injectable()
export class PasswordResetService {
  constructor(
    @InjectRepository(PasswordReset)
    private readonly passwordResetRepository: Repository<PasswordReset>,
    private readonly userService: UserService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ success: boolean }> {
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const record = await this.passwordResetRepository.findOne({
      where: { tokenHash },
      relations: ['user'],
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return { success: false };
    }

    await this.userService.updatePassword(record.user.id, newPassword);

    record.usedAt = new Date();
    await this.passwordResetRepository.save(record);

    return { success: true };
  }

  async requestReset(email: string): Promise<{ message: string }> {
    const user = await this.userService.findByEmail(email);

    if (user) {
      const token = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(token).digest('hex');

      await this.passwordResetRepository.save({
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 3600000),
      });

      const frontUrl = this.configService.get<string>('FRONT_URL');
      const resetRoute = this.configService.get<string>('FRONT_ROUTE_RESET_PASSWORD');
      const resetUrl = `${frontUrl}${resetRoute}/${token}`;

      await this.mailService.sendEmail({
        to: email,
        subject: 'Redefinição de senha',
        text: `Use o link abaixo para redefinir sua senha:\n\n${resetUrl}\n\nEste link expira em 1 hora.`,
        html: buildPasswordResetEmailHtml(resetUrl),
      });
    }

    return { message: 'Um email será enviado para o endereço fornecido' };
  }
}
