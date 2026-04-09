import { SchedulingController } from './scheduling.controller';
import { SchedulingService } from './scheduling.service';

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
});
