import { main } from './app';

describe('main', () => {
  it('returns the basic arithmetic operations', () => {
    expect(main(6, 2)).toEqual([8, 4, 12, 3]);
  });
});
