import { SchedulingController } from './scheduling.controller';
import { SchedulingService } from './scheduling.service';
import {
  THROTTLER_LIMIT,
  THROTTLER_TTL,
} from '@nestjs/throttler/dist/throttler.constants';

describe('SchedulingController', () => {
  let controller: SchedulingController;
  let schedulingService: jest.Mocked<
    Pick<
      SchedulingService,
      | 'createAndWait'
      | 'createSchedulingJobAsync'
      | 'retryAttemptFromAdmin'
      | 'createPreviewRun'
      | 'getPreviewRunForCurrentUser'
      | 'cancelPreviewRun'
    >
  >;

  beforeEach(() => {
    schedulingService = {
      createAndWait: jest.fn(),
      createSchedulingJobAsync: jest.fn(),
      retryAttemptFromAdmin: jest.fn(),
      createPreviewRun: jest.fn(),
      getPreviewRunForCurrentUser: jest.fn(),
      cancelPreviewRun: jest.fn(),
    };

    controller = new SchedulingController(
      schedulingService as unknown as SchedulingService,
    );
  });

  it('routes wait to createAndWait', async () => {
    schedulingService.createAndWait.mockResolvedValue({ assignmentId: 1 } as never);

    await controller.createAndWait({
      assignmentId: 1,
      applicationFileContent: '',
      files: {},
    });

    expect(schedulingService.createAndWait).toHaveBeenCalledWith({
      assignmentId: 1,
      applicationFileContent: '',
      files: {},
    });
  });

  it('routes await to createSchedulingJobAsync', async () => {
    schedulingService.createSchedulingJobAsync.mockResolvedValue({ id: 7 } as never);

    await controller.createAsync({
      assignmentId: 1,
      applicationFileContent: '',
      files: {},
    });

    expect(schedulingService.createSchedulingJobAsync).toHaveBeenCalledWith({
      assignmentId: 1,
      applicationFileContent: '',
      files: {},
    });
  });

  it('routes preview creation to createPreviewRun', async () => {
    schedulingService.createPreviewRun.mockResolvedValue({ id: 11 } as never);

    await controller.createPreview({
      assignmentId: 1,
      applicationFileContent: '',
      files: {},
    });

    expect(schedulingService.createPreviewRun).toHaveBeenCalledWith({
      assignmentId: 1,
      applicationFileContent: '',
      files: {},
    });
  });

  it('routes preview fetch to getPreviewRunForCurrentUser', async () => {
    schedulingService.getPreviewRunForCurrentUser.mockResolvedValue({ id: 11 } as never);

    await controller.getPreviewRun(11);

    expect(schedulingService.getPreviewRunForCurrentUser).toHaveBeenCalledWith(11);
  });

  it('applies the moderate throttle to scheduling writes', () => {
    expect(
      Reflect.getMetadata(THROTTLER_LIMIT + 'default', SchedulingController.prototype.create),
    ).toBe(30);
    expect(
      Reflect.getMetadata(THROTTLER_TTL + 'default', SchedulingController.prototype.create),
    ).toBe(60000);
    expect(
      Reflect.getMetadata(THROTTLER_LIMIT + 'default', SchedulingController.prototype.createAndWait),
    ).toBe(30);
    expect(
      Reflect.getMetadata(THROTTLER_LIMIT + 'default', SchedulingController.prototype.createAsync),
    ).toBe(30);
    expect(
      Reflect.getMetadata(THROTTLER_LIMIT + 'default', SchedulingController.prototype.createPreview),
    ).toBe(30);
    expect(
      Reflect.getMetadata(THROTTLER_LIMIT + 'default', SchedulingController.prototype.cancelPreviewRun),
    ).toBe(30);
  });

  it('applies a higher throttle to preview polling', () => {
    expect(
      Reflect.getMetadata(THROTTLER_LIMIT + 'default', SchedulingController.prototype.getPreviewRun),
    ).toBe(120);
    expect(
      Reflect.getMetadata(THROTTLER_TTL + 'default', SchedulingController.prototype.getPreviewRun),
    ).toBe(60000);
  });
});
