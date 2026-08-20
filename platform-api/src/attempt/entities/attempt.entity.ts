import { Assignment } from 'src/assignment/entities/assignment.entity';
import { User } from 'src/user/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { AttemptStatus } from '../enums/attempt-status.enum';

@Entity()
export class Attempt {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  attempt: number;

  @ManyToOne(() => User, (attempt) => attempt.userAttempts)
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => Assignment, (assignment) => assignment.assignmentAttempts)
  assignment: Assignment;

  @Column({
    type: 'enum',
    enum: AttemptStatus,
    default: AttemptStatus.PENDING,
  })
  status: AttemptStatus;

  @Column()
  assignmentId: number;

  @Column()
  isAcceptable: boolean;

  @Column('float', { nullable: false })
  score: number;

  @Column()
  passes: number;

  @Column()
  fails: number;

  @Column('jsonb', { nullable: true })
  receivedWork?: Record<string, string>;

  @Column()
  report: string;

  @Column({ type: 'text', nullable: true })
  refinedReport?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
