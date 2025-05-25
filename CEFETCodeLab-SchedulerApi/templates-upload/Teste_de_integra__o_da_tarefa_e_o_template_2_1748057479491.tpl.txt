import { main } from './app';

function math_add(a: number, b: number) {
  return a + b;
}

function math_sub(a: number, b: number) {
  return a - b;
}

function math_mul(a: number, b: number) {
  return a * b;
}

function math_div(a: number, b: number) {
  return a / b;
}

describe('main', () => {
  it('should be able to sum', () => {
    const correctResult = math_add(2, 3);
    const providedResult = main(2, 3);
    expect(providedResult[0]).toEqual(correctResult);
  });
  it('should be able to subtract', () => {
    const correctResult = math_sub(2, 3);
    const providedResult = main(2, 3);
    expect(providedResult[1]).toEqual(correctResult);
  });
  it('should be able to multiply', () => {
    const correctResult = math_mul(2, 3);
    const providedResult = main(2, 3);
    expect(providedResult[2]).toEqual(correctResult);
  });
  it('should be able to divide', () => {
    const correctResult = math_div(2, 3);
    const providedResult = main(2, 3);
    expect(providedResult[3]).toEqual(correctResult);
  });
});