const bhaskaraFunction = require("./app");

describe("Testes da Função Bhaskara", () => {
  test("Deve calcular corretamente as raízes para a=1, b=-3, c=2", () => {
    const { x1, x2 } = bhaskaraFunction(1, -3, 2);
    expect(x1).toBe(2);
    expect(x2).toBe(1);
  });

  test("Deve retornar raízes iguais quando o discriminante for zero", () => {
    const { x1, x2 } = bhaskaraFunction(1, -2, 1);
    expect(x1).toBe(1);
    expect(x2).toBe(1);
  });

  test("Deve retornar NaN quando o discriminante for negativo", () => {
    const { x1, x2 } = bhaskaraFunction(1, 2, 5);
    expect(x1).toBeNaN();
    expect(x2).toBeNaN();
  });
});
