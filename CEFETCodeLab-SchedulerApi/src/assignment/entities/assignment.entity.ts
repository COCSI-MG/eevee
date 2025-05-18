import { AssignmentParam } from 'src/assignment_params/entities/assignment_param.entity';
import { AssignmentTemplate } from 'src/assignment_template/entities/assignment_template.entity';
import { Attempt } from 'src/attempt/entities/attempt.entity';
import { Class } from 'src/class/entities/class.entity';
import { WorkerType } from 'src/worker/enum/worker-type.enum';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Assignment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  classId: number;

  @ManyToOne(() => Class, (classEntity) => classEntity.assignments)
  class: Class;

  @OneToMany(() => Attempt, (assignmentAttempt) => assignmentAttempt.assignment)
  assignmentAttempts: Attempt[];

  @OneToMany(() => AssignmentTemplate, (assignmentTemplate) => assignmentTemplate.assignment, {
    onDelete: 'CASCADE',
  })
  assignmentTemplates: AssignmentTemplate[];

  @OneToMany(() => AssignmentParam, (assignmentParams) => assignmentParams.assignment, {
    onDelete: 'CASCADE',
  })
  assignmentParams: AssignmentTemplate[];

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({ length: 30000 })
  validationScript: string;

  @Column({ length: 30000 })
  template: string;

  @Column()
  maxAttempts: number;

  @Column({
    type: 'enum',
    enum: WorkerType,
  })
  workerType: WorkerType;
}
