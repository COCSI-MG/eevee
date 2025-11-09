const fatorial = require('./app');

describe('Testes da Função Fatorial', () => {
  test('Deve retornar 1 para fatorial de 0', () => {
    expect(fatorial(0)).toBe(1);
  });

  test('Deve retornar 1 para fatorial de 1', () => {
    expect(fatorial(1)).toBe(1);
  });

  test('Deve calcular corretamente fatorial de 5', () => {
    expect(fatorial(5)).toBe(120);
  });

  test('Deve calcular corretamente fatorial de 7', () => {
    expect(fatorial(7)).toBe(5040);
  });

  test('Deve calcular corretamente fatorial de 10', () => {
    expect(fatorial(10)).toBe(3628800);
  });
});