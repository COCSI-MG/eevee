import { Assignment } from 'src/assignment/entities/assignment.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AssignmentAlertType } from '../enums/assignment-alert-type.enum';

@Entity('assignment_alert_rule')
@Index('UQ_assignment_alert_rule_assignment_type', ['assignmentId', 'type'], {
  unique: true,
})
export class AssignmentAlertRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  assignmentId: number;

  @Column({
    type: 'enum',
    enum: AssignmentAlertType,
    enumName: 'assignment_alert_type_enum'
  })
  type: AssignmentAlertType;

  @ManyToOne(() => Assignment, (assignment) => assignment.alertRules, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'assignmentId' })
  assignment: Assignment;
}
