import { Assignment } from 'src/assignment/entities/assignment.entity';
import { User } from 'src/user/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity()
export class Attempt {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  attempt: number;

  @ManyToOne(() => User, (attempt) => attempt.userAttempts)
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => Assignment, (assignment) => assignment.assignmentAttempts)
  assignment: Assignment;

  @Column()
  assignmentId: number;

  @Column()
  isAcceptable: boolean;

  @Column('float', { nullable: false })
  score: number;

  @Column()
  passes: number;

  @Column()
  fails: number;

  @Column()
  report: string;
}
