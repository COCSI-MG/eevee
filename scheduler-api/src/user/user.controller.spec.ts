import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  let userService: {
    createOrReplace: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    userService = {
      createOrReplace: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: userService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates create to the service', async () => {
    const dto = { email: 'student@example.com' } as any;
    userService.createOrReplace.mockResolvedValue({ id: 3 });

    await expect(controller.create(dto)).resolves.toEqual({ id: 3 });
    expect(userService.createOrReplace).toHaveBeenCalledWith(dto);
  });

  it('delegates remove with a numeric id', async () => {
    userService.remove.mockResolvedValue({ affected: 1 });

    await expect(controller.remove('7')).resolves.toEqual({ affected: 1 });
    expect(userService.remove).toHaveBeenCalledWith(7);
  });
});
