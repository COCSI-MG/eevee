import { Assignment } from 'src/assignment/entities/assignment.entity';
import { UserClass } from 'src/user-class/entities/user-class.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Class {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    nullable: true,
  })
  description: string;

  @OneToMany(() => UserClass, (userClass) => userClass.class)
  userClasses: UserClass[];

  @OneToMany(() => Assignment, (assignment) => assignment.class)
  assignments: Assignment[];
}
