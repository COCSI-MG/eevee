import { Exclude } from 'class-transformer';
import { AssignmentUserAlert } from 'src/assignment-alert/entities/assignment-user-alert.entity';
import { Assignment } from 'src/assignment/entities/assignment.entity';
import { Attempt } from 'src/attempt/entities/attempt.entity';
import { UserClass } from 'src/user-class/entities/user-class.entity';
import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
@Index('IDX_user_email_active', ['email'], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
@Index('UQ_user_identity_active', ['identityProvider', 'externalSubject'], {
  unique: true,
  where: '"deletedAt" IS NULL AND "externalSubject" IS NOT NULL',
})
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  name: string;

  @Column()
  isAdmin: boolean;

  /** Provider subject (Microsoft Entra object id, when linked). */
  @Column({ type: 'varchar', length: 255, nullable: true })
  externalSubject?: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  identityProvider?: string | null;

  @Exclude()
  @Column()
  passwordHash: string;

  @Exclude()
  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;

  @OneToMany(() => UserClass, (userClass) => userClass.user)
  userClasses?: UserClass[];

  @OneToMany(() => Attempt, (userAttempt) => userAttempt.user)
  userAttempts: Attempt[];

  @OneToMany(() => AssignmentUserAlert, (alert) => alert.user)
  assignmentAlerts?: AssignmentUserAlert[];

  @OneToMany(() => Assignment, (assignment) => assignment.createdBy)
  createdAssignments?: Assignment[];
}
