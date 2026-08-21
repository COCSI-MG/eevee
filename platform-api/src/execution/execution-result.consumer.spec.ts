import { Job } from 'bullmq';
import { AttemptService } from 'src/attempt/attempt.service';
import { AttemptStatus } from 'src/attempt/enums/attempt-status.enum';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';
import { ExecutionResultConsumer } from './execution-result.consumer';
import { Repository } from 'typeorm';
import {
  SchedulingPreviewRun,
  SchedulingPreviewRunStatus,
} from 'src/scheduling/entities/scheduling-preview-run.entity';

describe('ExecutionResultConsumer', () => {
  let consumer: ExecutionResultConsumer;
  let attemptService: jest.Mocked<Pick<AttemptService, 'findOne' | 'update'>>;
  let realtimeGateway: jest.Mocked<Pick<RealtimeGateway, 'emitSchedulingEvent'>>;
  let previewRepository: jest.Mocked<
    Pick<Repository<SchedulingPreviewRun>, 'findOne' | 'update'>
  >;

  beforeEach(() => {
    attemptService = {
      findOne: jest.fn(),
      update: jest.fn(),
    };
    realtimeGateway = {
      emitSchedulingEvent: jest.fn(),
    };
    previewRepository = {
      findOne: jest.fn(),
      update: jest.fn(),
    };
    consumer = new ExecutionResultConsumer(
      attemptService as unknown as AttemptService,
      realtimeGateway as unknown as RealtimeGateway,
      previewRepository as unknown as Repository<SchedulingPreviewRun>,
    );
  });

  it('persists a completed result and relays it to the attempt owner', async () => {
    attemptService.findOne.mockResolvedValue({
      id: 10,
      userId: 42,
      status: AttemptStatus.RUNNING,
    } as never);

    await consumer.process({
      data: {
        eventId: 'event-1',
        name: 'execution.completed.v1',
        occurredAt: '2026-08-03T00:00:00.000Z',
        target: { kind: 'attempt', id: 10, userId: 42 },
        status: AttemptStatus.COMPLETED,
        result: {
          isAcceptable: true,
          score: 1,
          report: 'Passed',
          passes: 3,
          fails: 0,
        },
      },
    } as Job);

    expect(attemptService.update).toHaveBeenCalledWith({
      id: 10,
      status: AttemptStatus.COMPLETED,
      isAcceptable: true,
      score: 1,
      report: 'Passed',
      passes: 3,
      fails: 0,
    });
    expect(realtimeGateway.emitSchedulingEvent).toHaveBeenCalledWith({
      kind: 'attempt',
      id: 10,
      userId: 42,
      status: AttemptStatus.COMPLETED,
    });
  });

  it('ignores a terminal event that would overwrite a completed attempt', async () => {
    attemptService.findOne.mockResolvedValue({
      id: 10,
      userId: 42,
      status: AttemptStatus.COMPLETED,
    } as never);

    await consumer.process({
      data: {
        eventId: 'event-2',
        name: 'execution.failed.v1',
        occurredAt: '2026-08-03T00:00:00.000Z',
        target: { kind: 'attempt', id: 10, userId: 42 },
        status: AttemptStatus.FAILED,
        errorMessage: 'Worker failed',
      },
    } as Job);

    expect(attemptService.update).not.toHaveBeenCalled();
    expect(realtimeGateway.emitSchedulingEvent).not.toHaveBeenCalled();
  });

  it('persists a completed preview result', async () => {
    previewRepository.findOne.mockResolvedValue({
      id: 20,
      userId: 42,
      status: SchedulingPreviewRunStatus.RUNNING,
    } as never);

    await consumer.process({
      data: {
        eventId: 'event-preview',
        name: 'execution.completed.v1',
        occurredAt: '2026-08-03T00:00:00.000Z',
        target: { kind: 'preview', id: 20, userId: 42 },
        status: 'completed',
        result: {
          isAcceptable: true,
          score: 1,
          report: 'Passed',
          passes: 3,
          fails: 0,
        },
      },
    } as Job);

    expect(previewRepository.update).toHaveBeenCalledWith(
      20,
      expect.objectContaining({
        status: SchedulingPreviewRunStatus.COMPLETED,
        report: 'Passed',
        score: 1,
      }),
    );
  });
});
