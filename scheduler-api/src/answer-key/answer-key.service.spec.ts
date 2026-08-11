import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AnswerKeyService } from './answer-key.service';

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
  let service: AnswerKeyService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AnswerKeyService(
      answerKeyRepository as never,
      assignmentRepository as never,
      dataSource as never,
    );
  });

  it('rejects creating a second answer key', async () => {

    assignmentRepository.findOne.mockResolvedValue({
      id: 1,
      answerKeyId: 4,
    });

    answerKeyRepository.findOne.mockResolvedValue({ id: 4 });

    await expect(
      service.create(1, {
        content: { id: "root", path: "", isSelectable: false },
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('hides an answer key from non-admin users', async () => {

    answerKeyRepository.findOne.mockResolvedValue({ id: 4 });

    assignmentRepository.findOne.mockResolvedValue({
      id: 1,
      answerKeyVisible: false,
    });

    await expect(service.findOne(1, false)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows admins to view a hidden answer key', async () => {

    const answerKey = { id: 4 };

    answerKeyRepository.findOne.mockResolvedValue(answerKey);

    assignmentRepository.findOne.mockResolvedValue({
      id: 1,
      answerKeyVisible: false,
    });

    await expect(service.findOne(1, true)).resolves.toBe(answerKey);
  });

  it('clears the assignment link and visibility when removing', async () => {
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
    answerKeyRepository.findOne.mockResolvedValue(null);

    await expect(
      service.update(1, {
        content: { id: "root", path: "", isSelectable: false },
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
