import { ClassHelper } from 'src/class/class.helper';
import { UserClassResponseDto } from './dto/response/user-class-response.dto';
import { UserClass } from './entities/user-class.entity';
import { Class } from 'src/class/entities/class.entity';

export class UserClassHelper {
  static toResponseDto(userClasses: UserClass[]): UserClassResponseDto[] {
    const userClassMap = new Map<number, Class[]>();

    userClasses.forEach((userClass) => {
      const classByUser = userClass.class;
      if (!classByUser) return;
      if (userClassMap.has(userClass.userId!)) {
        const classes = userClassMap.get(userClass.userId!)!;
        classes.push(classByUser);
      } else userClassMap.set(userClass.userId!, [classByUser]);
    });

    return Array.from(userClassMap).map(([userId, classes]) => ({
      userId,
      classes: classes.map(ClassHelper.toResponseDto),
    }));
  }
}
