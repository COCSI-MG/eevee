import { AssignmentParam } from "src/assignment_params/entities/assignment_param.entity";
import { Template } from "src/template/entities/template.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class TemplateParam {
@PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  templateId: number;

  @ManyToOne(() => Template, (template) => template.templateParams, { onDelete: "CASCADE" })
  template: Template;

  @OneToMany(() => AssignmentParam, (template) => template.templateParams, { onDelete: "CASCADE" })
  AssignmentParam: AssignmentParam;
}
