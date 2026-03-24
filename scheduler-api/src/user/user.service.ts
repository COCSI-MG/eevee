import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateOrUpdateUserDto } from './dto/request/create-or-update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { HashUtils } from 'src/utils/hash.utils';
import { UserHelper } from './user.helper';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  async createOrReplace(createUserDto: CreateOrUpdateUserDto) {
    const user: Partial<User> = {
      ...createUserDto,
      passwordHash: HashUtils.hashPassword(createUserDto.password),
    };

    const result = await this.userRepository.upsert(user, {
      conflictPaths: ['email'],
      skipUpdateIfNoValuesChanged: true,
      upsertType: 'on-conflict-do-update',
    });
    const [newIdentifier] = result.identifiers;

    const newUser = await this.findOne(newIdentifier.id)!;

    const response = UserHelper.toResponseDto(newUser);

    return response;
  }

  findAll() {
    return this.userRepository.find({
      relations: ['userClasses'],
    });
  }

  findOne(id: number) {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.isAdmin) {
      throw new Error('Cannot delete admin user');
    }

    return this.userRepository.delete({ id });
  }
}
