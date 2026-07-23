import { Class } from 'src/class/entities/class.entity';
import { ExamAssignment } from 'src/exam/entities/exam-assignment.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Exam {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  title: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ name: 'classId', nullable: true })
  classId: number;

  @ManyToOne(() => Class, (classEntity) => classEntity.exams, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'classId' })
  class?: Class;

  @Column({ type: 'timestamp', nullable: true })
  dueDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  startDate?: Date;

  @OneToMany(() => ExamAssignment, (examAssignment) => examAssignment.exam)
  examAssignments: ExamAssignment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
