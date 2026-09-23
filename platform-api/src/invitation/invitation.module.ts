import { Module } from '@nestjs/common';
import { MailModule } from 'src/mail/mail.module';
import { RequestContextModule } from 'src/request-context/request-context.module';
import { InvitationController } from './invitation.controller';
import { InvitationService } from './invitation.service';
@Module({
  imports: [MailModule, RequestContextModule],
  controllers: [InvitationController],
  providers: [InvitationService],
})
export class InvitationModule {}
