import { UserClassHelper } from 'src/user-class/user-class.helper';
import { ClassResponseDto } from './dto/response/class-response.dto';
import { Class } from './entities/class.entity';

export class ClassHelper {
  static toResponseDto(classEntity: Class): ClassResponseDto {
    return {
      id: classEntity.id,
      name: classEntity.name,
      description: classEntity.description,
      users: classEntity.userClasses?.length
        ? UserClassHelper.toResponseDto(classEntity.userClasses).map(
          (userClass) => ({
            userId: userClass.userId,
          }),
        )
        : [],
      // id: classEntity.id,
      // name: classEntity.name,
      // description: classEntity.description,
      // code: classEntity.code,
      // credits: classEntity.credits,
      // period: classEntity.period,
      // shift: classEntity.shift,
      // vacancies: classEntity.vacancies,
      // teacher: classEntity.teacher,
      // schedule: classEntity.schedule,
    };
  }
}
