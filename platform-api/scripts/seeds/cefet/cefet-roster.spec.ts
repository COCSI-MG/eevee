import { parseCefetRoster } from './cefet-roster';

describe('CEFET roster parser', () => {
  it('preserves display names and deduplicates only within a course', () => {
    const courses = parseCefetRoster(`Banco de Dados II\nJoão da Silva\nJOAO DA SILVA\n\nCiência de Dados\nJoão da Silva`);
    expect(courses).toEqual([
      { name: 'Banco de Dados II', students: ['João da Silva'] },
      { name: 'Ciência de Dados', students: ['João da Silva'] },
    ]);
  });
});
