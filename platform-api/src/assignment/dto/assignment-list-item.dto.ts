import { Class } from 'src/class/entities/class.entity';
import { Assignment } from '../entities/assignment.entity';

export type AssignmentListItem = Pick<Assignment,
  'id' | 
  'title' | 
  'description' | 
  'workerType' | 
  'startDate' | 
  'dueDate'
> & {
  class: Pick<Class, 'name'>
};
