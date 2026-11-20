import { AssignmentTemplate } from 'src/assignment/entities/assignment-template.entity';
import { TemplateParam } from './template-param.entity';
import { WorkerType } from 'src/worker/enum/worker-type.enum';
import { Class } from 'src/class/entities/class.entity';
import { TemplateResource } from './template-resource.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Template {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  classId?: number | null;

  @ManyToOne(() => Class, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'classId' })
  class?: Class | null;

  @Column()
  title: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'varchar', nullable: true })
  filePath: string | null;

  // TODO(template-storage): Template test content still lives in PostgreSQL.
  // Only attached resources use file-storage snapshots today. If content moves
  // to file storage, migrate existing rows and preserve API/worker behavior.
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

  @OneToMany(() => TemplateResource, (resource) => resource.template)
  resources?: TemplateResource[];
}
