import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AssignmentParamsController } from './assignment_params.controller';
import { AssignmentParamsService } from './assignment_params.service';
import { AdminGuard } from 'src/auth/guards/admin.guard';

describe('AssignmentParamsController', () => {
  let controller: AssignmentParamsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssignmentParamsController],
      providers: [
        {
          provide: AssignmentParamsService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<AssignmentParamsController>(AssignmentParamsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('requires admin access', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, AssignmentParamsController),
    ).toContain(AdminGuard);
  });
});
