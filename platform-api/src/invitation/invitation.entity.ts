import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('platform_invitation')
@Index('IDX_invitation_created', ['createdAt', 'id'])
export class PlatformInvitation {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 254 }) email: string;
  @Column({ length: 160 }) name: string;
  @Column({ type: 'jsonb' }) classIds: number[];
  @Column({ length: 64, select: false }) tokenHash: string;
  @Column({ type: 'timestamptz' }) expiresAt: Date;
  @Column({ type: 'timestamptz', nullable: true }) acceptedAt: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) revokedAt: Date | null;
  @Column({ length: 20, default: 'pending' }) deliveryStatus: string;
  @Column({ type: 'timestamptz', nullable: true }) sentAt: Date | null;
  @Column() invitedBy: number;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
