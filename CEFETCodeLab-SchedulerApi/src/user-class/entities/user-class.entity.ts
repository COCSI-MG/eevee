import { Class } from 'src/class/entities/class.entity';
import { User } from 'src/user/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
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
  user?: User;

  @ManyToOne(() => Class, (classEntity) => classEntity.userClasses, {
    onDelete: 'CASCADE',
  })
  class?: Class;
}
