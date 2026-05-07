import { Test, TestingModule } from '@nestjs/testing';
import { FileSaverController } from './file-saver.controller';
import { FileSaverService } from './file-saver.service';

describe('FileSaverController', () => {
  let controller: FileSaverController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileSaverController],
      providers: [
        {
          provide: FileSaverService,
          useValue: {
            uploadFile: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<FileSaverController>(FileSaverController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
