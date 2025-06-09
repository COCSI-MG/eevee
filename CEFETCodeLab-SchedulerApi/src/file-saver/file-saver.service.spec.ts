import { Test, TestingModule } from '@nestjs/testing';
import { FileSaverService } from './file-saver.service';

describe('FileSaverService', () => {
  let service: FileSaverService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileSaverService],
    }).compile();

    service = module.get<FileSaverService>(FileSaverService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
