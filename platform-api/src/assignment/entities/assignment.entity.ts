import { AssignmentParam } from 'src/assignment-params/entities/assignment-param.entity';
import { AssignmentTemplate } from 'src/assignment-template/entities/assignment-template.entity';
import { AssignmentUserSuspension } from 'src/assignment-user-suspension/entities/assignment-user-suspension.entity';
import { Attempt } from 'src/attempt/entities/attempt.entity';
import { AnswerKey } from 'src/answer-key/entities/answer-key.entity';
import { Class } from 'src/class/entities/class.entity';
import { ExamAssignment } from 'src/exam/entities/exam-assignment.entity';
import { User } from 'src/user/entities/user.entity';
import { WorkerType } from 'src/worker/enum/worker-type.enum';
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

  @Column({ type: 'timestamp', nullable: true })
  startDate?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  dueDate?: Date | null;
  @Column({ default: false })
  allowCopyPaste: boolean;

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

  @OneToMany(
    () => AssignmentUserSuspension,
    (suspension) => suspension.assignment,
  )
  suspensions?: AssignmentUserSuspension[];

  @OneToOne(() => ExamAssignment, (examAssignment) => examAssignment.assignment)
  examAssignment?: ExamAssignment;
}
