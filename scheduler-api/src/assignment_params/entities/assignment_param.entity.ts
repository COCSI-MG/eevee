import { Assignment } from 'src/assignment/entities/assignment.entity';
import { TemplateParam } from 'src/template-params/entities/template-param.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

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

  @ManyToOne(() => Assignment, (assignment) => assignment.assignmentTemplates)
  assignment: Assignment;

  @ManyToOne(
    () => TemplateParam,
    (templateParam) => templateParam.AssignmentParam,
  )
  templateParams: TemplateParam;
}
