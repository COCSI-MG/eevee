import { Assignment } from 'src/assignment/entities/assignment.entity';
import { Exam } from 'src/exam/entities/exam.entity';
import { UserClass } from 'src/user-class/entities/user-class.entity';
import { User } from 'src/user/entities/user.entity';
import { Column, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Class {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    nullable: true,
  })
  description: string;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date | null;

  @Column({ nullable: true })
  teacherId?: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'teacherId' })
  teacher?: User | null;

  @OneToMany(() => UserClass, (userClass) => userClass.class)
  userClasses: UserClass[];

  @OneToMany(() => Assignment, (assignment) => assignment.class)
  assignments: Assignment[];

  @OneToMany(() => Exam, (exam) => exam.class)
  exams: Exam[];
}
