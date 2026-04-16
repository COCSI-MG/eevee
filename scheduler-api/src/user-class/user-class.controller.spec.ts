import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { UserClassController } from './user-class.controller';
import { UserClassService } from './user-class.service';
import { AdminGuard } from 'src/auth/guards/admin.guard';

describe('UserClassController', () => {
  let controller: UserClassController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserClassController],
      providers: [
        {
          provide: UserClassService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<UserClassController>(UserClassController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('requires admin access', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, UserClassController)).toContain(
      AdminGuard,
    );
  });
});
