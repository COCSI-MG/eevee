import { Assignment } from 'src/assignment/entities/assignment.entity';
import { Attempt } from 'src/attempt/entities/attempt.entity';
import { User } from 'src/user/entities/user.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { InterviewPreferenceOption } from '../dto/create-interview-response.dto';

@Entity()
@Index(['userId', 'assignmentId'], { unique: true })
export class InterviewResponse {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  assignmentId: number;

  @ManyToOne(() => Assignment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assignmentId' })
  assignment: Assignment;

  @Column()
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  attemptId?: number;

  @ManyToOne(() => Attempt, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'attemptId' })
  attempt?: Attempt;

  @Column({ nullable: true })
  familiaritySql?: number;

  @Column({ nullable: true })
  familiarityJsTs?: number;

  @Column({ nullable: true })
  familiarityOrms?: number;

  @Column({ nullable: true })
  sdkClarity?: number;

  @Column({ nullable: true })
  sdkModifiability?: number;

  @Column({ nullable: true })
  sdkSqlErrorProneness?: number;

  @Column({ nullable: true })
  ormClarity?: number;

  @Column({ nullable: true })
  ormModifiability?: number;

  @Column({ nullable: true })
  ormIntent?: number;

  @Column({ nullable: true })
  ormMentalEffort?: number;

  @Column({ nullable: true })
  ormSafety?: number;

  @Column({
    type: 'enum',
    enum: InterviewPreferenceOption,
    nullable: true,
  })
  easierToUnderstand?: InterviewPreferenceOption;

  @Column({
    type: 'enum',
    enum: InterviewPreferenceOption,
    nullable: true,
  })
  easierToModify?: InterviewPreferenceOption;

  @Column({
    type: 'enum',
    enum: InterviewPreferenceOption,
    nullable: true,
  })
  futurePreference?: InterviewPreferenceOption;

  @Column({ type: 'text', nullable: true })
  teraormMainAdvantage?: string;

  @Column({ type: 'text', nullable: true })
  teraormMainDifficulty?: string;

  @Column({ type: 'text', nullable: true })
  additionalNotes?: string;

  @Column({ type: 'jsonb', nullable: true })
  extraAnswers?: Record<string, string | number>;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
