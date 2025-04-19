import { AssignmentTemplate } from "src/assignment_template/entities/assignment_template.entity";
import { TemplateParam } from "src/template_params/entities/template_param.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Template {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({ nullable: true })
    description?: string;

    @Column()
    filePath: string;

    @OneToMany(() => AssignmentTemplate, (assignmentTemplate) => assignmentTemplate.template)
    assignmentTemplates?: AssignmentTemplate[];

    @OneToMany(() => TemplateParam, (assignmentTemplate) => assignmentTemplate.template, { eager: true })
    templateParams: TemplateParam[];
}
