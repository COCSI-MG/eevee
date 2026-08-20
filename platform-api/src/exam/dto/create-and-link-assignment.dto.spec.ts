import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateAndLinkAssignmentDto } from './create-and-link-assignment.dto';
import { WorkerType } from 'src/worker/enum/worker-type.enum';

describe('CreateAndLinkAssignmentDto', () => {
  const make = (data: Partial<CreateAndLinkAssignmentDto>) =>
    plainToInstance(CreateAndLinkAssignmentDto, data);

  const validAssignmentFields = {
    classId: 5,
    title: 'Activity 1',
    description: 'desc',
    maxAttempts: 3,
    workerType: WorkerType.NODE_DEFAULT,
    templates: [],
  };

  it('passes with valid score and required assignment fields', async () => {
    const dto = make({ ...validAssignmentFields, score: 3 });
    const errors = await validate(dto);
    expect(errors).toEqual([]);
  });

  it('fails when score is missing', async () => {
    const dto = make(validAssignmentFields);
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'score')).toBe(true);
  });

  it('fails when score is 0', async () => {
    const dto = make({ ...validAssignmentFields, score: 0 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'score')).toBe(true);
  });

  it('fails when score is negative', async () => {
    const dto = make({ ...validAssignmentFields, score: -5 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'score')).toBe(true);
  });

  it('fails when score has more than 2 decimal places', async () => {
    const dto = make({ ...validAssignmentFields, score: 1.234 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'score')).toBe(true);
  });

  it('still fails when assignment title is missing', async () => {
    const dto = make({ score: 3 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'title')).toBe(true);
  });
});
