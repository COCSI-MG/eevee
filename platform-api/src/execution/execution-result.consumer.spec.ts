import { Job } from 'bullmq';
import { AttemptService } from 'src/attempt/attempt.service';
import { AttemptStatus } from 'src/attempt/enums/attempt-status.enum';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';
import { ExecutionResultConsumer } from './execution-result.consumer';

describe('ExecutionResultConsumer', () => {
  let consumer: ExecutionResultConsumer;
  let attemptService: jest.Mocked<Pick<AttemptService, 'findOne' | 'update'>>;
  let realtimeGateway: jest.Mocked<Pick<RealtimeGateway, 'emitSchedulingEvent'>>;

  beforeEach(() => {
    attemptService = {
      findOne: jest.fn(),
      update: jest.fn(),
    };
    realtimeGateway = {
      emitSchedulingEvent: jest.fn(),
    };
    consumer = new ExecutionResultConsumer(
      attemptService as unknown as AttemptService,
      realtimeGateway as unknown as RealtimeGateway,
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
        attemptId: 10,
        userId: 42,
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
        attemptId: 10,
        userId: 42,
        status: AttemptStatus.FAILED,
        errorMessage: 'Worker failed',
      },
    } as Job);

    expect(attemptService.update).not.toHaveBeenCalled();
    expect(realtimeGateway.emitSchedulingEvent).not.toHaveBeenCalled();
  });
});