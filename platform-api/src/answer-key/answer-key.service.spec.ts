import { UserRole } from 'src/user/user-role';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AnswerKeyService } from './answer-key.service';
import { AssignmentAlertService } from 'src/assignment-alert/assignment-alert.service';
import { ClassAccessService } from 'src/auth/class-access.service';

describe('AnswerKeyService', () => {
  const answerKeyRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const assignmentRepository = {
    findOne: jest.fn(),
  };
  const dataSource = {
    transaction: jest.fn(),
  };
  const assignmentAlertService = {
    assertCurrentUserNotSuspended: jest.fn(),
  };
  const classAccess = {
    assertAssignmentAccess: jest.fn()
  };
  let service: AnswerKeyService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AnswerKeyService(
      answerKeyRepository as never,
      assignmentRepository as never,
      dataSource as never,
      assignmentAlertService as unknown as AssignmentAlertService,
      classAccess as unknown as ClassAccessService
    );
  });

  it('rejects creating a second answer key', async () => {
    classAccess.assertAssignmentAccess.mockResolvedValue({
      id: 1,
      answerKeyId: 4,
    });

    answerKeyRepository.findOne.mockResolvedValue({ id: 4 });

    await expect(
      service.create(1, {
        content: { id: "root", path: "", isSelectable: false },
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(classAccess.assertAssignmentAccess).toHaveBeenCalledWith(1, true);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('rejects a student trying to create an answer key', async () => {
    classAccess.assertAssignmentAccess.mockRejectedValue(new NotFoundException('Class not found'));

    await expect(
      service.create(1, {
        content: {
          id: 'root',
          path: '',
          isSelectable: false
        }
      })
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(classAccess.assertAssignmentAccess).toHaveBeenCalledWith(1, true);
    expect(answerKeyRepository.findOne).not.toHaveBeenCalled();
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('rejects a student trying to update an answer key', async () => {
    classAccess.assertAssignmentAccess.mockRejectedValue(new NotFoundException('Class not found'));

    await expect(
      service.update(1, {
        content: {
          id: 'root',
          path: '',
          isSelectable: false
        }
      })
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(classAccess.assertAssignmentAccess).toHaveBeenCalledWith(1, true);
    expect(answerKeyRepository.findOne).not.toHaveBeenCalled();
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('rejects a student trying to delete an answer key', async () => {
    classAccess.assertAssignmentAccess.mockRejectedValue(new NotFoundException('Class not found'));

    await expect(service.remove(1)).rejects.toBeInstanceOf(NotFoundException);

    expect(classAccess.assertAssignmentAccess).toHaveBeenCalledWith(1, true);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('rejects a teacher trying to update another teacher’s answer key', async () => {
    classAccess.assertAssignmentAccess.mockRejectedValue(new NotFoundException('Class not found'));

    await expect(
      service.update(1, {
        content: {
          id: 'root',
          path: '',
          isSelectable: false
        }
      })
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(classAccess.assertAssignmentAccess).toHaveBeenCalledWith(1, true);
    expect(answerKeyRepository.findOne).not.toHaveBeenCalled();
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('rejects a teacher trying to delete another teacher’s answer key', async () => {
    classAccess.assertAssignmentAccess.mockRejectedValue(new NotFoundException('Class not found'));

    await expect(service.remove(1)).rejects.toBeInstanceOf(NotFoundException);

    expect(classAccess.assertAssignmentAccess).toHaveBeenCalledWith(1, true);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('hides an answer key from non-admin users', async () => {
    classAccess.assertAssignmentAccess.mockResolvedValue({ id: 1 });
    answerKeyRepository.findOne.mockResolvedValue({ id: 4 });

    assignmentRepository.findOne.mockResolvedValue({
      id: 1,
      answerKeyVisible: false,
    });

    await expect(service.findOne(1, UserRole.STUDENT)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows admins to view a hidden answer key', async () => {
    classAccess.assertAssignmentAccess.mockResolvedValue({ id: 1 });
    const answerKey = { id: 4 };

    answerKeyRepository.findOne.mockResolvedValue(answerKey);

    assignmentRepository.findOne.mockResolvedValue({
      id: 1,
      answerKeyVisible: false,
    });

    await expect(service.findOne(1, UserRole.ADMIN)).resolves.toBe(answerKey);
  });

  it('clears the assignment link and visibility when removing', async () => {
    classAccess.assertAssignmentAccess.mockResolvedValue({ id: 1 });
    const manager = {
      findOne: jest.fn().mockResolvedValue({ id: 4, assignmentId: 1 }),
      update: jest.fn(),
      delete: jest.fn(),
    };

    dataSource.transaction.mockImplementation((callback) => callback(manager));

    await expect(service.remove(1)).resolves.toEqual({ deleted: true });

    expect(manager.update).toHaveBeenCalledWith(expect.anything(), 1, {
      answerKeyId: null,
      answerKeyVisible: false,
    });

    expect(manager.delete).toHaveBeenCalledWith(expect.anything(), 4);
  });

  it('returns not found when updating a missing answer key', async () => {
    classAccess.assertAssignmentAccess.mockResolvedValue({ id: 1 });
    answerKeyRepository.findOne.mockResolvedValue(null);

    await expect(
      service.update(1, {
        content: { id: "root", path: "", isSelectable: false },
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
