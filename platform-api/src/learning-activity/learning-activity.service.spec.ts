import { LearningActivityService } from './learning-activity.service';
import {
  LearningActivity,
  LearningQuizAttempt,
} from './learning-activity.entity';
import { Class } from 'src/class/entities/class.entity';

describe('Learning activity access and submission lifecycle', () => {
  const questions = [
    {
      id: 'q',
      prompt: 'Choose',
      choices: [
        { id: 'a', text: 'A' },
        { id: 'b', text: 'B' },
      ],
      correctChoiceId: 'a',
      explanation: 'secret',
    },
  ];
  let activity: any;
  let user: any;
  let manager: any;
  let service: LearningActivityService;
  let query: any;
  beforeEach(() => {
    activity = {
      id: 1,
      classId: 4,
      kind: 'quiz',
      title: 'Quiz',
      description: '',
      published: true,
      startDate: null,
      dueDate: null,
      maxAttempts: 1,
      feedbackReleased: false,
      questions,
      practice: null,
    };
    user = { userId: 7, isAdmin: false };
    query = {
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      getOne: jest.fn(async () => activity),
    };
    manager = {
      exists: jest.fn(async (entity) => entity !== LearningQuizAttempt),
      count: jest.fn(async () => 0),
      create: jest.fn((_, value) => value),
      save: jest.fn(async (_, value) => ({
        ...value,
        id: 12,
        createdAt: new Date(),
      })),
      getRepository: jest.fn(() => ({
        createQueryBuilder: () => query,
        find: async () => [
          {
            id: 1,
            userId: 7,
            attempt: 1,
            answers: [{ questionId: 'q', choiceId: 'a' }],
            score: 1,
          },
        ],
      })),
    };
    const db: any = {
      manager,
      transaction: (fn) => fn(manager),
      getRepository: manager.getRepository,
    };
    service = new LearningActivityService(
      { find: async () => [activity] } as any,
      db,
      { getUser: () => user } as any,
    );
  });
  it('denies non-members even when they know the activity ID', async () => {
    manager.exists.mockImplementation(async (entity) => entity === Class);
    await expect(service.get(1)).rejects.toThrow();
    await expect(
      service.submit(1, { answers: [{ questionId: 'q', choiceId: 'a' }] }),
    ).rejects.toThrow();
    expect(manager.save).not.toHaveBeenCalled();
  });
  it.each(['draft', 'future'])(
    'hides %s activities from students',
    async (mode) => {
      if (mode === 'draft') activity.published = false;
      else activity.startDate = new Date('2099-01-01');
      await expect(service.get(1)).rejects.toThrow();
      expect(await service.list(4)).toEqual([]);
    },
  );
  it('redacts student details and withholds scores until teacher release', async () => {
    expect((await service.get(1)).questions![0]).not.toHaveProperty(
      'correctChoiceId',
    );
    expect((await service.attempts(1))[0]).toMatchObject({
      score: null,
      feedback: undefined,
    });
    activity.feedbackReleased = true;
    expect((await service.attempts(1))[0]).toMatchObject({
      score: 1,
      feedback: [
        { questionId: 'q', correctChoiceId: 'a', explanation: 'secret' },
      ],
    });
  });
  it('locks the activity in the transaction before enforcing attempts and hides the immediate score', async () => {
    const result = await service.submit(1, {
      answers: [{ questionId: 'q', choiceId: 'a' }],
    });
    expect(query.setLock).toHaveBeenCalledWith('pessimistic_write');
    expect(result.score).toBeNull();
    expect(manager.save).toHaveBeenCalledWith(
      LearningQuizAttempt,
      expect.objectContaining({ userId: 7, score: 1, attempt: 1 }),
    );
  });
  it.each(['deadline', 'limit', 'released', 'practice'])(
    'rejects submission when %s',
    async (mode) => {
      if (mode === 'deadline') activity.dueDate = new Date('2000-01-01');
      if (mode === 'limit') manager.count.mockResolvedValue(1);
      if (mode === 'released') activity.feedbackReleased = true;
      if (mode === 'practice') activity.kind = 'practice';
      await expect(
        service.submit(1, { answers: [{ questionId: 'q', choiceId: 'a' }] }),
      ).rejects.toThrow();
      expect(manager.save).not.toHaveBeenCalled();
    },
  );
  it('rejects student authoring', async () => {
    await expect(service.create(activity)).rejects.toThrow();
    await expect(service.update(1, activity)).rejects.toThrow();
  });
  it('preserves assessed questions and cannot reopen a revealed answer key', async () => {
    user.isAdmin = true;
    manager.exists.mockResolvedValue(true);
    await expect(
      service.update(1, {
        ...activity,
        questions: [{ ...questions[0], prompt: 'Changed' }],
      }),
    ).rejects.toThrow();
    activity.feedbackReleased = true;
    await expect(
      service.update(1, { ...activity, feedbackReleased: false }),
    ).rejects.toThrow();
  });
});
