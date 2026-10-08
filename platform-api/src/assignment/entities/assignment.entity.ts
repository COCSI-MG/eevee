import { AssignmentParam } from 'src/assignment-params/entities/assignment-param.entity';
import { AssignmentTemplate } from 'src/assignment-template/entities/assignment-template.entity';
import { AssignmentAlertRule } from 'src/assignment-alert/entities/assignment-alert-rule.entity';
import { AssignmentUserAlert } from 'src/assignment-alert/entities/assignment-user-alert.entity';
import { AssignmentAlertType } from 'src/assignment-alert/enums/assignment-alert-type.enum';
import { Attempt } from 'src/attempt/entities/attempt.entity';
import { AnswerKey } from 'src/answer-key/entities/answer-key.entity';
import { Class } from 'src/class/entities/class.entity';
import { ExamAssignment } from 'src/exam/entities/exam-assignment.entity';
import { User } from 'src/user/entities/user.entity';
import { WorkerType } from 'src/worker/enum/worker-type.enum';
import { AssignmentExecutionMode } from '../enums/assignment-execution-mode.enum';
import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';

export type AssignmentInterviewQuestionType = 'likert_1_5' | 'short_text';

export interface AssignmentInterviewQuestion {
  key: string;
  label: string;
  type: AssignmentInterviewQuestionType;
}

export interface AssignmentInterviewConfig {
  questions: AssignmentInterviewQuestion[];
}

export interface AssignmentAlertPolicy {
  suspensionAlertLimit: number;
  typingCharactersPerSecondLimit: number;
  punitiveTypes: AssignmentAlertType[];
  version: number;
}

export interface AssignmentCurrentUserAlertStatus {
  activeCount: number;
  limit: number;
  suspended: boolean;
}

@Entity()
@Index('IDX_assignment_class_title_id', ['classId', 'title', 'id'])
export class Assignment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  createdById?: number;

  @ManyToOne(() => User, (user) => user.createdAssignments, { nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy?: User;

  @Column()
  classId: number;

  @ManyToOne(() => Class, (classEntity) => classEntity.assignments)
  class: Class;

  @OneToMany(() => Attempt, (assignmentAttempt) => assignmentAttempt.assignment)
  assignmentAttempts: Attempt[];

  @OneToMany(
    () => AssignmentTemplate,
    (assignmentTemplate) => assignmentTemplate.assignment,
    {
      onDelete: 'CASCADE',
    },
  )
  assignmentTemplates: AssignmentTemplate[];

  @OneToMany(
    () => AssignmentParam,
    (assignmentParams) => assignmentParams.assignment,
    {
      onDelete: 'CASCADE',
    },
  )
  assignmentParams: AssignmentParam[];

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  maxAttempts: number;

  @Column({ type: 'enum', enum: AssignmentExecutionMode, default: AssignmentExecutionMode.GRADED })
  executionMode: AssignmentExecutionMode;

  @Column({ type: 'timestamp', nullable: true })
  startDate?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  dueDate?: Date | null;
  @Column({ default: false })
  allowCopyPaste: boolean;

  @Column({ default: 5 })
  suspensionAlertLimit: number;

  @Column({ default: 20 })
  typingCharactersPerSecondLimit: number;

  @Column({ default: 1 })
  alertPolicyVersion: number;

  @Column({
    type: 'enum',
    enum: WorkerType,
  })
  workerType: WorkerType;

  @Column({ type: 'text', nullable: true })
  initSqlScript?: string;

  @Column({ nullable: true })
  boilerplateFilePath?: string;

  @Column({ nullable: true })
  answerKeyId?: number | null;

  @ManyToOne(() => AnswerKey, (answerKey) => answerKey.assignment, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'answerKeyId' })
  answerKey?: AnswerKey | null;

  @Column({ default: false })
  answerKeyVisible: boolean;

  @Column({ default: false })
  allowProjectImport: boolean;

  @Column({ type: 'text', nullable: true })
  boilerplateContent?: string;

  @Column({ type: 'jsonb', nullable: true })
  interviewConfig?: AssignmentInterviewConfig;

  @OneToMany(() => AssignmentAlertRule, (rule) => rule.assignment)
  alertRules?: AssignmentAlertRule[];

  @OneToMany(() => AssignmentUserAlert, (alert) => alert.assignment)
  userAlerts?: AssignmentUserAlert[];

  alertPolicy?: AssignmentAlertPolicy;

  currentUserAlertStatus?: AssignmentCurrentUserAlertStatus;

  @OneToOne(() => ExamAssignment, (examAssignment) => examAssignment.assignment)
  examAssignment?: ExamAssignment;
}
