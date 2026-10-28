export class ClassInvitationResponseDto {
  id: number;
  token: string;
  expiresAt: Date | null;
  createdAt: Date;
}
