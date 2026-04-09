import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SchedulingPreviewRunStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('scheduling_preview_runs')
export class SchedulingPreviewRun {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  assignmentId: number;

  @Column({
    type: 'enum',
    enum: SchedulingPreviewRunStatus,
    default: SchedulingPreviewRunStatus.PENDING,
  })
  status: SchedulingPreviewRunStatus;

  @Column({ nullable: true })
  jobName?: string;

  @Column({ type: 'boolean', nullable: true })
  isAcceptable?: boolean;

  @Column('float', { nullable: true })
  score?: number;

  @Column({ nullable: true })
  passes?: number;

  @Column({ nullable: true })
  fails?: number;

  @Column({ type: 'text', nullable: true, default: '' })
  report?: string;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
