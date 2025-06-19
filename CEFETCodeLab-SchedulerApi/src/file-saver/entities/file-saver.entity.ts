import { Assignment } from 'src/assignment/entities/assignment.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum FileStatus {
  LOCAL_PENDING = 'local_pending',
  SYNCING = 'syncing',
  SYNCED = 'synced',
  ERROR = 'error',
}

@Entity('file_entries')
export class FileEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  assignmentId: number;

  @Column()
  userId: number;

  @Column()
  filePath: string;

  @Column({ nullable: true })
  localTempPath: string;

  @Column('bigint')
  fileSize: number;

  @Column()
  mimeType: string;

  @Column({
    type: 'enum',
    enum: FileStatus,
    default: FileStatus.LOCAL_PENDING,
  })
  status: FileStatus;

  @Column({ default: 0 })
  syncAttempts: number;

  @Column({ nullable: true })
  lastSyncAttempt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Assignment, { onDelete: 'CASCADE' })
  assignment: Assignment;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;
}
