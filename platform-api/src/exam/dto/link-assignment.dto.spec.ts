import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { LinkAssignmentDto } from './link-assignment.dto';

describe('LinkAssignmentDto', () => {
  const make = (data: Partial<LinkAssignmentDto>) =>
    plainToInstance(LinkAssignmentDto, data);

  it('passes with a valid positive score', async () => {
    const dto = make({ score: 3 });
    const errors = await validate(dto);
    expect(errors).toEqual([]);
  });

  it('passes with a fractional score', async () => {
    const dto = make({ score: 1.5 });
    const errors = await validate(dto);
    expect(errors).toEqual([]);
  });

  it('fails when score is missing', async () => {
    const dto = make({});
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'score')).toBe(true);
  });

  it('fails when score is 0', async () => {
    const dto = make({ score: 0 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'score')).toBe(true);
  });

  it('fails when score is negative', async () => {
    const dto = make({ score: -1 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'score')).toBe(true);
  });

  it('fails when score has more than 2 decimal places', async () => {
    const dto = make({ score: 1.234 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'score')).toBe(true);
  });
});
