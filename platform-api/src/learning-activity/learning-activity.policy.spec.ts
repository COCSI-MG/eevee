import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  LearningActivityDto,
  QuizQuestionDto,
  SubmitQuizDto,
} from './learning-activity.dto';
import {
  canonicalJson,
  gradeQuiz,
  publicQuestions,
  validateActivity,
} from './learning-activity.policy';
const questions: QuizQuestionDto[] = [
  {
    id: 'q1',
    prompt: 'Qual comando insere linhas?',
    choices: [
      { id: 'a', text: 'INSERT' },
      { id: 'b', text: 'UPDATE' },
    ],
    correctChoiceId: 'a',
    explanation: 'INSERT cria linhas.',
  },
  {
    id: 'q2',
    prompt: 'Qual comando altera linhas?',
    choices: [
      { id: 'a', text: 'INSERT' },
      { id: 'b', text: 'UPDATE' },
    ],
    correctChoiceId: 'b',
    explanation: 'UPDATE altera linhas.',
  },
];
const dto = (): LearningActivityDto => ({
  classId: 1,
  kind: 'quiz',
  title: 'DML',
  description: '',
  published: true,
  maxAttempts: 1,
  feedbackReleased: false,
  questions: structuredClone(questions),
});
describe('Native quiz policy', () => {
  it('grades on the server using stored correct choices', () => {
    expect(
      gradeQuiz(questions, [
        { questionId: 'q1', choiceId: 'a' },
        { questionId: 'q2', choiceId: 'a' },
      ]),
    ).toBe(0.5);
    expect(
      gradeQuiz(questions, [
        { questionId: 'q2', choiceId: 'b' },
        { questionId: 'q1', choiceId: 'a' },
      ]),
    ).toBe(1);
  });
  it.each([
    [{ questionId: 'q1', choiceId: 'a' }],
    [
      { questionId: 'q1', choiceId: 'a' },
      { questionId: 'q1', choiceId: 'a' },
    ],
    [
      { questionId: 'q1', choiceId: 'forged' },
      { questionId: 'q2', choiceId: 'b' },
    ],
    [
      { questionId: 'other-activity', choiceId: 'a' },
      { questionId: 'q2', choiceId: 'b' },
    ],
  ])('rejects incomplete, duplicate or forged answers', (...answers) =>
    expect(() => gradeQuiz(questions, answers)).toThrow(),
  );
  it('removes both correct answers and explanations before student serialization', () => {
    const publicData = publicQuestions(questions)!;
    expect(publicData[0]).toEqual({
      id: 'q1',
      prompt: questions[0].prompt,
      choices: questions[0].choices,
    });
    expect(JSON.stringify(publicData)).not.toContain('correctChoiceId');
    expect(JSON.stringify(publicData)).not.toContain('INSERT cria');
  });
  it('rejects inconsistent teacher configuration', () => {
    const data = dto();
    data.questions![0].correctChoiceId = 'unknown';
    expect(() => validateActivity(data)).toThrow();
    data.questions = questions;
    data.startDate = '2026-10-10';
    data.dueDate = '2026-10-01';
    expect(() => validateActivity(data)).toThrow();
  });
  it('compares JSONB content independently of object key order', () =>
    expect(canonicalJson({ b: 2, a: [{ d: 4, c: 3 }] })).toBe(
      canonicalJson({ a: [{ c: 3, d: 4 }], b: 2 }),
    ));
  it('rejects duplicate choice text rather than grading ambiguous alternatives', () => {
    const data = dto();
    data.questions![0].choices[1].text = ' INSERT ';
    expect(() => validateActivity(data)).toThrow();
  });
  it('validates nested input and bounds request size', async () => {
    expect(
      await validate(plainToInstance(LearningActivityDto, dto())),
    ).toHaveLength(0);
    expect(
      (
        await validate(
          plainToInstance(SubmitQuizDto, {
            answers: [{ questionId: 'q1', choiceId: 4 }],
          }),
        )
      ).length,
    ).toBeGreaterThan(0);
    expect(
      (
        await validate(
          plainToInstance(SubmitQuizDto, {
            answers: Array(101).fill({ questionId: 'q1', choiceId: 'a' }),
          }),
        )
      ).length,
    ).toBeGreaterThan(0);
  });
});
