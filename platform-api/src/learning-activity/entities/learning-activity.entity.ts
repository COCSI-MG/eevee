import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Class } from 'src/class/entities/class.entity';
import { LearningActivityKind } from '../enums/learning-activity-kind.enum';
import { PracticeConfigDto } from '../dto/practice-config.dto';
import { QuizQuestionDto } from '../dto/quiz-question.dto';

@Entity('learning_activity')
@Index('IDX_learning_activity_class', ['classId'])
@Check('learning_activity_kind_check', "kind IN ('practice', 'quiz')")
@Check('learning_activity_maxAttempts_check', '"maxAttempts" BETWEEN 1 AND 20')
export class LearningActivity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  classId!: number;

  @ManyToOne(() => Class, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'classId',
    foreignKeyConstraintName: 'learning_activity_classId_fkey',
  })
  class!: Class;

  @Column({ type: 'varchar', length: 20 })
  kind!: LearningActivityKind;

  @Column({ length: 160 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ default: false })
  published!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  startDate!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  dueDate!: Date | null;

  @Column({ default: 1 })
  maxAttempts!: number;

  @Column({ default: false })
  feedbackReleased!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  practice!: PracticeConfigDto | null;

  @Column({ type: 'jsonb', nullable: true, select: false })
  questions!: QuizQuestionDto[] | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
