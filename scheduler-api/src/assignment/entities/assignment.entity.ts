import { AssignmentUserSuspension } from 'src/assignment-user-suspension/entities/assignment-user-suspension.entity';
import { AssignmentParam } from 'src/assignment-params/entities/assignment_param.entity';
import { AssignmentTemplate } from 'src/assignment-template/entities/assignment_template.entity';
import { Attempt } from 'src/attempt/entities/attempt.entity';
import { Class } from 'src/class/entities/class.entity';
import { User } from 'src/user/entities/user.entity';
import { WorkerType } from 'src/worker/enum/worker-type.enum';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Assignment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  createdById?: number;

  @ManyToOne(() => User, (user) => user.createdAssignments, { nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy?: User;

  @Column()
  classId: number;

  @ManyToOne(() => Class, (classEntity) => classEntity.assignments)
  class: Class;

  @OneToMany(() => Attempt, (assignmentAttempt) => assignmentAttempt.assignment)
  assignmentAttempts: Attempt[];

  @OneToMany(
    () => AssignmentTemplate,
    (assignmentTemplate) => assignmentTemplate.assignment,
    {
      onDelete: 'CASCADE',
    },
  )
  assignmentTemplates: AssignmentTemplate[];

  @OneToMany(
    () => AssignmentParam,
    (assignmentParams) => assignmentParams.assignment,
    {
      onDelete: 'CASCADE',
    },
  )
  assignmentParams: AssignmentParam[];

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  maxAttempts: number;

  @Column({
    type: 'enum',
    enum: WorkerType,
  })
  workerType: WorkerType;

  @Column({ type: 'text', nullable: true })
  initSqlScript?: string;

  @Column({ nullable: true })
  boilerplateFilePath?: string;

  @Column({ type: 'text', nullable: true })
  boilerplateContent?: string;

  @OneToMany(
    () => AssignmentUserSuspension,
    (suspension) => suspension.assignment,
  )
  suspensions?: AssignmentUserSuspension[];
}
