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

  @Column()
  familiaritySql: number;

  @Column()
  familiarityJsTs: number;

  @Column()
  familiarityOrms: number;

  @Column()
  sdkClarity: number;

  @Column()
  sdkModifiability: number;

  @Column()
  sdkSqlErrorProneness: number;

  @Column()
  ormClarity: number;

  @Column()
  ormModifiability: number;

  @Column()
  ormIntent: number;

  @Column()
  ormMentalEffort: number;

  @Column()
  ormSafety: number;

  @Column({
    type: 'enum',
    enum: InterviewPreferenceOption,
  })
  easierToUnderstand: InterviewPreferenceOption;

  @Column({
    type: 'enum',
    enum: InterviewPreferenceOption,
  })
  easierToModify: InterviewPreferenceOption;

  @Column({
    type: 'enum',
    enum: InterviewPreferenceOption,
  })
  futurePreference: InterviewPreferenceOption;

  @Column({ type: 'text', nullable: true })
  teraormMainAdvantage?: string;

  @Column({ type: 'text', nullable: true })
  teraormMainDifficulty?: string;

  @Column({ type: 'text', nullable: true })
  additionalNotes?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
