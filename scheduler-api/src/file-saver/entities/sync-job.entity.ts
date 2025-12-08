import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FileEntry } from './file-saver.entity';

export enum JobType {
  UPLOAD = 'upload',
  DOWNLOAD = 'download',
  DELETE = 'delete',
  SYNC = 'sync',
}

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRYING = 'retrying',
}

@Entity('sync_jobs')
export class SyncJob {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fileEntryId: number;

  @Column({
    type: 'enum',
    enum: JobType,
  })
  jobType: JobType;

  @Column({ default: 0 })
  priority: number;

  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.PENDING,
  })
  status: JobStatus;

  @Column({ default: 0 })
  attempts: number;

  @Column({ default: 3 })
  maxAttempts: number;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column()
  scheduledAt: Date;

  @Column({ nullable: true })
  startedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => FileEntry, { onDelete: 'CASCADE' })
  fileEntry: FileEntry;
}
