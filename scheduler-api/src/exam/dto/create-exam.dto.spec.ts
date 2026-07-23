import { validate } from 'class-validator';
import { CreateExamDto } from './create-exam.dto';

describe('CreateExamDto', () => {
  it('fails validation when title is missing or blank', async () => {
    const cases: Array<Partial<CreateExamDto>> = [
      {},
      { title: '' },
      { title: '   ' },
    ];

    for (const payload of cases) {
      const dto = Object.assign(new CreateExamDto(), payload);
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'title')).toBe(true);
    }
  });

  it('passes validation with the minimum required payload', async () => {
    const dto = Object.assign(new CreateExamDto(), { title: 'Midterm' });
    const errors = await validate(dto);
    expect(errors).toEqual([]);
  });

  it('passes validation with a valid startDate', async () => {
    const dto = Object.assign(new CreateExamDto(), {
      title: 'Midterm',
      startDate: '2026-08-15T12:00:00Z',
    });
    const errors = await validate(dto);
    expect(errors).toEqual([]);
  });

  it('fails validation when startDate is not a valid ISO string', async () => {
    const dto = Object.assign(new CreateExamDto(), {
      title: 'Midterm',
      startDate: 'not-a-date',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'startDate')).toBe(true);
  });
});
