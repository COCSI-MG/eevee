import { Assignment } from 'src/assignment/entities/assignment.entity';
import { User } from 'src/user/entities/user.entity';
import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('assignment_user_suspension')
@Index(['assignmentId', 'userId'], { unique: true })
export class AssignmentUserSuspension {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  assignmentId: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  reason: string;

  //Relations
  @ManyToOne(() => User, (user) => user.assignmentSuspensions)
  user: User;

  @ManyToOne(() => Assignment, (assignment) => assignment.suspensions)
  assignment: Assignment;
}
