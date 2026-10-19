import { Class } from 'src/class/entities/class.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  Index,
} from 'typeorm';

@Entity()
@Index('IDX_user_class_class_user', { synchronize: false })
@Index(['userId', 'classId'], { unique: true })
export class UserClass {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  classId: number;

  @ManyToOne(() => User, (user) => user.userClasses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @ManyToOne(() => Class, (classEntity) => classEntity.userClasses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'classId' })
  class?: Class;
}
