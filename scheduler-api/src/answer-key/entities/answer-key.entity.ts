import { Assignment } from 'src/assignment/entities/assignment.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface AnswerKeyQuestion {
  key: string;
  label: string;
}

export interface AnswerKeyContent {
  questions: AnswerKeyQuestion[];
}

@Entity('answer_key')
@Index(['assignmentId'], { unique: true })
export class AnswerKey {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  assignmentId: number;

  @ManyToOne(() => Assignment, (assignment) => assignment.answerKey, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'assignmentId' })
  assignment: Assignment;

  @Column({ type: 'jsonb' })
  content: AnswerKeyContent;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
