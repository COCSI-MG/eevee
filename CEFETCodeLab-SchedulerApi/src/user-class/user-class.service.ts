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
      // conflict target must match the DB unique/primary constraint
      conflictPaths: ['userId', 'classId'],
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

  // Find by composite keys
  findOneByKeys(userId: number, classId: number) {
    return this.userClassRepository.findOne({
      where: { userId, classId },
      relations: ['class', 'user'],
    });
  }

  // Delete by composite keys
  removeByKeys(userId: number, classId: number) {
    return this.userClassRepository.delete({ userId, classId });
  }

  // Primary-key-based helpers (use id for operations)
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
