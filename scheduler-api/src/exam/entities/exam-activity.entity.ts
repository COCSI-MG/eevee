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
export class ExamActivity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  examId: number;

  @Column({ unique: true })
  activityId: number;

  @ManyToOne(() => Exam, (exam) => exam.examActivities, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'examId' })
  exam: Exam;

  @OneToOne(() => Assignment, (assignment) => assignment.examActivity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'activityId' })
  activity: Assignment;
}
