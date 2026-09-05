import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AttemptController } from './attempt.controller';
import { AttemptService } from './attempt.service';

describe('AttemptController', () => {
  let controller: AttemptController;
  let attemptService: {
    findAllForAdmin: jest.Mock;
    findAllForAdminByAssignmentAndUser: jest.Mock;
    findOneForAdmin: jest.Mock;
  };

  beforeEach(async () => {
    attemptService = {
      findAllForAdmin: jest.fn(),
      findAllForAdminByAssignmentAndUser: jest.fn(),
      findOneForAdmin: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttemptController],
      providers: [
        {
          provide: AttemptService,
          useValue: attemptService,
        },
      ],
    }).compile();

    controller = module.get<AttemptController>(AttemptController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates admin listing to the service', async () => {
    const query = { assignmentId: 99, page: 2 } as any;
    attemptService.findAllForAdmin.mockResolvedValue({ data: [], meta: {} });

    await expect(controller.findAllForAdmin(query)).resolves.toEqual({
      data: [],
      meta: {},
    });
    expect(attemptService.findAllForAdmin).toHaveBeenCalledWith(query);
  });

  it('delegates the assignment and user attempt history to the service', async () => {
    attemptService.findAllForAdminByAssignmentAndUser.mockResolvedValue([
      { id: 12 },
    ]);

    await expect(
      controller.findAllForAdminByAssignmentAndUser(99, 7),
    ).resolves.toEqual([{ id: 12 }]);

    expect(
      attemptService.findAllForAdminByAssignmentAndUser,
    ).toHaveBeenCalledWith(99, 7);
  });

  it('throws NotFoundException when the attempt does not exist', async () => {
    attemptService.findOneForAdmin.mockResolvedValue(null);

    await expect(controller.findOneForAdmin(404)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
