import { getQueueToken } from '@nestjs/bullmq';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { ClsService } from 'nestjs-cls';
import GithubService from 'src/github/github.service';
import { FileEntry } from './entities/file-saver.entity';
import { SyncJob } from './entities/sync-job.entity';
import { FileSaverService } from './file-saver.service';

describe('FileSaverService', () => {
  let service: FileSaverService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileSaverService,
        {
          provide: getRepositoryToken(FileEntry),
          useValue: {},
        },
        {
          provide: getRepositoryToken(SyncJob),
          useValue: {},
        },
        {
          provide: getQueueToken('file-saver-queue'),
          useValue: {},
        },
        {
          provide: GithubService,
          useValue: {},
        },
        {
          provide: ClsService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<FileSaverService>(FileSaverService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
