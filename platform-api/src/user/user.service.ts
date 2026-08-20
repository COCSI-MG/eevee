import { Injectable } from '@nestjs/common';
import { Brackets, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateOrUpdateUserDto } from './dto/request/create-or-update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { HashUtils } from 'src/utils/hash.utils';
import { UserHelper } from './user.helper';
import { ListUsersQueryDto } from './dto/request/list-users.query.dto';
import {
  PaginatedResult,
  buildPaginationMeta,
  buildPaginationParams,
} from 'src/common/pagination/pagination';

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

  async findAllPaginated(query: ListUsersQueryDto): Promise<PaginatedResult<User>> {
    const { page, pageSize, skip } = buildPaginationParams(query);

    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userClasses', 'userClasses')
      .orderBy('user.id', 'DESC');

    const search = query.search?.trim();
    if (search) {
      qb.andWhere(
        new Brackets((expr) => {
          expr.where('LOWER(user.name) LIKE LOWER(:search)', { search: `%${search}%` })
            .orWhere('LOWER(user.email) LIKE LOWER(:search)', { search: `%${search}%` });
        }),
      );
    }

    const [data, total] = await qb.clone().skip(skip).take(pageSize).getManyAndCount();

    return { data, meta: buildPaginationMeta(total, page, pageSize) };
  }

  findOne(id: number) {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  async updatePassword(userId: number, newPassword: string): Promise<void> {
    await this.userRepository.update(userId, {
      passwordHash: HashUtils.hashPassword(newPassword),
    });
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
