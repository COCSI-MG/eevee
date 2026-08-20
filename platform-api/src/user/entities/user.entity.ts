import { Exclude } from 'class-transformer';
import { AssignmentUserSuspension } from 'src/assignment-user-suspension/entities/assignment-user-suspension.entity';
import { Assignment } from 'src/assignment/entities/assignment.entity';
import { Attempt } from 'src/attempt/entities/attempt.entity';
import { UserClass } from 'src/user-class/entities/user-class.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  isAdmin: boolean;

  @Exclude()
  @Column()
  passwordHash: string;

  @OneToMany(() => UserClass, (userClass) => userClass.user)
  userClasses?: UserClass[];

  @OneToMany(() => Attempt, (userAttempt) => userAttempt.user)
  userAttempts: Attempt[];

  @OneToMany(() => AssignmentUserSuspension, (suspension) => suspension.user)
  assignmentSuspensions?: AssignmentUserSuspension[];

  @OneToMany(() => Assignment, (assignment) => assignment.createdBy)
  createdAssignments?: Assignment[];
}
