import type {
  PracticeConfigDto,
  PracticeTaskDto,
} from '../../src/learning-activity/learning-activity.dto';

// These reference solutions are used only by seed validation, never sent to students.
export const sqlReferences: Record<string, string> = {};
const setupSql = `
CREATE TABLE livro (id_livro integer PRIMARY KEY, titulo text, autor text, ano integer);
CREATE TABLE usuarios (id integer PRIMARY KEY, nome text, status text, data_modificacao date);
INSERT INTO usuarios VALUES (1,'Ana','Ativo','2026-01-01'),(45,'Bruno','Ativo','2026-01-01');
CREATE TABLE funcionario (id integer PRIMARY KEY, nome text, departamento text, salario integer, tempo_servico integer);
INSERT INTO funcionario VALUES (1,'Ana','TI',5000,6),(2,'Bruno','RH',4000,3),(3,'Carla','TI',6000,5);
CREATE TABLE clientes (id integer PRIMARY KEY, nome text, email text UNIQUE);
INSERT INTO clientes VALUES (9,'Existente','maria@email.com');
CREATE TABLE acervo (id_item integer PRIMARY KEY, titulo text, emprestado char(1));
INSERT INTO acervo VALUES (1,'SQL','S'),(2,'Redes','N'),(3,'Sistemas','S');
CREATE TABLE configuracao (id integer PRIMARY KEY, taxa integer);
INSERT INTO configuracao VALUES (1,10),(2,20);
CREATE TABLE alunos (id integer PRIMARY KEY, nome text);
CREATE TABLE documentos (id integer PRIMARY KEY, data_criacao date, status text);
INSERT INTO documentos VALUES (1,'2019-12-31','Archived'),(2,'2020-01-01','Archived'),(3,'2019-01-01','Active');
CREATE TABLE temprelatorio (id integer PRIMARY KEY, total integer);
INSERT INTO temprelatorio VALUES (1,10),(2,20);
CREATE TABLE relatorio (id integer PRIMARY KEY, total integer);
CREATE TABLE pai (id integer PRIMARY KEY);
CREATE TABLE filho (id integer PRIMARY KEY, pai_id integer REFERENCES pai(id) ON DELETE CASCADE);
INSERT INTO pai VALUES (1),(2); INSERT INTO filho VALUES (1,1),(2,1),(3,2);
CREATE TABLE produtos (id integer PRIMARY KEY, preco integer);
INSERT INTO produtos VALUES (1,100),(2,50);
CREATE TABLE logs (id integer PRIMARY KEY, dias_criacao integer);
INSERT INTO logs VALUES (1,31),(2,30),(3,1);
CREATE TABLE autores (id_autor integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, nome text, nacionalidade text);
CREATE TABLE reajustes (departamento text PRIMARY KEY, salario integer);
INSERT INTO reajustes VALUES ('TI',8000),('RH',4500);
CREATE TABLE editoras (nome text, cidade text);
CREATE TABLE acesso (id integer PRIMARY KEY, ip text);
INSERT INTO acesso VALUES (1,'192.168.1.1'),(2,'192.168.2.2'),(3,'10.0.0.1');
CREATE TABLE emprestimos (id integer PRIMARY KEY, data_devolucao date);
INSERT INTO emprestimos VALUES (1,NULL);
CREATE TABLE estoque (id integer PRIMARY KEY, quantidade integer);
INSERT INTO estoque VALUES (1,5);
CREATE TABLE categorias (id_categoria integer PRIMARY KEY);
INSERT INTO categorias VALUES (1),(2),(3),(4);
CREATE TABLE artigos (id integer PRIMARY KEY, conteudo text);
INSERT INTO artigos VALUES (1,NULL),(2,''),(3,'SQL');
CREATE TABLE tabela (col1 integer PRIMARY KEY);
`;
function task(
  n: number,
  prompt: string,
  table: string,
  checkSql: string,
  rows: unknown[],
  solution: string,
): PracticeTaskDto {
  const id = `sql-${String(n).padStart(2, '0')}`;
  sqlReferences[id] = solution;
  return {
    id,
    prompt: `Q${String(n).padStart(2, '0')} — ${prompt} A tarefa começa com a base inicial; use Reiniciar para repetir.`,
    starter: `SELECT * FROM ${table};`,
    checkSql,
    expectedRows: JSON.stringify(rows),
  };
}
const people = [
  { id: 1, nome: 'Ana', departamento: 'TI', salario: 5000, tempo_servico: 6 },
  { id: 2, nome: 'Bruno', departamento: 'RH', salario: 4000, tempo_servico: 3 },
  { id: 3, nome: 'Carla', departamento: 'TI', salario: 6000, tempo_servico: 5 },
];
export const sqlPractice: PracticeConfigDto = {
  lab: 'sql',
  setupSql,
  tasks: [
    task(
      1,
      'Insira o livro (1, SQL, Ana, 2026), usando INSERT INTO.',
      'livro',
      'SELECT * FROM livro ORDER BY id_livro',
      [{ id_livro: 1, titulo: 'SQL', autor: 'Ana', ano: 2026 }],
      "INSERT INTO livro VALUES (1,'SQL','Ana',2026);",
    ),
    task(
      2,
      'Insira o livro 101, Banco de Dados, Silberschatz, 2020. Escreva a lista de colunas explicitamente.',
      'livro',
      'SELECT * FROM livro ORDER BY id_livro',
      [
        {
          id_livro: 101,
          titulo: 'Banco de Dados',
          autor: 'Silberschatz',
          ano: 2020,
        },
      ],
      "INSERT INTO livro (id_livro,titulo,autor,ano) VALUES (101,'Banco de Dados','Silberschatz',2020);",
    ),
    task(
      3,
      'Execute DELETE sem WHERE em usuarios. Confira que a tabela continua existindo, vazia.',
      'usuarios',
      'SELECT * FROM usuarios',
      [],
      'DELETE FROM usuarios;',
    ),
    task(
      4,
      'Defina salario=8000 apenas para TI. Preserve RH e as outras colunas.',
      'funcionario',
      'SELECT * FROM funcionario ORDER BY id',
      people.map((p) => ({
        ...p,
        salario: p.departamento === 'TI' ? 8000 : p.salario,
      })),
      "UPDATE funcionario SET salario=8000 WHERE departamento='TI';",
    ),
    task(
      5,
      'Insira os clientes 1/Ana, 2/Bruno e 3/Carla em um único INSERT, sem email. Preserve o cliente existente.',
      'clientes',
      'SELECT * FROM clientes ORDER BY id',
      [
        { id: 1, nome: 'Ana', email: null },
        { id: 2, nome: 'Bruno', email: null },
        { id: 3, nome: 'Carla', email: null },
        { id: 9, nome: 'Existente', email: 'maria@email.com' },
      ],
      "INSERT INTO clientes(id,nome) VALUES (1,'Ana'),(2,'Bruno'),(3,'Carla');",
    ),
    task(
      6,
      'Marque como N os itens emprestados (S), preservando os demais campos.',
      'acervo',
      'SELECT * FROM acervo ORDER BY id_item',
      [
        { id_item: 1, titulo: 'SQL', emprestado: 'N' },
        { id_item: 2, titulo: 'Redes', emprestado: 'N' },
        { id_item: 3, titulo: 'Sistemas', emprestado: 'N' },
      ],
      "UPDATE acervo SET emprestado='N' WHERE emprestado='S';",
    ),
    task(
      7,
      'Compare DELETE e DROP em logs. Para a verificação final, mantenha logs existente, mas sem linhas. Use Reiniciar se remover a estrutura.',
      'logs',
      'SELECT * FROM logs',
      [],
      'DELETE FROM logs;',
    ),
    task(
      8,
      'Aumente todas as taxas em 10%, usando os valores existentes.',
      'configuracao',
      'SELECT * FROM configuracao ORDER BY id',
      [
        { id: 1, taxa: 11 },
        { id: 2, taxa: 22 },
      ],
      'UPDATE configuracao SET taxa=taxa*1.10;',
    ),
    task(
      9,
      'Tente inserir Carlos com id NULL e observe o erro. Depois corrija para id=1. Ao verificar, deve existir somente Carlos com id 1.',
      'alunos',
      'SELECT * FROM alunos ORDER BY id',
      [{ id: 1, nome: 'Carlos' }],
      "INSERT INTO alunos VALUES (1,'Carlos');",
    ),
    task(
      10,
      'Remova somente documentos anteriores a 2020-01-01 com status Archived. Preserve a data limite e documentos Active.',
      'documentos',
      'SELECT id, data_criacao::text, status FROM documentos ORDER BY id',
      [
        { id: 2, data_criacao: '2020-01-01', status: 'Archived' },
        { id: 3, data_criacao: '2019-01-01', status: 'Active' },
      ],
      "DELETE FROM documentos WHERE data_criacao<'2020-01-01' AND status='Archived';",
    ),
    task(
      11,
      'Copie todas as linhas de temprelatorio para relatorio com INSERT ... SELECT.',
      'temprelatorio',
      'SELECT * FROM relatorio ORDER BY id',
      [
        { id: 1, total: 10 },
        { id: 2, total: 20 },
      ],
      'INSERT INTO relatorio SELECT * FROM temprelatorio;',
    ),
    task(
      12,
      'Altere o usuário 45 para Inativo e data_modificacao=2026-09-11 no mesmo UPDATE. Preserve o usuário 1.',
      'usuarios',
      'SELECT id,nome,status,data_modificacao::text FROM usuarios ORDER BY id',
      [
        { id: 1, nome: 'Ana', status: 'Ativo', data_modificacao: '2026-01-01' },
        {
          id: 45,
          nome: 'Bruno',
          status: 'Inativo',
          data_modificacao: '2026-09-11',
        },
      ],
      "UPDATE usuarios SET status='Inativo',data_modificacao='2026-09-11' WHERE id=45;",
    ),
    task(
      13,
      'Exclua pai id=1 e observe os filhos removidos por ON DELETE CASCADE. Preserve pai 2 e seu filho.',
      'filho',
      'SELECT (SELECT json_agg(p ORDER BY id) FROM pai p) AS pais,(SELECT json_agg(f ORDER BY id) FROM filho f) AS filhos',
      [{ pais: [{ id: 2 }], filhos: [{ id: 3, pai_id: 2 }] }],
      'DELETE FROM pai WHERE id=1;',
    ),
    task(
      14,
      'Reduza em 5 o preço de todos os produtos, sem WHERE.',
      'produtos',
      'SELECT * FROM produtos ORDER BY id',
      [
        { id: 1, preco: 95 },
        { id: 2, preco: 45 },
      ],
      'UPDATE produtos SET preco=preco-5;',
    ),
    task(
      15,
      'Remova logs com mais de 30 dias; preserve o registro com exatamente 30 dias.',
      'logs',
      'SELECT * FROM logs ORDER BY id',
      [
        { id: 2, dias_criacao: 30 },
        { id: 3, dias_criacao: 1 },
      ],
      'DELETE FROM logs WHERE dias_criacao>30;',
    ),
    task(
      16,
      'Insira Machado de Assis informando somente nome. Observe a identidade automática e nacionalidade NULL.',
      'autores',
      'SELECT nome,nacionalidade FROM autores ORDER BY id_autor',
      [{ nome: 'Machado de Assis', nacionalidade: null }],
      "INSERT INTO autores(nome) VALUES ('Machado de Assis');",
    ),
    task(
      17,
      'Experimente BEGIN; UPDATE produtos SET preco=0; ROLLBACK;. Confira o estado restaurado e então aplique e confirme um desconto de 5 somente no produto 1.',
      'produtos',
      'SELECT * FROM produtos ORDER BY id',
      [
        { id: 1, preco: 95 },
        { id: 2, preco: 50 },
      ],
      'BEGIN; UPDATE produtos SET preco=0; ROLLBACK; BEGIN; UPDATE produtos SET preco=preco-5 WHERE id=1; COMMIT;',
    ),
    task(
      18,
      'Atualize os salários usando a tabela reajustes, associando os departamentos. Use subconsulta ou UPDATE ... FROM.',
      'funcionario',
      'SELECT * FROM funcionario ORDER BY id',
      people.map((p) => ({
        ...p,
        salario: p.departamento === 'TI' ? 8000 : 4500,
      })),
      'UPDATE funcionario f SET salario=r.salario FROM reajustes r WHERE f.departamento=r.departamento;',
    ),
    task(
      19,
      'Experimente TRUNCATE logs, confira a tabela vazia e insira o log (4,0). Compare com DELETE filtrado.',
      'logs',
      'SELECT * FROM logs ORDER BY id',
      [{ id: 4, dias_criacao: 0 }],
      'TRUNCATE logs; INSERT INTO logs VALUES (4,0);',
    ),
    task(
      20,
      'Insira Editora A, Rio de Janeiro em editoras, que tem exatamente nome e cidade nessa ordem. Compare com a sintaxe que informa as colunas.',
      'editoras',
      'SELECT * FROM editoras',
      [{ nome: 'Editora A', cidade: 'Rio de Janeiro' }],
      "INSERT INTO editoras VALUES ('Editora A','Rio de Janeiro');",
    ),
    task(
      21,
      'Remova os acessos com IP iniciado por 192.168. usando LIKE.',
      'acesso',
      'SELECT * FROM acesso ORDER BY id',
      [{ id: 3, ip: '10.0.0.1' }],
      "DELETE FROM acesso WHERE ip LIKE '192.168.%';",
    ),
    task(
      22,
      'Tente atualizar empréstimo 10 e observe zero linhas afetadas. Depois atualize o empréstimo existente (id=1) para 2026-09-10.',
      'emprestimos',
      'SELECT id,data_devolucao::text FROM emprestimos ORDER BY id',
      [{ id: 1, data_devolucao: '2026-09-10' }],
      "UPDATE emprestimos SET data_devolucao='2026-09-10' WHERE id=10; UPDATE emprestimos SET data_devolucao='2026-09-10' WHERE id=1;",
    ),
    task(
      23,
      'Use MERGE ou INSERT ... ON CONFLICT para ajustar id=1 para quantidade 8 e inserir id=2 com quantidade 3.',
      'estoque',
      'SELECT * FROM estoque ORDER BY id',
      [
        { id: 1, quantidade: 8 },
        { id: 2, quantidade: 3 },
      ],
      'INSERT INTO estoque VALUES (1,8),(2,3) ON CONFLICT(id) DO UPDATE SET quantidade=EXCLUDED.quantidade;',
    ),
    task(
      24,
      'Exclua categorias 1, 2 e 3 usando IN; preserve 4.',
      'categorias',
      'SELECT * FROM categorias ORDER BY id_categoria',
      [{ id_categoria: 4 }],
      'DELETE FROM categorias WHERE id_categoria IN (1,2,3);',
    ),
    task(
      25,
      'Aumente o salário em 5% apenas para quem tem mais de cinco anos de serviço.',
      'funcionario',
      'SELECT * FROM funcionario ORDER BY id',
      people.map((p) => ({
        ...p,
        salario: p.tempo_servico > 5 ? p.salario * 1.05 : p.salario,
      })),
      'UPDATE funcionario SET salario=salario*1.05 WHERE tempo_servico>5;',
    ),
    task(
      26,
      'Tente inserir Maria, id=10, com maria@email.com e observe UNIQUE. Corrija para maria.nova@example.com, preservando o cliente 9.',
      'clientes',
      'SELECT * FROM clientes ORDER BY id',
      [
        { id: 9, nome: 'Existente', email: 'maria@email.com' },
        { id: 10, nome: 'Maria', email: 'maria.nova@example.com' },
      ],
      "INSERT INTO clientes VALUES (10,'Maria','maria.nova@example.com');",
    ),
    task(
      27,
      'Modifique somente o nome do funcionário 2 para Bruno Silva com UPDATE.',
      'funcionario',
      'SELECT * FROM funcionario ORDER BY id',
      people.map((p) => ({ ...p, nome: p.id === 2 ? 'Bruno Silva' : p.nome })),
      "UPDATE funcionario SET nome='Bruno Silva' WHERE id=2;",
    ),
    task(
      28,
      'Remova os artigos com conteudo NULL; preserve a string vazia e o texto SQL.',
      'artigos',
      'SELECT * FROM artigos ORDER BY id',
      [
        { id: 2, conteudo: '' },
        { id: 3, conteudo: 'SQL' },
      ],
      'DELETE FROM artigos WHERE conteudo IS NULL;',
    ),
    task(
      29,
      'Insira 10, 20 e 30 em tabela.col1 em um único comando com múltiplas tuplas.',
      'tabela',
      'SELECT * FROM tabela ORDER BY col1',
      [{ col1: 10 }, { col1: 20 }, { col1: 30 }],
      'INSERT INTO tabela(col1) VALUES (10),(20),(30);',
    ),
    task(
      30,
      'Confira logs com SELECT e o filtro dias_criacao>30. Dentro de uma transação, exclua essas linhas e confirme. Experimente ROLLBACK após Reiniciar.',
      'logs',
      'SELECT * FROM logs ORDER BY id',
      [
        { id: 2, dias_criacao: 30 },
        { id: 3, dias_criacao: 1 },
      ],
      'SELECT * FROM logs WHERE dias_criacao>30; BEGIN; DELETE FROM logs WHERE dias_criacao>30; COMMIT;',
    ),
  ],
};

const numbers: [number, string, number, number][] = [
  [
    9,
    'Calcule o tempo mínimo em segundos para transferir 300 MB a 100 Mbps, sem overhead. Insira o resultado decimal.',
    10,
    24,
  ],
  [
    10,
    'Calcule o período em nanossegundos de um clock de 3,2 GHz. Insira o resultado decimal.',
    10,
    0.3125,
  ],
  [
    11,
    'Calcule a quantidade de bits em 16 bytes e 4 nibbles. Insira o resultado decimal.',
    10,
    144,
  ],
  [
    12,
    'Calcule a largura de banda em GB/s de um barramento de 64 bits a 800 MHz, uma transferência por ciclo.',
    10,
    6.4,
  ],
  [13, 'Represente 45 em binário e explore o peso dos bits.', 2, 45],
  [14, 'Represente 117 em binário, usando oito bits.', 2, 117],
  [15, 'Represente 255 em binário.', 2, 255],
  [
    16,
    'Represente 0,625 em binário. Use ponto para a parte fracionária.',
    2,
    0.625,
  ],
  [17, 'Converta 1101011₂ para decimal.', 10, 107],
  [18, 'Converta 10011100₂ sem sinal para decimal.', 10, 156],
  [19, 'Converta 11101₂ para decimal.', 10, 29],
  [20, 'Converta 0,011₂ para decimal. Use ponto na resposta.', 10, 0.375],
  [21, 'Represente 254 em hexadecimal.', 16, 254],
  [22, 'Represente 4095 em hexadecimal.', 16, 4095],
  [23, 'Represente 170 em hexadecimal.', 16, 170],
  [24, 'Represente 3054 em hexadecimal.', 16, 3054],
  [
    25,
    'Converta 1A3F₁₆ para binário, agrupando mentalmente quatro bits por dígito.',
    2,
    6719,
  ],
  [26, 'Converta C7₁₆ para binário.', 2, 199],
  [
    27,
    'Converta o componente vermelho 4B₁₆ da cor #4B0082 para binário.',
    2,
    75,
  ],
  [28, 'Converta 9F4A₁₆ para binário.', 2, 40778],
  [29, 'Some 1A₁₆ e 10110₂ e informe o resultado decimal.', 10, 48],
  [30, 'Encontre o valor decimal comum a 2B₁₆ e 101011₂.', 10, 43],
];
export const architecturePractice: PracticeConfigDto = {
  lab: 'architecture',
  setupSql: '',
  tasks: [
    {
      id: 'architecture-07',
      prompt:
        'Q07 — Compare kB e KiB. Quantos bytes há em 1 KiB? Selecione B e digite o resultado; depois experimente os prefixos livremente.',
      starter: '0',
      tool: 'storage',
      expectedValue: '1024',
    },
    {
      id: 'architecture-08',
      prompt:
        'Q08 — Quantos bytes há em 4 MiB? Selecione B e informe a quantidade.',
      starter: '0',
      tool: 'storage',
      expectedValue: '4194304',
    },
    ...numbers.map(([n, prompt, inputBase, value]) => ({
      id: `architecture-${n}`,
      prompt: `Q${n} — ${prompt}`,
      starter: '0',
      tool: 'base' as const,
      inputBase,
      expectedValue: String(value),
    })),
  ],
};
