import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Template } from './template.entity';

/** Metadata only. Bytes live in file-storage-api as an immutable snapshot. */
@Entity()
@Index(['templateId', 'fileName'], { unique: true })
export class TemplateResource {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  templateId: number;

  @ManyToOne(() => Template, (template) => template.resources, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'templateId' })
  template: Template;

  @Column()
  fileName: string;

  /** SHA-256 ID of the immutable template snapshot containing this file. */
  @Column({ type: 'varchar', nullable: true })
  snapshotId?: string | null;

  @Column({ type: 'varchar', nullable: true })
  digest?: string | null;

  @Column({ type: 'integer', nullable: true })
  size?: number | null;
}
