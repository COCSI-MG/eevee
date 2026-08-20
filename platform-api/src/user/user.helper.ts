import { ClassHelper } from 'src/class/class.helper';
import { UserResponseDto } from './dto/response/user-response.dto';

export class UserHelper {
  static toResponseDto(user): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      userClasses: user.userClasses?.map((userClass) => ({
        id: userClass.id,
        classes: userClass.class.map(ClassHelper.toResponseDto),
      })),
    };
  }
}
