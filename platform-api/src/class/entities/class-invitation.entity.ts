import { Class } from './class.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';

@Entity('class_invitation')
export class ClassInvitation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  classId: number;

  @ManyToOne(() => Class, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'classId' })
  class: Class;

  @Column({ unique: true, length: 64 })
  tokenHash: string;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
