import { UserClassHelper } from 'src/user-class/user-class.helper';
import { ClassResponseDto } from './dto/response/class-response.dto';
import { Class } from './entities/class.entity';
import { BaseClassDto } from './dto/base-class.dto';

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
      // code: classEntity.code,
      // credits: classEntity.credits,
      // period: classEntity.period,
      // shift: classEntity.shift,
      // vacancies: classEntity.vacancies,
      // teacher: classEntity.teacher,
      // schedule: classEntity.schedule,
    };
  }
  static toEntity(dto: BaseClassDto): Class {
    const classEntity = new Class();
    classEntity.id = dto.id;
    classEntity.name = dto.name;
    return classEntity;
  }
}
