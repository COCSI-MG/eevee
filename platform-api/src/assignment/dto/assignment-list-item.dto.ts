import { Class } from 'src/class/entities/class.entity';
import { BaseAssignmentDto } from './base-assignment.dto';

export interface AssignmentListItem extends BaseAssignmentDto {
  class: Pick<Class, 'name'>;
}
