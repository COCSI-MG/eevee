import {
  Column,
  Check,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Class } from 'src/class/entities/class.entity';
import { User } from 'src/user/entities/user.entity';
import {
  PracticeConfigDto,
  QuizAnswerDto,
  QuizQuestionDto,
} from './learning-activity.dto';

@Entity('learning_activity')
@Check('learning_activity_kind_check', "kind IN ('practice', 'quiz')")
@Check('learning_activity_maxAttempts_check', '"maxAttempts" BETWEEN 1 AND 20')
export class LearningActivity {
  @PrimaryGeneratedColumn() id: number;
  @Index('IDX_learning_activity_class') @Column() classId: number;
  @ManyToOne(() => Class, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'classId',
    foreignKeyConstraintName: 'learning_activity_classId_fkey',
  })
  class: Class;
  @Column({ type: 'varchar', length: 20 }) kind: 'practice' | 'quiz';
  @Column({ length: 160 }) title: string;
  @Column({ type: 'text' }) description: string;
  @Column({ default: false }) published: boolean;
  @Column({ type: 'timestamptz', nullable: true }) startDate: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) dueDate: Date | null;
  @Column({ default: 1 }) maxAttempts: number;
  @Column({ default: false }) feedbackReleased: boolean;
  @Column({ type: 'jsonb', nullable: true }) practice: PracticeConfigDto | null;
  @Column({ type: 'jsonb', nullable: true, select: false }) questions:
    | QuizQuestionDto[]
    | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}

@Entity('learning_quiz_attempt')
@Unique('learning_quiz_attempt_activityId_userId_attempt_key', [
  'activityId',
  'userId',
  'attempt',
])
@Check('learning_quiz_attempt_score_check', 'score BETWEEN 0 AND 1')
export class LearningQuizAttempt {
  @PrimaryGeneratedColumn() id: number;
  @Column() activityId: number;
  @ManyToOne(() => LearningActivity, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'activityId',
    foreignKeyConstraintName: 'learning_quiz_attempt_activityId_fkey',
  })
  activity: LearningActivity;
  @Column() userId: number;
  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'userId',
    foreignKeyConstraintName: 'learning_quiz_attempt_userId_fkey',
  })
  user: User;
  @Column() attempt: number;
  @Column({ type: 'jsonb' }) answers: QuizAnswerDto[];
  @Column({ type: 'double precision' }) score: number;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
