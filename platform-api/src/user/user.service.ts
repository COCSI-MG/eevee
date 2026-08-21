import { Injectable, NotFoundException } from '@nestjs/common';
import { Brackets, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/request/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { HashUtils } from 'src/utils/hash.utils';
import { UserHelper } from './user.helper';
import { ListUsersQueryDto } from './dto/request/list-users.query.dto';
import {
  PaginatedResult,
  buildPaginationMeta,
  buildPaginationParams,
} from 'src/common/pagination/pagination';
import { UpdateUserDto } from './dto/request/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  async createOrReplace(createUserDto: CreateUserDto) {
    const { password, ...userData } = createUserDto;
    const existingUser = await this.findByEmail(userData.email);
    const user: Partial<User> = {
      ...(existingUser ?? {}),
      ...userData,
      passwordHash: HashUtils.hashPassword(password),
    };

    const savedUser = await this.userRepository.save(user);
    const newUser = await this.findOne(savedUser.id);
    if (!newUser) throw new NotFoundException('Saved user not found');

    const response = UserHelper.toResponseDto(newUser);

    return response;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const existingUser = await this.findOne(id);
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const { password, ...userData } = updateUserDto;
    const userUpdates: Partial<User> = { ...userData };

    if (password) {
      userUpdates.passwordHash = HashUtils.hashPassword(password);
    }

    if (Object.keys(userUpdates).length > 0) {
      await this.userRepository.update(id, userUpdates);
    }

    const updatedUser = (await this.findOne(id))!;
    return UserHelper.toResponseDto(updatedUser);
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
    const user = await this.findOne(userId);
    if (!user) throw new NotFoundException('User not found');
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

    return this.userRepository.softDelete({ id });
  }
}
