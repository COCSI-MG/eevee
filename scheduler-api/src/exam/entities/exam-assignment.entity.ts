import { Assignment } from 'src/assignment/entities/assignment.entity';
import { Exam } from 'src/exam/entities/exam.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class ExamAssignment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  examId: number;

  @Column({ unique: true })
  assignmentId: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  score: number;

  @ManyToOne(() => Exam, (exam) => exam.examAssignments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'examId' })
  exam: Exam;

  @OneToOne(() => Assignment, (assignment) => assignment.examAssignment, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'assignmentId' })
  assignment: Assignment;
}
