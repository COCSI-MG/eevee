import { Injectable } from '@nestjs/common';
import { CreateUserClassDto } from './dto/create-user-class.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserClass } from './entities/user-class.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserClassService {
  constructor(
    @InjectRepository(UserClass)
    private readonly userClassRepository: Repository<UserClass>,
  ) { }

  async createMany(createUserRequests: CreateUserClassDto[]) {
    const userClass = createUserRequests.map((createUserRequest) => {
      return {
        userId: createUserRequest.userId,
        classId: createUserRequest.classId,
      };
    });

    const result = await this.userClassRepository.upsert(userClass, {
      conflictPaths: ['id'],
      skipUpdateIfNoValuesChanged: true,
      upsertType: 'on-conflict-do-update',
    });

    return result;
  }

  findAll() {
    return this.userClassRepository.find({
      relations: ['class', 'user'],
    });
  }

  findOne(id: number) {
    return this.userClassRepository.findOne({
      where: { id },
      relations: ['class', 'user'],
    });
  }

  remove(id: number) {
    return this.userClassRepository.delete({ id });
  }

  deleteByClassId(classId: number) {
    return this.userClassRepository.delete({ classId });
  }
}
