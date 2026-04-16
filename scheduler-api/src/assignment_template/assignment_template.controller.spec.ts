import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AssignmentTemplateController } from './assignment_template.controller';
import { AssignmentTemplateService } from './assignment_template.service';
import { AdminGuard } from 'src/auth/guards/admin.guard';

describe('AssignmentTemplateController', () => {
  let controller: AssignmentTemplateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssignmentTemplateController],
      providers: [
        {
          provide: AssignmentTemplateService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<AssignmentTemplateController>(AssignmentTemplateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('requires admin access', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, AssignmentTemplateController),
    ).toContain(AdminGuard);
  });
});
