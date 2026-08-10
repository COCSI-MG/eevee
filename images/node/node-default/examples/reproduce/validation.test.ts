import { main } from './app';

describe('operações básicas', () => {
  const [soma, subtracao, multiplicacao, divisao] = main(6, 2);

  it('deve somar', () => {
    expect(soma).toBe(8);
  });

  it('deve subtrair', () => {
    expect(subtracao).toBe(4);
  });

  it('deve multiplicar', () => {
    expect(multiplicacao).toBe(12);
  });

  it('deve dividir', () => {
    expect(divisao).toBe(3);
  });
});
