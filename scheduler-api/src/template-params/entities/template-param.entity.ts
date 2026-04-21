import { AssignmentParam } from 'src/assignment-params/entities/assignment-param.entity';
import { Template } from 'src/template/entities/template.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TemplateParamType } from '../enums/template-param-type.enum';

@Entity()
export class TemplateParam {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: TemplateParamType,
    default: TemplateParamType.STRING,
  })
  type: TemplateParamType;

  @Column()
  templateId: number;

  @ManyToOne(() => Template, (template) => template.templateParams, {
    onDelete: 'CASCADE',
  })
  template: Template;

  @OneToMany(() => AssignmentParam, (template) => template.templateParams, {
    onDelete: 'CASCADE',
  })
  AssignmentParam: AssignmentParam;
}
