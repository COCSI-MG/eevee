const carrinho = require('./app');

describe('Testes da Função Carrinho', () => {
  test('Compra sem desconto - 1 camisa', () => {
    expect(carrinho(1, 0, 0)).toBe(30);
  });

  test('Compra sem desconto - 1 calça', () => {
    expect(carrinho(0, 1, 0)).toBe(70);
  });

  test('Compra sem desconto - 1 bermuda', () => {
    expect(carrinho(0, 0, 1)).toBe(50);
  });

  test('Compra sem desconto - total exatamente 100', () => {
    expect(carrinho(1, 1, 0)).toBe(100);
  });

  test('Compra com desconto - total 150', () => {
    expect(carrinho(1, 1, 1)).toBe(135);
  });

  test('Compra com desconto - múltiplos itens', () => {
    expect(carrinho(2, 1, 2)).toBe(207);
  });

  test('Compra com desconto - apenas bermudas', () => {
    expect(carrinho(0, 0, 3)).toBe(135);
  });
});