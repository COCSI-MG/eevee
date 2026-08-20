import { ApiProperty } from '@nestjs/swagger';
import { FileStatus } from '../entities/file-saver.entity';
import { JobStatus, JobType } from '../entities/sync-job.entity';

export class FileEntryResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  assignmentId: number;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  filePath: string;

  @ApiProperty()
  fileSize: number;

  @ApiProperty()
  mimeType: string;

  @ApiProperty({ enum: FileStatus })
  status: FileStatus;

  @ApiProperty()
  syncAttempts: number;

  @ApiProperty({ required: false })
  lastSyncAttempt?: Date;

  @ApiProperty({ required: false })
  syncErrorMessage?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class GitRepositoryResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  assignmentId: number;

  @ApiProperty()
  repositoryName: string;

  @ApiProperty()
  repositoryUrl: string;

  @ApiProperty()
  defaultBranch: string;

  @ApiProperty()
  localPath: string;

  @ApiProperty({ required: false })
  lastSync?: Date;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;
}

export class SyncJobResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  fileEntryId: number;

  @ApiProperty({ enum: JobType })
  jobType: JobType;

  @ApiProperty()
  priority: number;

  @ApiProperty({ enum: JobStatus })
  status: JobStatus;

  @ApiProperty()
  attempts: number;

  @ApiProperty()
  maxAttempts: number;

  @ApiProperty({ required: false })
  errorMessage?: string;

  @ApiProperty()
  scheduledAt: Date;

  @ApiProperty({ required: false })
  startedAt?: Date;

  @ApiProperty({ required: false })
  completedAt?: Date;

  @ApiProperty()
  createdAt: Date;
}
