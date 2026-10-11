import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { UserClassController } from './user-class.controller';
import { UserClassService } from './user-class.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ROLES_KEY } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/user-role';

describe('UserClassController', () => {
  let controller: UserClassController;
  let userClassService: {
    createMany: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    userClassService = {
      createMany: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserClassController],
      providers: [
        {
          provide: UserClassService,
          useValue: userClassService,
        },
      ],
    }).compile();

    controller = module.get<UserClassController>(UserClassController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('requires admin access', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, UserClassController)).toEqual([
      JwtAuthGuard,
      RolesGuard
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, UserClassController)).toEqual([
      UserRole.ADMIN
    ]);
  });

  it('delegates create to createMany', async () => {
    const dto = [{ userId: 1, classId: 2 }] as any;
    userClassService.createMany.mockResolvedValue({ identifiers: [] });

    await expect(controller.create(dto)).resolves.toEqual({ identifiers: [] });
    expect(userClassService.createMany).toHaveBeenCalledWith(dto);
  });
});
