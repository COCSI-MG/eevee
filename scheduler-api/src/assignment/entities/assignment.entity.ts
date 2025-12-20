import { AssignmentUserSuspension } from 'src/assignment-user-suspension/entities/assignment-user-suspension.entity';
import { AssignmentParam } from 'src/assignment_params/entities/assignment_param.entity';
import { AssignmentTemplate } from 'src/assignment_template/entities/assignment_template.entity';
import { Attempt } from 'src/attempt/entities/attempt.entity';
import { Class } from 'src/class/entities/class.entity';
import { User } from 'src/user/entities/user.entity';
import { WorkerType } from 'src/worker/enum/worker-type.enum';
import { WorkerDefinition } from 'src/worker/worker-definition.type';
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
    type: 'text',
    nullable: true,
  })
  validationScript: string;

  @Column({
    type: 'enum',
    enum: WorkerType,
  })
  workerType: WorkerType;

<<<<<<< HEAD:CEFETCodeLab-SchedulerApi/src/assignment/entities/assignment.entity.ts
  @Column({
    type: "jsonb",
    nullable: true,
  })
  workerDefinition: WorkerDefinition;

  @OneToMany(() => AssignmentUserSuspension, (suspension) => suspension.assignment)
=======
  @Column({ nullable: true })
  boilerplateFilePath?: string;

  @OneToMany(
    () => AssignmentUserSuspension,
    (suspension) => suspension.assignment,
  )
>>>>>>> origin/develop:scheduler-api/src/assignment/entities/assignment.entity.ts
  suspensions?: AssignmentUserSuspension[];
}
