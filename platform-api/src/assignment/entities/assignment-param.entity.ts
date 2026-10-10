import { TemplateParam } from 'src/template/entities/template-param.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Assignment } from './assignment.entity';

@Entity()
export class AssignmentParam {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  value: string;

  @Column()
  assignmentId: number;

  @Column()
  templateParamsId: number;

  @ManyToOne(() => Assignment, (assignment) => assignment.assignmentParams)
  assignment: Assignment;

  @ManyToOne(
    () => TemplateParam,
    (templateParam) => templateParam.AssignmentParam,
  )
  templateParams: TemplateParam;
}
