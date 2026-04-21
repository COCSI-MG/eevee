import { AssignmentTemplate } from 'src/assignment-template/entities/assignment-template.entity';
import { TemplateParam } from 'src/template-params/entities/template-param.entity';
import { WorkerType } from 'src/worker/enum/worker-type.enum';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Template {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'varchar', nullable: true })
  filePath: string | null;

  @Column('text', { nullable: true })
  content: string;

  @Column({
    type: 'enum',
    enum: WorkerType,
    default: WorkerType.NODE_DEFAULT,
  })
  workerType: WorkerType;

  @Column('text', { array: true, nullable: true })
  dependencies: string[];

  @OneToMany(
    () => AssignmentTemplate,
    (assignmentTemplate) => assignmentTemplate.template,
  )
  assignmentTemplates?: AssignmentTemplate[];

  @OneToMany(
    () => TemplateParam,
    (assignmentTemplate) => assignmentTemplate.template,
    { eager: true },
  )
  templateParams: TemplateParam[];
}
