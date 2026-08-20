import { PYTHON_EXAMPLES } from '../../../scripts/seed-python-examples';

describe('seeded Python examples', () => {
  it('provides the expected introductory exercise set', () => {
    expect(PYTHON_EXAMPLES).toHaveLength(6);
  });

  describe.each(PYTHON_EXAMPLES)('$code - $title', (example) => {
    it('defines the main entrypoint required by the workspace preflight', () => {
      expect(example.boilerplateContent).toMatch(/^\s*def\s+main\s*\(/m);
    });

    it('documents and evaluates the main entrypoint', () => {
      expect(example.description).toMatch(/\bmain\s*\(/);
      expect(example.testContent).toMatch(/from app import [^\n]*\bmain\b/);
      expect(example.testContent).toMatch(/\bmain\s*\(/);
    });
  });
});
