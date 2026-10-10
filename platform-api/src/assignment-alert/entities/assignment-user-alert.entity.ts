import { Assignment } from 'src/assignment/entities/assignment.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AssignmentAlertType } from '../enums/assignment-alert-type.enum';

export interface AssignmentAlertDetails {
  clipboardAction?: 'copy' | 'cut' | 'paste';
  devtoolsSignal?:
    | 'shortcut'
    | 'console'
    | 'debugger'
    | 'performance'
    | 'viewport';
  measuredCharactersPerSecond?: number;
  legacyReason?: string;
}

@Entity('assignment_user_alert')
@Index('IDX_assignment_user_alert_active', ['assignmentId', 'userId', 'deletedAt'])
@Index('UQ_assignment_user_alert_event', ['eventId'], { unique: true })
export class AssignmentUserAlert {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  eventId: string;

  @Column()
  assignmentId: number;

  @Column()
  userId: number;

  @Column({
    type: 'enum',
    enum: AssignmentAlertType,
    enumName: 'assignment_alert_type_enum'
  })
  type: AssignmentAlertType;

  @Column({ type: 'jsonb', nullable: true })
  details?: AssignmentAlertDetails | null;

  @Column({ type: 'timestamptz', nullable: true })
  occurredAt?: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date | null;

  @Column({ nullable: true })
  archivedByUserId?: number | null;

  @ManyToOne(() => User, (user) => user.assignmentAlerts, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Assignment, (assignment) => assignment.userAlerts, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'assignmentId' })
  assignment: Assignment;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'archivedByUserId' })
  archivedBy?: User | null;
}
