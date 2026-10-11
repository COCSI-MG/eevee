import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { QuizAnswerDto } from '../dto/quiz-answer.dto';
import { LearningActivity } from './learning-activity.entity';

@Entity('learning_quiz_attempt')
@Unique('learning_quiz_attempt_activityId_userId_attempt_key', [
  'activityId',
  'userId',
  'attempt',
])
@Check('learning_quiz_attempt_score_check', 'score BETWEEN 0 AND 1')
export class LearningQuizAttempt {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  activityId!: number;

  @ManyToOne(() => LearningActivity, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'activityId',
    foreignKeyConstraintName: 'learning_quiz_attempt_activityId_fkey',
  })
  activity!: LearningActivity;

  @Column()
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'userId',
    foreignKeyConstraintName: 'learning_quiz_attempt_userId_fkey',
  })
  user!: User;

  @Column()
  attempt!: number;

  @Column({ type: 'jsonb' })
  answers!: QuizAnswerDto[];

  @Column({ type: 'double precision' })
  score!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
