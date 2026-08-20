import { BadRequestException } from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { AssignmentTemplateDto } from './dto/create-assignment.dto';


const proto = AssignmentService.prototype as any;
const normalize = (templates: AssignmentTemplateDto[]): number[] =>
  proto.normalizeTemplateWeights(templates);

const tpl = (weight?: number): AssignmentTemplateDto => ({
  templateId: 1,
  params: [],
  weight,
});

describe('normalizeTemplateWeights', () => {

  describe('Case A – all weights missing (even split)', () => {
    it('splits 100% evenly across 3 templates → 33.33 / 33.33 / 33.34', () => {
      const result = normalize([tpl(), tpl(), tpl()]);
      expect(result).toEqual([33.33, 33.33, 33.34]);
      expect(result.reduce((s, w) => s + w, 0)).toBeCloseTo(100, 10);
    });

    it('splits 100% evenly across 2 templates → 50.00 / 50.00', () => {
      const result = normalize([tpl(), tpl()]);
      expect(result).toEqual([50, 50]);
      expect(result.reduce((s, w) => s + w, 0)).toBeCloseTo(100, 10);
    });

    it('single template → 100.00', () => {
      const result = normalize([tpl()]);
      expect(result).toEqual([100]);
    });

    it('empty input → empty output', () => {
      expect(normalize([])).toEqual([]);
    });

    it('7 templates → sum exactly 100.00', () => {
      const result = normalize([tpl(), tpl(), tpl(), tpl(), tpl(), tpl(), tpl()]);
      const sum = result.reduce((s, w) => s + w, 0);
      expect(sum).toBeCloseTo(100, 10);
    });

    it('4 templates → sum exactly 100.00', () => {
      const result = normalize([tpl(), tpl(), tpl(), tpl()]);
      expect(result).toEqual([25, 25, 25, 25]);
      expect(result.reduce((s, w) => s + w, 0)).toBeCloseTo(100, 10);
    });

    it('5 templates → sum exactly 100.00', () => {
      const result = normalize([tpl(), tpl(), tpl(), tpl(), tpl()]);
      const sum = result.reduce((s, w) => s + w, 0);
      expect(sum).toBeCloseTo(100, 10);
    });
  });

  describe('Case D – single missing weight receives the remainder', () => {
    it('60 + missing + 30 → 60 + 10 + 30', () => {
      expect(normalize([tpl(60), tpl(), tpl(30)])).toEqual([60, 10, 30]);
    });

    it('missing + 100 → 0 + 100', () => {
      expect(normalize([tpl(), tpl(100)])).toEqual([0, 100]);
    });

    it('90 + missing → 90 + 10', () => {
      expect(normalize([tpl(90), tpl()])).toEqual([90, 10]);
    });

    it('50 + missing + 25 → 50 + 25 + 25', () => {
      expect(normalize([tpl(50), tpl(), tpl(25)])).toEqual([50, 25, 25]);
    });

    it('throws when explicit weights already exceed 100', () => {
      expect(() => normalize([tpl(80), tpl(), tpl(30)])).toThrow(BadRequestException);
    });
  });

  describe('Case B – multiple missing weights split the remainder', () => {
    it('60 + missing + missing + 25 → remainder 15 split across 2 missing', () => {
      const result = normalize([tpl(60), tpl(), tpl(), tpl(25)]);
      expect(result).toEqual([60, 7.5, 7.5, 25]);
      expect(result.reduce((s, w) => s + w, 0)).toBeCloseTo(100, 10);
    });

    it('60 + missing + missing + 25 + missing → remainder 15 split across 3 missing', () => {
      const result = normalize([tpl(60), tpl(), tpl(), tpl(25), tpl()]);
      expect(result).toEqual([60, 5, 5, 25, 5]);
      expect(result.reduce((s, w) => s + w, 0)).toBeCloseTo(100, 10);
    });

    it('missing + missing + 33.33 + 33.33 → splits 33.34 across two missing', () => {
      const result = normalize([tpl(), tpl(), tpl(33.33), tpl(33.33)]);
      const sum = result.reduce((s, w) => s + w, 0);
      expect(sum).toBeCloseTo(100, 10);
      expect(result[0]).toBeCloseTo(16.67, 2);
      expect(result[1]).toBeCloseTo(16.67, 2);
      expect(result[2]).toBe(33.33);
      expect(result[3]).toBe(33.33);
    });

    it('all missing except one: 40 + missing + missing → remainder 60 split', () => {
      const result = normalize([tpl(40), tpl(), tpl()]);
      expect(result).toEqual([40, 30, 30]);
      expect(result.reduce((s, w) => s + w, 0)).toBeCloseTo(100, 10);
    });

    it('throws when explicit weights already exceed 100', () => {
      expect(() => normalize([tpl(80), tpl(), tpl(30)])).toThrow(BadRequestException);
    });
  });

  describe('Case C – all explicit weights must sum to exactly 100%', () => {
    it('33.33 + 33.33 + 33.34 → accepted', () => {
      expect(normalize([tpl(33.33), tpl(33.33), tpl(33.34)])).toEqual([33.33, 33.33, 33.34]);
    });

    it('100 → accepted', () => {
      expect(normalize([tpl(100)])).toEqual([100]);
    });

    it('50 + 50 → accepted', () => {
      expect(normalize([tpl(50), tpl(50)])).toEqual([50, 50]);
    });

    it('throws when sum is 99.99', () => {
      expect(() =>
        normalize([tpl(33.33), tpl(33.33), tpl(33.33)]),
      ).toThrow(BadRequestException);

      try {
        normalize([tpl(33.33), tpl(33.33), tpl(33.33)]);
      } catch (e: any) {
        expect(e.message).toContain('must sum to 100%');
        expect(e.message).toContain('99.99');
      }
    });

    it('throws when sum is 50%', () => {
      expect(() => normalize([tpl(50)])).toThrow(BadRequestException);

      try {
        normalize([tpl(50)]);
      } catch (e: any) {
        expect(e.message).toContain('must sum to 100%');
        expect(e.message).toContain('50%');
      }
    });

    it('throws when sum is 120%', () => {
      expect(() => normalize([tpl(60), tpl(60)])).toThrow(BadRequestException);
    });
  });

  describe('out-of-range validation', () => {
    it('negative weight → throws', () => {
      expect(() => normalize([tpl(-1)])).toThrow(BadRequestException);

      try {
        normalize([tpl(-1)]);
      } catch (e: any) {
        expect(e.message).toContain('must be between 0 and 100');
        expect(e.message).toContain('-1');
      }
    });

    it('weight > 100 → throws', () => {
      expect(() => normalize([tpl(101)])).toThrow(BadRequestException);

      try {
        normalize([tpl(101)]);
      } catch (e: any) {
        expect(e.message).toContain('must be between 0 and 100');
        expect(e.message).toContain('101');
      }
    });

    it('negative weight in a mix → throws', () => {
      expect(() => normalize([tpl(50), tpl(-10)])).toThrow(BadRequestException);
    });

    it('weight > 100 in a mix → throws', () => {
      expect(() => normalize([tpl(50), tpl(150)])).toThrow(BadRequestException);
    });
  });

  describe('rounding edge case', () => {
    it('3 templates with no weights → 33.33 / 33.33 / 33.34 (sum exactly 100)', () => {
      const result = normalize([tpl(), tpl(), tpl()]);
      expect(result).toEqual([33.33, 33.33, 33.34]);
      expect(result.reduce((s, w) => s + w, 0)).toBe(100);
    });

    it('any N of templates with no weights sums to exactly 100.00', () => {
      for (let n = 1; n <= 30; n++) {
        const result = normalize(Array.from({ length: n }, () => tpl()));
        const sum = result.reduce((s, w) => s + w, 0);
        expect(sum).toBeCloseTo(100, 8);
      }
    });
  });
});
