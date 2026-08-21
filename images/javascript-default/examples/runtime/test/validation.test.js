import { main } from '../src/app';
import { vars } from '../src/template-variables';

describe('runtime layout', () => {
  it('loads source and generated variables from the mounted directories', () => {
    expect(main(3)).toBe(3 * vars.multiplier);
  });
});
