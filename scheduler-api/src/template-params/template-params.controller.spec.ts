import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { TemplateParamsController } from './template-params.controller';
import { TemplateParamsService } from './template-params.service';
import { AdminGuard } from 'src/auth/guards/admin.guard';

describe('TemplateParamsController', () => {
  let controller: TemplateParamsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemplateParamsController],
      providers: [
        {
          provide: TemplateParamsService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<TemplateParamsController>(TemplateParamsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('requires admin access', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, TemplateParamsController),
    ).toContain(AdminGuard);
  });
});
