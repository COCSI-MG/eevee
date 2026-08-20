import { Assignment } from "src/assignment/entities/assignment.entity";
import { Template } from "src/template/entities/template.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";


@Entity()
export class AssignmentTemplate {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    assignmentId: number;

    @Column()
    templateId: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    weight: number | null;

    @ManyToOne(() => Assignment, (assignment) => assignment.assignmentTemplates)
    assignment: Assignment;
  
    @ManyToOne(() => Template, (template) => template.assignmentTemplates)
    template: Template;
}
