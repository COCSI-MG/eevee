import { PracticeConfig } from "@/app/interface/scheduler-api/learning-activity";
export function sqlPractice(): PracticeConfig {
  return {
    lab: "sql",
    setupSql: `CREATE TABLE funcionarios (id INTEGER PRIMARY KEY, nome TEXT NOT NULL, departamento TEXT NOT NULL, salario NUMERIC(10,2) NOT NULL);
INSERT INTO funcionarios VALUES (1, 'Ana', 'TI', 5000), (2, 'Bruno', 'RH', 4000), (3, 'Carla', 'TI', 6000);`,
    tasks: [
      {
        id: "update",
        prompt:
          "Aumente em 10% os salários do departamento TI. Preserve os salários dos demais departamentos. Consulte a tabela antes e depois.",
        starter: "SELECT * FROM funcionarios ORDER BY id;",
        checkSql: "SELECT id, salario FROM funcionarios ORDER BY id",
        expectedRows:
          '[{"id":1,"salario":"5500.00"},{"id":2,"salario":"4000.00"},{"id":3,"salario":"6600.00"}]',
      },
      {
        id: "insert",
        prompt:
          "Insira Diego no departamento RH, com id 4 e salário 3500. Preserve os três registros iniciais.",
        starter: "SELECT * FROM funcionarios ORDER BY id;",
        checkSql: "SELECT * FROM funcionarios ORDER BY id",
        expectedRows:
          '[{"id":1,"nome":"Ana","departamento":"TI","salario":"5000.00"},{"id":2,"nome":"Bruno","departamento":"RH","salario":"4000.00"},{"id":3,"nome":"Carla","departamento":"TI","salario":"6000.00"},{"id":4,"nome":"Diego","departamento":"RH","salario":"3500.00"}]',
      },
      {
        id: "delete",
        prompt:
          "Remova somente os funcionários do departamento RH. Confira quais registros permaneceram.",
        starter: "SELECT * FROM funcionarios ORDER BY id;",
        checkSql: "SELECT * FROM funcionarios ORDER BY id",
        expectedRows:
          '[{"id":1,"nome":"Ana","departamento":"TI","salario":"5000.00"},{"id":3,"nome":"Carla","departamento":"TI","salario":"6000.00"}]',
      },
      {
        id: "rollback",
        prompt:
          "Experimente uma alteração dentro de BEGIN e desfaça com ROLLBACK. Ao verificar, a tabela deve estar no estado inicial.",
        starter:
          "BEGIN;\nUPDATE funcionarios SET salario = 0;\nSELECT * FROM funcionarios;\n-- Experimente ROLLBACK antes de verificar.",
        checkSql: "SELECT * FROM funcionarios ORDER BY id",
        expectedRows:
          '[{"id":1,"nome":"Ana","departamento":"TI","salario":"5000.00"},{"id":2,"nome":"Bruno","departamento":"RH","salario":"4000.00"},{"id":3,"nome":"Carla","departamento":"TI","salario":"6000.00"}]',
      },
    ],
  };
}
export function architecturePractice(): PracticeConfig {
  return {
    lab: "architecture",
    setupSql: "",
    tasks: [
      {
        id: "decimal-binary",
        prompt:
          "Represente 45 em binário. Experimente os oito bits e observe o valor de cada posição.",
        starter: "00000000",
        tool: "base",
        inputBase: 2,
        expectedValue: "45",
      },
      {
        id: "hexadecimal",
        prompt:
          "Represente 254 em hexadecimal. Compare os grupos de quatro bits.",
        starter: "0",
        tool: "base",
        inputBase: 16,
        expectedValue: "254",
      },
      {
        id: "fraction",
        prompt:
          "Represente 0,625 em binário. Use ponto para separar a parte fracionária.",
        starter: "0.0",
        tool: "base",
        inputBase: 2,
        expectedValue: "0.625",
      },
      {
        id: "storage",
        prompt:
          "Quantos bytes há em 4 MiB? Selecione B e informe a quantidade. Na prática livre, compare MB e MiB.",
        starter: "0",
        tool: "storage",
        expectedValue: "4194304",
      },
    ],
  };
}
