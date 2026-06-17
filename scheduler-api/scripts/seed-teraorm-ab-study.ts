import * as dotenv from 'dotenv';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { WorkerType } from '../src/worker/enum/worker-type.enum';

dotenv.config({ path: join(__dirname, '../.env') });

type StudyTemplate = {
  title: string;
  description: string;
  workerType: WorkerType;
  content: string;
  dependencies?: string[];
};

type InterviewQuestion = {
  key: string;
  label: string;
  type: 'likert_1_5' | 'short_text';
};

type InterviewConfig = {
  questions: InterviewQuestion[];
};

type StudyAssignment = {
  title: string;
  description: string;
  workerType: WorkerType;
  maxAttempts: number;
  boilerplateContent: string;
  templateTitle: string;
  interviewConfig?: InterviewConfig;
};

const STUDY_CLASS_NAME = 'Módulo de Validação TeraORM AB';
const STUDY_CLASS_DESCRIPTION =
  'Exercícios para comparar implementações nativas do SDK e baseadas em TeraORM, com formulário inicial, avaliações por atividade e formulário final comparativo.';

const columnExistsCache = new Map<string, boolean>();

async function hasColumn(
  dataSource: DataSource,
  tableName: string,
  columnName: string,
): Promise<boolean> {
  const cacheKey = `${tableName}.${columnName}`;
  const cached = columnExistsCache.get(cacheKey);
  if (typeof cached === 'boolean') {
    return cached;
  }

  const rows = await dataSource.query(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = $1
         AND column_name = $2
     ) AS "exists"`,
    [tableName, columnName],
  );

  const exists = Boolean(rows?.[0]?.exists);
  columnExistsCache.set(cacheKey, exists);
  return exists;
}

const templates: StudyTemplate[] = [

  {
    title: 'FORM00 - Perfil do Participante',
    description:
      'Template de validação simples para liberar o formulário inicial de perfil do participante.',
    workerType: WorkerType.NODE_TERAORM,
    content: `describe('FORM00 - Perfil do Participante', () => {
  it('registra o formulário inicial sem avaliar código', () => {
    expect(true).toBe(true);
  });
});
`,
  },
  {
    title: 'FORM99 - Avaliação Final do Experimento',
    description:
      'Template de validação simples para liberar o formulário final de percepção comparativa.',
    workerType: WorkerType.NODE_TERAORM,
    content: `describe('FORM99 - Avaliação Final do Experimento', () => {
  it('registra o formulário final sem avaliar código', () => {
    expect(true).toBe(true);
  });
});
`,
  },

  {
    title: 'AB01 SDK - Teste de Receita por Loja',
    description:
      'Valida a solução do aluno na trilha SDK contra uma tabela de teste do BigQuery.',
    workerType: WorkerType.NODE_TERAORM,
    content: `import fs from 'fs';
import { bq, seedTable, SeededTable } from '../test-utils/bq';
import { runRevenueByStore } from './src/app';

describe('AB01 SDK - Receita por loja (BigQuery)', () => {
  let table: SeededTable;

  beforeAll(async () => {
    table = await seedTable(
      'ab01_sales',
      [
        { name: 'store', type: 'STRING' },
        { name: 'total', type: 'INT64' },
      ],
      [
        { store: 'A', total: 50 },
        { store: 'A', total: 25 },
        { store: 'B', total: 70 },
        { store: 'C', total: 10 },
        { store: 'B', total: 20 },
      ],
    );
  }, 120000);

  afterAll(async () => {
    if (table) await table.drop();
  });

  it('retorna receita agregada e filtrada do BigQuery', async () => {
    const out = await runRevenueByStore(bq, table.fqn, 60);
    const normalized = out.map((r: any) => ({
      store: r.store,
      revenue: Number(r.revenue),
    }));
    expect(normalized).toEqual([
      { store: 'B', revenue: 90 },
      { store: 'A', revenue: 75 },
    ]);
  }, 60000);

  it('SDK track marker: solution must not depend on TeraORM', () => {
    const source = fs.readFileSync('./src/app.ts', 'utf8').toLowerCase();
    expect(source.includes('teraorm')).toBe(false);
  });
});
`,
  },
  {
    title: 'AB01 ORM - Teste de Receita por Loja',
    description:
      'Valida a solução do aluno na trilha TeraORM contra uma tabela de teste do BigQuery.',
    workerType: WorkerType.NODE_TERAORM,
    dependencies: ['teraorm', '@teraorm/bigquery'],
    content: `import fs from 'fs';
import { bq, seedTable, SeededTable } from '../test-utils/bq';
import { runRevenueByStore } from './src/app';

describe('AB01 TeraORM - Receita por loja (BigQuery)', () => {
  let table: SeededTable;

  beforeAll(async () => {
    table = await seedTable(
      'ab01_sales',
      [
        { name: 'store', type: 'STRING' },
        { name: 'total', type: 'INT64' },
      ],
      [
        { store: 'A', total: 50 },
        { store: 'A', total: 25 },
        { store: 'B', total: 70 },
        { store: 'C', total: 10 },
        { store: 'B', total: 20 },
      ],
    );
  }, 120000);

  afterAll(async () => {
    if (table) await table.drop();
  });

  it('retorna receita agregada e filtrada do BigQuery', async () => {
    const out = await runRevenueByStore(bq, table.fqn, 60);
    const normalized = out.map((r: any) => ({
      store: r.store,
      revenue: Number(r.revenue),
    }));
    expect(normalized).toEqual([
      { store: 'B', revenue: 90 },
      { store: 'A', revenue: 75 },
    ]);
  }, 60000);

  it('ORM track marker: solution must reference TeraORM', () => {
    const source = fs.readFileSync('./src/app.ts', 'utf8').toLowerCase();
    expect(source.includes('teraorm')).toBe(true);
  });
});
`,
  },
  {
    title: 'AB02 SDK - Teste de Principais Clientes',
    description:
      'Valida a solução do aluno na trilha SDK contra uma tabela de teste do BigQuery.',
    workerType: WorkerType.NODE_TERAORM,
    content: `import fs from 'fs';
import { bq, seedTable, SeededTable } from '../test-utils/bq';
import { runTopCustomers } from './src/app';

describe('AB02 SDK - Principais clientes (BigQuery)', () => {
  let table: SeededTable;

  beforeAll(async () => {
    table = await seedTable(
      'ab02_orders',
      [
        { name: 'customer', type: 'STRING' },
        { name: 'region', type: 'STRING' },
        { name: 'orders', type: 'INT64' },
      ],
      [
        { customer: 'Ana', region: 'sudeste', orders: 7 },
        { customer: 'Bruno', region: 'sul', orders: 4 },
        { customer: 'Carla', region: 'sudeste', orders: 10 },
        { customer: 'Diego', region: 'sudeste', orders: 6 },
      ],
    );
  }, 120000);

  afterAll(async () => {
    if (table) await table.drop();
  });

  it('retorna os principais clientes do BigQuery', async () => {
    const out = await runTopCustomers(bq, table.fqn, 'sudeste', 6, 2);
    const normalized = out.map((r: any) => ({
      customer: r.customer,
      orders: Number(r.orders),
    }));
    expect(normalized).toEqual([
      { customer: 'Carla', orders: 10 },
      { customer: 'Ana', orders: 7 },
    ]);
  }, 60000);

  it('SDK track marker: solution must not depend on TeraORM', () => {
    const source = fs.readFileSync('./src/app.ts', 'utf8').toLowerCase();
    expect(source.includes('teraorm')).toBe(false);
  });
});
`,
  },
  {
    title: 'AB02 ORM - Teste de Principais Clientes',
    description:
      'Valida a solução do aluno na trilha TeraORM contra uma tabela de teste do BigQuery.',
    workerType: WorkerType.NODE_TERAORM,
    dependencies: ['teraorm', '@teraorm/bigquery'],
    content: `import fs from 'fs';
import { bq, seedTable, SeededTable } from '../test-utils/bq';
import { runTopCustomers } from './src/app';

describe('AB02 TeraORM - Principais clientes (BigQuery)', () => {
  let table: SeededTable;

  beforeAll(async () => {
    table = await seedTable(
      'ab02_orders',
      [
        { name: 'customer', type: 'STRING' },
        { name: 'region', type: 'STRING' },
        { name: 'orders', type: 'INT64' },
      ],
      [
        { customer: 'Ana', region: 'sudeste', orders: 7 },
        { customer: 'Bruno', region: 'sul', orders: 4 },
        { customer: 'Carla', region: 'sudeste', orders: 10 },
        { customer: 'Diego', region: 'sudeste', orders: 6 },
      ],
    );
  }, 120000);

  afterAll(async () => {
    if (table) await table.drop();
  });

  it('retorna os principais clientes do BigQuery', async () => {
    const out = await runTopCustomers(bq, table.fqn, 'sudeste', 6, 2);
    const normalized = out.map((r: any) => ({
      customer: r.customer,
      orders: Number(r.orders),
    }));
    expect(normalized).toEqual([
      { customer: 'Carla', orders: 10 },
      { customer: 'Ana', orders: 7 },
    ]);
  }, 60000);

  it('ORM track marker: solution must reference TeraORM', () => {
    const source = fs.readFileSync('./src/app.ts', 'utf8').toLowerCase();
    expect(source.includes('teraorm')).toBe(true);
  });
});
`,
  },
  {
    title: 'AB03 SDK - Teste de Ticket Médio por Categoria',
    description:
      'Valida a solução do aluno na trilha SDK contra uma tabela de teste do BigQuery.',
    workerType: WorkerType.NODE_TERAORM,
    content: `import fs from 'fs';
import { bq, seedTable, SeededTable } from '../test-utils/bq';
import { runAvgTicketByCategory } from './src/app';

describe('AB03 SDK - Ticket médio por categoria (BigQuery)', () => {
  let table: SeededTable;

  beforeAll(async () => {
    table = await seedTable(
      'ab03_sales',
      [
        { name: 'category', type: 'STRING' },
        { name: 'price', type: 'INT64' },
      ],
      [
        { category: 'eletronicos', price: 200 },
        { category: 'eletronicos', price: 400 },
        { category: 'eletronicos', price: 600 },
        { category: 'livros', price: 30 },
        { category: 'livros', price: 50 },
        { category: 'livros', price: 70 },
        { category: 'roupas', price: 100 },
      ],
    );
  }, 120000);

  afterAll(async () => {
    if (table) await table.drop();
  });

  it('retorna o ticket médio por categoria, filtrado e ordenado', async () => {
    const out = await runAvgTicketByCategory(bq, table.fqn, 3);
    const normalized = out.map((r: any) => ({
      category: r.category,
      avgTicket: Number(r.avgTicket),
      sales: Number(r.sales),
    }));
    expect(normalized).toEqual([
      { category: 'eletronicos', avgTicket: 400, sales: 3 },
      { category: 'livros', avgTicket: 50, sales: 3 },
    ]);
  }, 60000);

  it('marcador de trilha SDK: solução não deve importar TeraORM', () => {
    const source = fs.readFileSync('./src/app.ts', 'utf8').toLowerCase();
    expect(source.includes('teraorm')).toBe(false);
  });
});
`,
  },
  {
    title: 'AB03 ORM - Teste de Ticket Médio por Categoria',
    description:
      'Valida a solução do aluno na trilha TeraORM contra uma tabela de teste do BigQuery.',
    workerType: WorkerType.NODE_TERAORM,
    dependencies: ['teraorm', '@teraorm/bigquery'],
    content: `import fs from 'fs';
import { bq, seedTable, SeededTable } from '../test-utils/bq';
import { runAvgTicketByCategory } from './src/app';

describe('AB03 TeraORM - Ticket médio por categoria (BigQuery)', () => {
  let table: SeededTable;

  beforeAll(async () => {
    table = await seedTable(
      'ab03_sales',
      [
        { name: 'category', type: 'STRING' },
        { name: 'price', type: 'INT64' },
      ],
      [
        { category: 'eletronicos', price: 200 },
        { category: 'eletronicos', price: 400 },
        { category: 'eletronicos', price: 600 },
        { category: 'livros', price: 30 },
        { category: 'livros', price: 50 },
        { category: 'livros', price: 70 },
        { category: 'roupas', price: 100 },
      ],
    );
  }, 120000);

  afterAll(async () => {
    if (table) await table.drop();
  });

  it('retorna o ticket médio por categoria, filtrado e ordenado', async () => {
    const out = await runAvgTicketByCategory(bq, table.fqn, 3);
    const normalized = out.map((r: any) => ({
      category: r.category,
      avgTicket: Number(r.avgTicket),
      sales: Number(r.sales),
    }));
    expect(normalized).toEqual([
      { category: 'eletronicos', avgTicket: 400, sales: 3 },
      { category: 'livros', avgTicket: 50, sales: 3 },
    ]);
  }, 60000);

  it('marcador de trilha TeraORM: solução deve importar TeraORM', () => {
    const source = fs.readFileSync('./src/app.ts', 'utf8').toLowerCase();
    expect(source.includes('teraorm')).toBe(true);
  });
});
`,
  },
  {
    title: 'AB04 SDK - Teste de Produtos com Baixo Estoque',
    description:
      'Valida a solução do aluno na trilha SDK contra uma tabela de teste do BigQuery.',
    workerType: WorkerType.NODE_TERAORM,
    content: `import fs from 'fs';
import { bq, seedTable, SeededTable } from '../test-utils/bq';
import { runLowStock } from './src/app';

describe('AB04 SDK - Produtos com baixo estoque (BigQuery)', () => {
  let table: SeededTable;

  beforeAll(async () => {
    table = await seedTable(
      'ab04_inventory',
      [
        { name: 'product', type: 'STRING' },
        { name: 'stock', type: 'INT64' },
        { name: 'active', type: 'BOOL' },
      ],
      [
        { product: 'caneta', stock: 3, active: true },
        { product: 'caderno', stock: 12, active: true },
        { product: 'lapis', stock: 1, active: true },
        { product: 'borracha', stock: 0, active: false },
        { product: 'apontador', stock: 4, active: true },
        { product: 'mochila', stock: 25, active: true },
      ],
    );
  }, 120000);

  afterAll(async () => {
    if (table) await table.drop();
  });

  it('returns active products under threshold, ordered by stock asc', async () => {
    const out = await runLowStock(bq, table.fqn, 5, 3);
    const normalized = out.map((r: any) => ({
      product: r.product,
      stock: Number(r.stock),
    }));
    expect(normalized).toEqual([
      { product: 'lapis', stock: 1 },
      { product: 'caneta', stock: 3 },
      { product: 'apontador', stock: 4 },
    ]);
  }, 60000);

  it('SDK track marker: solution must not depend on TeraORM', () => {
    const source = fs.readFileSync('./src/app.ts', 'utf8').toLowerCase();
    expect(source.includes('teraorm')).toBe(false);
  });
});
`,
  },
  {
    title: 'AB04 ORM - Teste de Produtos com Baixo Estoque',
    description:
      'Valida a solução do aluno na trilha TeraORM contra uma tabela de teste do BigQuery.',
    workerType: WorkerType.NODE_TERAORM,
    dependencies: ['teraorm', '@teraorm/bigquery'],
    content: `import fs from 'fs';
import { bq, seedTable, SeededTable } from '../test-utils/bq';
import { runLowStock } from './src/app';

describe('AB04 TeraORM - Produtos com baixo estoque (BigQuery)', () => {
  let table: SeededTable;

  beforeAll(async () => {
    table = await seedTable(
      'ab04_inventory',
      [
        { name: 'product', type: 'STRING' },
        { name: 'stock', type: 'INT64' },
        { name: 'active', type: 'BOOL' },
      ],
      [
        { product: 'caneta', stock: 3, active: true },
        { product: 'caderno', stock: 12, active: true },
        { product: 'lapis', stock: 1, active: true },
        { product: 'borracha', stock: 0, active: false },
        { product: 'apontador', stock: 4, active: true },
        { product: 'mochila', stock: 25, active: true },
      ],
    );
  }, 120000);

  afterAll(async () => {
    if (table) await table.drop();
  });

  it('returns active products under threshold, ordered by stock asc', async () => {
    const out = await runLowStock(bq, table.fqn, 5, 3);
    const normalized = out.map((r: any) => ({
      product: r.product,
      stock: Number(r.stock),
    }));
    expect(normalized).toEqual([
      { product: 'lapis', stock: 1 },
      { product: 'caneta', stock: 3 },
      { product: 'apontador', stock: 4 },
    ]);
  }, 60000);

  it('ORM track marker: solution must reference TeraORM', () => {
    const source = fs.readFileSync('./src/app.ts', 'utf8').toLowerCase();
    expect(source.includes('teraorm')).toBe(true);
  });
});
`,
  },
];

const SDK_PRIMER = `/**
 * === Introdução ao Bigquery (leia primeiro) ===
 *
 * Você recebe um cliente BigQuery já configurado (\`bq\`) do pacote
 * '@google-cloud/bigquery' e uma referência de tabela (\`table\`) que já é um
 * nome totalmente qualificado utilizando o seguinte caractere: \`.\` (ponto), ex: \\\`project.dataset.table\\\`.
 * Interpole-o diretamente na cláusula FROM.
 *
 * Padrão mínimo:
 *
 *   const [rows] = await bq.query({
 *     query: \`
 *       SELECT col_a AS aliasA, SUM(col_b) AS aliasB
 *       FROM \${table}
 *       WHERE col_a = @region
 *       GROUP BY col_a
 *       HAVING aliasB >= @minValue
 *       ORDER BY aliasB DESC
 *       LIMIT @limit
 *     \`,
 *     params: { region, minValue, limit },
 *   });
 *   return rows.map((r: any) => ({ ...sua forma... }));
 *
 * Notas:
 *  - \`bq.query\` retorna \`[rows, jobMetadata]\`; desestruture o primeiro elemento.
 *  - Prefira parâmetros nomeados (\`@name\`) e a opção \`params\` em vez de concatenação
 *    de strings para qualquer valor que você não produziu a si mesmo.
 *  - Colunas INT64 voltam como números OU strings dependendo do tamanho — chame
 *    \`Number(value)\` se o teste espera um número JS.
 *  - Os aliases que você SELECT são as chaves de cada objeto de linha.
 */`;

const ORM_PRIMER = `/**
 * === Introdução ao TeraORM (leia primeiro) ===
 *
 * TeraORM é um query builder leve e encadeável. Você compõe um plano com
 * uma API fluente em vez de escrever SQL à mão, depois o executa através de um
 * adaptador (aqui: BigQuery).
 *
 * Padrão mínimo:
 *
 *   import { BigQuery } from '@google-cloud/bigquery';
 *   import { defineModel, tera } from 'teraorm';
 *   import { createBigQueryAdapter } from '@teraorm/bigquery';
 *
 *   // 1. Descreva as colunas (apenas os nomes importam para o plano).
 *   const Sales = defineModel('sales', {
 *     category: '' as string,
 *     price: 0 as number,
 *   });
 *
 *   // 2. Construa um adaptador vinculado à tabela que foi gerada. O argumento \`table\`
 *   //    que você recebe é uma string composta de \\\`project.dataset.table\\\`.
 *   //    Remova os caracteres '\`' e realize um split pelo ponto
 *   //    para encontrar os valores projectId / datasetId / tableName.
 *   const [projectId, datasetId, tableName] = table.replace(/\`/g, '').split('.');
 *   const adapter = createBigQueryAdapter({
 *     projectId,
 *     datasetId,
 *     tableName,
 *     bigquery: bq,
 *   });
 *
 *   // 3. Componha e execute. Agregações levam um alias; filtro pós-agregação
 *   //    linhas com .having(alias, op, value); ordene por alias com .orderByAlias.
 *   const rows = await tera(Sales, adapter)
 *     .select('category')
 *     .avg('price', 'avgPrice')
 *     .count('price', 'sales')
 *     .groupBy('category')
 *     .having('sales', '>=', minSales)
 *     .orderByAlias('avgPrice', 'desc')
 *     .execute();
 *
 *   return rows.map((r: any) => ({ ...sua forma... }));
 *
 * Cola de operadores (.where / .andWhere / .having):
 *   '=', '!=', '>', '>=', '<', '<=', 'LIKE', 'IN', 'BETWEEN'
 *
 * O teste de marcador ORM falhará a menos que este arquivo importe de 'teraorm'.
 */`;

const assignments: StudyAssignment[] = [
  {
    title: 'FORM00 - Perfil do Participante',
    description:
      'Formulário inicial respondido ao entrar na disciplina, antes das atividades práticas.',
    workerType: WorkerType.NODE_TERAORM,
    maxAttempts: 1,
    templateTitle: 'FORM00 - Perfil do Participante',
    interviewConfig: {
      questions: [
        {
          key: 'profileSqlFamiliarity',
          label:
            'Como você avalia sua familiaridade prévia com SQL?',
          type: 'likert_1_5',
        },
        {
          key: 'profileJsTsFamiliarity',
          label:
            'Como você avalia sua familiaridade prévia com JavaScript ou TypeScript?',
          type: 'likert_1_5',
        },
        {
          key: 'profileOrmFamiliarity',
          label:
            'Como você avalia sua familiaridade prévia com ORMs ou bibliotecas de acesso a dados?',
          type: 'likert_1_5',
        },
      ],
    },
    boilerplateContent: `/**
 * Atividade sem implementação de código.
 * Preencha o formulário associado e submeta para registrar sua resposta.
 */
export {};
`,
  },
  {
    title: 'AB01-A SDK Nativo: Receita por Loja',
    description:
      'Pergunta: escreva uma query SQL do BigQuery (via @google-cloud/bigquery) que retorna receita agregada por loja, filtrada por minRevenue e ordenada desc.',
    workerType: WorkerType.NODE_TERAORM,
    maxAttempts: 20,
    templateTitle: 'AB01 SDK - Teste de Receita por Loja',
    interviewConfig: {
      questions: [
        {
          key: 'sdkRevenueClarity',
          label:
            'A solução implementada com o SDK nativo ficou clara e fácil de entender.',
          type: 'likert_1_5',
        },
        {
          key: 'sdkRevenueModification',
          label:
            'Foi fácil modificar filtros, parâmetros ou condições da consulta usando o SDK nativo.',
          type: 'likert_1_5',
        },
        {
          key: 'sdkRevenueErrorRisk',
          label:
            'A escrita de SQL literal no código tornou a implementação mais propensa a erros.',
          type: 'likert_1_5',
        },
        {
          key: 'sdkRevenueDifficulty',
          label:
            'Em poucas palavras, qual foi a principal dificuldade percebida nesta atividade com o SDK nativo?',
          type: 'short_text',
        },
      ],
    },
    
    boilerplateContent: `import { BigQuery } from '@google-cloud/bigquery';

${SDK_PRIMER}

export type RevenueReportRow = { store: string; revenue: number };

/**
 * Trilha SDK: Escreva uma query SQL pura e execute via o cliente BigQuery fornecido.
 *
 * A tabela de teste possui as colunas:
 *   - store  STRING
 *   - total  INT64
 *
 * Retorne as linhas cuja SUM(total) >= minRevenue, ordenadas por receita (desc).
 * O formato retornado deve corresponder a { store: string; revenue: number }.
 */
export async function runRevenueByStore(
  bq: BigQuery,
  table: string,
  minRevenue: number,
): Promise<RevenueReportRow[]> {
  // TODO: implement using bq.query({ query: 'SELECT ...' })
  return [];
}
`,
  },
  {
    title: 'AB02-A SDK Nativo: Principais Clientes por Região',
    description:
      'Pergunta: escreva uma query SQL do BigQuery que retorna os N principais clientes em uma região com pelo menos minOrders, ordenado por orders desc.',
    workerType: WorkerType.NODE_TERAORM,
    maxAttempts: 20,
    templateTitle: 'AB02 SDK - Teste de Principais Clientes',
    interviewConfig: {
      questions: [
        {
          key: 'sdkTopCustomersClarity',
          label:
            'A solução implementada com o SDK nativo ficou clara e fácil de entender.',
          type: 'likert_1_5',
        },
        {
          key: 'sdkTopCustomersModification',
          label:
            'Foi fácil modificar filtros, parâmetros ou condições da consulta usando o SDK nativo.',
          type: 'likert_1_5',
        },
        {
          key: 'sdkTopCustomersErrorRisk',
          label:
            'A escrita de SQL literal no código tornou a implementação mais propensa a erros.',
          type: 'likert_1_5',
        },
        {
          key: 'sdkTopCustomersDifficulty',
          label:
            'Em poucas palavras, qual foi a principal dificuldade percebida nesta atividade com o SDK nativo?',
          type: 'short_text',
        },
      ],
    },
    
    boilerplateContent: `import { BigQuery } from '@google-cloud/bigquery';

${SDK_PRIMER}

export type CustomerReportRow = { customer: string; orders: number };

/**
 * SDK track: compose a raw SQL query and execute it via the provided BigQuery client.
 *
 * Seeded table columns:
 *   - customer  STRING
 *   - region    STRING
 *   - orders    INT64
 *
 * Return the top \`limit\` customers in the given region whose orders >= minOrders,
 * ordered by orders desc.
 */
export async function runTopCustomers(
  bq: BigQuery,
  table: string,
  region: string,
  minOrders: number,
  limit: number,
): Promise<CustomerReportRow[]> {
  // TODO: implement using bq.query({ query: 'SELECT ...' })
  return [];
}
`,
  },
  {
    title: 'AB03-A SDK Nativo: Ticket Médio por Categoria',
    description:
      'Pergunta: escreva uma query SQL do BigQuery que retorna o ticket médio (AVG de price) por categoria, filtrado por minSales (HAVING COUNT(*) >= minSales) e ordenado por avgTicket desc.',
    workerType: WorkerType.NODE_TERAORM,
    maxAttempts: 20,
    templateTitle: 'AB03 SDK - Teste de Ticket Médio por Categoria',
    interviewConfig: {
      questions: [
        {
          key: 'sdkAvgTicketClarity',
          label:
            'A solução implementada com o SDK nativo ficou clara e fácil de entender.',
          type: 'likert_1_5',
        },
        {
          key: 'sdkAvgTicketModification',
          label:
            'Foi fácil modificar filtros, parâmetros ou condições da consulta usando o SDK nativo.',
          type: 'likert_1_5',
        },
        {
          key: 'sdkAvgTicketErrorRisk',
          label:
            'A escrita de SQL literal no código tornou a implementação mais propensa a erros.',
          type: 'likert_1_5',
        },
        {
          key: 'sdkAvgTicketDifficulty',
          label:
            'Em poucas palavras, qual foi a principal dificuldade percebida nesta atividade com o SDK nativo?',
          type: 'short_text',
        },
      ],
    },
    
    boilerplateContent: `import { BigQuery } from '@google-cloud/bigquery';

${SDK_PRIMER}

export type CategoryTicketRow = {
  category: string;
  avgTicket: number;
  sales: number;
};

/**
 * SDK track: compose a raw SQL query and execute it via the provided BigQuery client.
 *
 * Seeded table columns:
 *   - category  STRING
 *   - price     INT64
 *
 * Return rows whose COUNT(*) >= minSales, with avgTicket = AVG(price) and sales = COUNT(*),
 * ordered by avgTicket desc.
 */
export async function runAvgTicketByCategory(
  bq: BigQuery,
  table: string,
  minSales: number,
): Promise<CategoryTicketRow[]> {
  // TODO: implement using bq.query({ query: 'SELECT ...' })
  return [];
}
`,
  },
  {
    title: 'AB04-A SDK Nativo: Produtos com Baixo Estoque',
    description:
      'Pergunta: escreva uma query SQL do BigQuery que retorna produtos ativos (active = TRUE) cujo estoque é estritamente menor que threshold, ordenado por stock asc, limitado a N linhas.',
    workerType: WorkerType.NODE_TERAORM,
    maxAttempts: 20,
    templateTitle: 'AB04 SDK - Teste de Produtos com Baixo Estoque',
    interviewConfig: {
      questions: [
        {
          key: 'sdkLowStockClarity',
          label:
            'A solução implementada com o SDK nativo ficou clara e fácil de entender.',
          type: 'likert_1_5',
        },
        {
          key: 'sdkLowStockModification',
          label:
            'Foi fácil modificar filtros, parâmetros ou condições da consulta usando o SDK nativo.',
          type: 'likert_1_5',
        },
        {
          key: 'sdkLowStockErrorRisk',
          label:
            'A escrita de SQL literal no código tornou a implementação mais propensa a erros.',
          type: 'likert_1_5',
        },
        {
          key: 'sdkLowStockDifficulty',
          label:
            'Em poucas palavras, qual foi a principal dificuldade percebida nesta atividade com o SDK nativo?',
          type: 'short_text',
        },
      ],
    },
    
    boilerplateContent: `import { BigQuery } from '@google-cloud/bigquery';

${SDK_PRIMER}

export type LowStockRow = { product: string; stock: number };

/**
 * SDK track: compose a raw SQL query and execute it via the provided BigQuery client.
 *
 * Seeded table columns:
 *   - product  STRING
 *   - stock    INT64
 *   - active   BOOL
 *
 * Return rows where active = TRUE AND stock < threshold,
 * ordered by stock asc, limited to \`limit\` rows.
 */
export async function runLowStock(
  bq: BigQuery,
  table: string,
  threshold: number,
  limit: number,
): Promise<LowStockRow[]> {
  // TODO: implement using bq.query({ query: 'SELECT ...' })
  return [];
}
`,
  },
  {
    title: 'AB01-B TeraORM: Receita por Loja',
    description:
      'Pergunta: escreva uma query SQL do BigQuery (via teraORM) que retorna receita agregada por loja, filtrada por minRevenue e ordenada desc.',
    workerType: WorkerType.NODE_TERAORM,
    maxAttempts: 20,
    templateTitle: 'AB01 ORM - Teste de Receita por Loja',
    interviewConfig: {
      questions: [
        {
          key: 'ormRevenueClarity',
          label:
            'A solução implementada com o TeraORM ficou clara e fácil de entender.',
          type: 'likert_1_5',
        },
        {
          key: 'ormRevenueModification',
          label:
            'Foi fácil modificar filtros, parâmetros ou condições da consulta usando o TeraORM.',
          type: 'likert_1_5',
        },
        {
          key: 'ormRevenueIntent',
          label:
            'O TeraORM ajudou a identificar melhor a intenção da consulta.',
          type: 'likert_1_5',
        },
        {
          key: 'ormRevenueMentalEffort',
          label:
            'O TeraORM reduziu o esforço mental necessário para estruturar a consulta.',
          type: 'likert_1_5',
        },
        {
          key: 'ormRevenueSafety',
          label:
            'O TeraORM transmitiu maior segurança na composição de filtros e parâmetros.',
          type: 'likert_1_5',
        },
        {
          key: 'ormRevenueDifficulty',
          label:
            'Em poucas palavras, qual foi a principal dificuldade percebida nesta atividade com o TeraORM?',
          type: 'short_text',
        },
      ],
    },
    
    boilerplateContent: `import { BigQuery } from '@google-cloud/bigquery';
import * as teraorm from 'teraorm';

${ORM_PRIMER}

export type RevenueReportRow = { store: string; revenue: number };

/**
 * Trilha TeraORM: Modele e execute a query usando primitivos do TeraORM.
 *
 * Colunas da tabela de teste:
 *   - store  STRING
 *   - total  INT64
 */
export async function runRevenueByStore(
  bq: BigQuery,
  table: string,
  minRevenue: number,
): Promise<RevenueReportRow[]> {
  void teraorm;
  // TODO: implement with TeraORM
  return [];
}

export type BigQueryClientOptions = {
  keyFilename: string;
  projectId: string;
};

export function getBigQueryClientOptions(): BigQueryClientOptions {
  // TODO: implement for credential-backed execution
  return {
    keyFilename: '',
    projectId: '',
  };
}
`,
  },
  {
    title: 'AB02-B TeraORM: Principais Clientes por Região',
    description:
      'Pergunta: mesmo cenário de principais-clientes que AB02-A, mas composto com TeraORM. O resultado deve corresponder exatamente à trilha SDK.',
    workerType: WorkerType.NODE_TERAORM,
    maxAttempts: 20,
    templateTitle: 'AB02 ORM - Teste de Principais Clientes',
    interviewConfig: {
      questions: [
        {
          key: 'ormTopCustomersClarity',
          label:
            'A solução implementada com o TeraORM ficou clara e fácil de entender.',
          type: 'likert_1_5',
        },
        {
          key: 'ormTopCustomersModification',
          label:
            'Foi fácil modificar filtros, parâmetros ou condições da consulta usando o TeraORM.',
          type: 'likert_1_5',
        },
        {
          key: 'ormTopCustomersIntent',
          label:
            'O TeraORM ajudou a identificar melhor a intenção da consulta.',
          type: 'likert_1_5',
        },
        {
          key: 'ormTopCustomersMentalEffort',
          label:
            'O TeraORM reduziu o esforço mental necessário para estruturar a consulta.',
          type: 'likert_1_5',
        },
        {
          key: 'ormTopCustomersSafety',
          label:
            'O TeraORM transmitiu maior segurança na composição de filtros e parâmetros.',
          type: 'likert_1_5',
        },
        {
          key: 'ormTopCustomersDifficulty',
          label:
            'Em poucas palavras, qual foi a principal dificuldade percebida nesta atividade com o TeraORM?',
          type: 'short_text',
        },
      ],
    },
    
    boilerplateContent: `import { BigQuery } from '@google-cloud/bigquery';
import * as teraorm from 'teraorm';

${ORM_PRIMER}

export type CustomerReportRow = { customer: string; orders: number };

/**
 * ORM track: model the query using TeraORM primitives.
 *
 * Seeded table columns:
 *   - customer  STRING
 *   - region    STRING
 *   - orders    INT64
 */
export async function runTopCustomers(
  bq: BigQuery,
  table: string,
  region: string,
  minOrders: number,
  limit: number,
): Promise<CustomerReportRow[]> {
  void teraorm;
  // TODO: implement with TeraORM
  return [];
}
`,
  },
  {
    title: 'AB03-B TeraORM: Ticket Médio por Categoria',
    description:
      'Pergunta: mesmo cenário de ticket-médio que AB03-A, mas composto com TeraORM. O resultado deve corresponder exatamente à trilha SDK.',
    workerType: WorkerType.NODE_TERAORM,
    maxAttempts: 20,
    templateTitle: 'AB03 ORM - Teste de Ticket Médio por Categoria',
    interviewConfig: {
      questions: [
        {
          key: 'ormAvgTicketClarity',
          label:
            'A solução implementada com o TeraORM ficou clara e fácil de entender.',
          type: 'likert_1_5',
        },
        {
          key: 'ormAvgTicketModification',
          label:
            'Foi fácil modificar filtros, parâmetros ou condições da consulta usando o TeraORM.',
          type: 'likert_1_5',
        },
        {
          key: 'ormAvgTicketIntent',
          label:
            'O TeraORM ajudou a identificar melhor a intenção da consulta.',
          type: 'likert_1_5',
        },
        {
          key: 'ormAvgTicketMentalEffort',
          label:
            'O TeraORM reduziu o esforço mental necessário para estruturar a consulta.',
          type: 'likert_1_5',
        },
        {
          key: 'ormAvgTicketSafety',
          label:
            'O TeraORM transmitiu maior segurança na composição de filtros e parâmetros.',
          type: 'likert_1_5',
        },
        {
          key: 'ormAvgTicketDifficulty',
          label:
            'Em poucas palavras, qual foi a principal dificuldade percebida nesta atividade com o TeraORM?',
          type: 'short_text',
        },
      ],
    },
    
    boilerplateContent: `import { BigQuery } from '@google-cloud/bigquery';
import * as teraorm from 'teraorm';

${ORM_PRIMER}

export type CategoryTicketRow = {
  category: string;
  avgTicket: number;
  sales: number;
};

/**
 * ORM track: model and execute the query using TeraORM primitives.
 *
 * Seeded table columns:
 *   - category  STRING
 *   - price     INT64
 */
export async function runAvgTicketByCategory(
  bq: BigQuery,
  table: string,
  minSales: number,
): Promise<CategoryTicketRow[]> {
  void teraorm;
  // TODO: implement with TeraORM
  return [];
}
`,
  },
  {
    title: 'AB04-B TeraORM: Produtos com Baixo Estoque',
    description:
      'Pergunta: mesmo cenário de baixo-estoque que AB04-A, mas composto com TeraORM. O resultado deve corresponder exatamente à trilha SDK.',
    workerType: WorkerType.NODE_TERAORM,
    maxAttempts: 20,
    templateTitle: 'AB04 ORM - Teste de Produtos com Baixo Estoque',
    interviewConfig: {
      questions: [
        {
          key: 'ormLowStockClarity',
          label:
            'A solução implementada com o TeraORM ficou clara e fácil de entender.',
          type: 'likert_1_5',
        },
        {
          key: 'ormLowStockModification',
          label:
            'Foi fácil modificar filtros, parâmetros ou condições da consulta usando o TeraORM.',
          type: 'likert_1_5',
        },
        {
          key: 'ormLowStockIntent',
          label:
            'O TeraORM ajudou a identificar melhor a intenção da consulta.',
          type: 'likert_1_5',
        },
        {
          key: 'ormLowStockMentalEffort',
          label:
            'O TeraORM reduziu o esforço mental necessário para estruturar a consulta.',
          type: 'likert_1_5',
        },
        {
          key: 'ormLowStockSafety',
          label:
            'O TeraORM transmitiu maior segurança na composição de filtros e parâmetros.',
          type: 'likert_1_5',
        },
        {
          key: 'ormLowStockDifficulty',
          label:
            'Em poucas palavras, qual foi a principal dificuldade percebida nesta atividade com o TeraORM?',
          type: 'short_text',
        },
      ],
    },
    
    boilerplateContent: `import { BigQuery } from '@google-cloud/bigquery';
import * as teraorm from 'teraorm';

${ORM_PRIMER}

export type LowStockRow = { product: string; stock: number };

/**
 * ORM track: model and execute the query using TeraORM primitives.
 *
 * Seeded table columns:
 *   - product  STRING
 *   - stock    INT64
 *   - active   BOOL
 */
export async function runLowStock(
  bq: BigQuery,
  table: string,
  threshold: number,
  limit: number,
): Promise<LowStockRow[]> {
  void teraorm;
  // TODO: implement with TeraORM
  return [];
}

export type BigQueryClientOptions = {
  keyFilename: string;
  projectId: string;
};

export function getBigQueryClientOptions(): BigQueryClientOptions {
  // TODO: implement for credential-backed execution
  return {
    keyFilename: '',
    projectId: '',
  };
}
`,
  },
  {
    title: 'FORM99 - Avaliação Final do Experimento',
    description:
      'Formulário final respondido após as trilhas SDK e TeraORM para comparar as abordagens.',
    workerType: WorkerType.NODE_TERAORM,
    maxAttempts: 1,
    templateTitle: 'FORM99 - Avaliação Final do Experimento',
    interviewConfig: {
      questions: [
        {
          key: 'finalUnderstandPreference',
          label:
            'Comparando as duas abordagens, qual delas você achou mais fácil de entender?',
          type: 'short_text',
        },
        {
          key: 'finalModifyPreference',
          label:
            'Comparando as duas abordagens, qual delas você achou mais fácil de modificar?',
          type: 'short_text',
        },
        {
          key: 'finalFuturePreference',
          label:
            'Comparando as duas abordagens, qual delas você preferiria utilizar em uma atividade futura semelhante?',
          type: 'short_text',
        },
        {
          key: 'finalTeraOrmAdvantage',
          label:
            'Em poucas palavras, qual foi a principal vantagem percebida no uso do TeraORM?',
          type: 'short_text',
        },
        {
          key: 'finalTeraOrmDifficulty',
          label:
            'Em poucas palavras, qual foi a principal dificuldade percebida no uso do TeraORM?',
          type: 'short_text',
        },
        {
          key: 'finalSdkAdvantage',
          label:
            'Em poucas palavras, qual foi a principal vantagem percebida no uso do SDK nativo do BigQuery?',
          type: 'short_text',
        },
        {
          key: 'finalSdkDifficulty',
          label:
            'Em poucas palavras, qual foi a principal dificuldade percebida no uso do SDK nativo do BigQuery?',
          type: 'short_text',
        },
        {
          key: 'finalAdditionalNotes',
          label:
            'Há alguma observação adicional sobre a comparação entre o SDK nativo do BigQuery e o TeraORM?',
          type: 'short_text',
        },
      ],
    },
    boilerplateContent: `/**
 * Atividade sem implementação de código.
 * Preencha o formulário associado e submeta para registrar sua resposta.
 */
export {};
`,
  }
];

async function ensureClass(
  dataSource: DataSource,
  teacherId: number,
  studentId: number,
): Promise<number> {
  const classHasDescription = await hasColumn(
    dataSource,
    'class',
    'description',
  );

  const existing = await dataSource.query(
    `SELECT "id" FROM "class" WHERE "name" = $1 LIMIT 1`,
    [STUDY_CLASS_NAME],
  );

  let classId: number;
  if (existing.length > 0) {
    classId = Number(existing[0].id);

    if (classHasDescription) {
      await dataSource.query(
        `UPDATE "class" SET "description" = $1 WHERE "id" = $2`,
        [STUDY_CLASS_DESCRIPTION, classId],
      );
    }
  } else {
    const created = classHasDescription
      ? await dataSource.query(
          `INSERT INTO "class" ("name", "description") VALUES ($1, $2) RETURNING "id"`,
          [STUDY_CLASS_NAME, STUDY_CLASS_DESCRIPTION],
        )
      : await dataSource.query(
          `INSERT INTO "class" ("name") VALUES ($1) RETURNING "id"`,
          [STUDY_CLASS_NAME],
        );
    classId = Number(created[0].id);
  }

  await dataSource.query(
    `INSERT INTO "user_class" ("userId", "classId") VALUES ($1, $2) ON CONFLICT ("userId", "classId") DO NOTHING`,
    [teacherId, classId],
  );

  await dataSource.query(
    `INSERT INTO "user_class" ("userId", "classId") VALUES ($1, $2) ON CONFLICT ("userId", "classId") DO NOTHING`,
    [studentId, classId],
  );

  return classId;
}

async function ensureTemplate(
  dataSource: DataSource,
  template: StudyTemplate,
): Promise<number> {
  const existing = await dataSource.query(
    `SELECT "id" FROM "template" WHERE "title" = $1 LIMIT 1`,
    [template.title],
  );

  if (existing.length > 0) {
    const id = Number(existing[0].id);
    await dataSource.query(
      `UPDATE "template" SET "description" = $1, "content" = $2, "workerType" = $3, "dependencies" = $4 WHERE "id" = $5`,
      [
        template.description,
        template.content,
        template.workerType,
        template.dependencies ?? [],
        id,
      ],
    );
    return id;
  }

  const inserted = await dataSource.query(
    `INSERT INTO "template" ("title", "description", "filePath", "content", "workerType", "dependencies") VALUES ($1, $2, $3, $4, $5, $6) RETURNING "id"`,
    [
      template.title,
      template.description,
      '',
      template.content,
      template.workerType,
      template.dependencies ?? [],
    ],
  );

  return Number(inserted[0].id);
}

async function ensureAssignment(options: {
  dataSource: DataSource;
  assignment: StudyAssignment;
  classId: number;
  teacherId: number;
  templateId: number;
}): Promise<number> {
  const { dataSource, assignment, classId, teacherId, templateId } = options;
  const assignmentHasBoilerplateContent = await hasColumn(
    dataSource,
    'assignment',
    'boilerplateContent',
  );
  const assignmentHasCreatedById = await hasColumn(
    dataSource,
    'assignment',
    'createdById',
  );
  const assignmentHasInterviewConfig = await hasColumn(
    dataSource,
    'assignment',
    'interviewConfig',
  );

  const existing = await dataSource.query(
    `SELECT "id" FROM "assignment" WHERE "title" = $1 AND "classId" = $2 LIMIT 1`,
    [assignment.title, classId],
  );

  let assignmentId: number;
  if (existing.length > 0) {
    assignmentId = Number(existing[0].id);

    const setParts = [
      `"description" = $1`,
      `"maxAttempts" = $2`,
      `"workerType" = $3`,
    ];
    const params: unknown[] = [
      assignment.description,
      assignment.maxAttempts,
      assignment.workerType,
    ];

    if (assignmentHasBoilerplateContent) {
      setParts.push(`"boilerplateContent" = $${params.length + 1}`);
      params.push(assignment.boilerplateContent);
    }

    if (assignmentHasCreatedById) {
      setParts.push(`"createdById" = $${params.length + 1}`);
      params.push(teacherId);
    }

    if (assignmentHasInterviewConfig) {
      setParts.push(`"interviewConfig" = $${params.length + 1}`);
      params.push(
        assignment.interviewConfig
          ? JSON.stringify(assignment.interviewConfig)
          : null,
      );
    }

    params.push(assignmentId);

    await dataSource.query(
      `UPDATE "assignment" SET ${setParts.join(', ')} WHERE "id" = $${params.length}`,
      params,
    );
  } else {
    const columns = [
      '"classId"',
      '"title"',
      '"description"',
      '"maxAttempts"',
      '"workerType"',
    ];
    const values: unknown[] = [
      classId,
      assignment.title,
      assignment.description,
      assignment.maxAttempts,
      assignment.workerType,
    ];

    if (assignmentHasBoilerplateContent) {
      columns.push('"boilerplateContent"');
      values.push(assignment.boilerplateContent);
    }

    if (assignmentHasCreatedById) {
      columns.push('"createdById"');
      values.push(teacherId);
    }

    if (assignmentHasInterviewConfig && assignment.interviewConfig) {
      columns.push('"interviewConfig"');
      values.push(JSON.stringify(assignment.interviewConfig));
    }

    const placeholders = values.map((_v, idx) => `$${idx + 1}`).join(', ');

    const inserted = await dataSource.query(
      `INSERT INTO "assignment" (${columns.join(', ')}) VALUES (${placeholders}) RETURNING "id"`,
      values,
    );
    assignmentId = Number(inserted[0].id);
  }

  await dataSource.query(
    `DELETE FROM "assignment_template" WHERE "assignmentId" = $1`,
    [assignmentId],
  );

  await dataSource.query(
    `INSERT INTO "assignment_template" ("assignmentId", "templateId") VALUES ($1, $2)`,
    [assignmentId, templateId],
  );

  await dataSource.query(
    `DELETE FROM "assignment_param" WHERE "assignmentId" = $1`,
    [assignmentId],
  );

  return assignmentId;
}

async function run() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.PG_HOST || 'localhost',
    port: Number(process.env.PG_PORT) || 5432,
    username: process.env.PG_USERNAME,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    synchronize: false,
  });

  await dataSource.initialize();

  try {
    const users = await dataSource.query(
      `SELECT "id", "email" FROM "user" WHERE "email" IN ($1, $2)`,
      ['admin@example.com', 'student@example.com'],
    );

    const admin = users.find(
      (u: { email: string }) => u.email === 'admin@example.com',
    );
    const student = users.find(
      (u: { email: string }) => u.email === 'student@example.com',
    );

    if (!admin || !student) {
      throw new Error(
        'Required users not found. Run npm run seed first to create admin/student.',
      );
    }

    const adminId = Number(admin.id);
    const studentId = Number(student.id);

    const classId = await ensureClass(dataSource, adminId, studentId);

    const templateIdsByTitle = new Map<string, number>();
    for (const template of templates) {
      const id = await ensureTemplate(dataSource, template);
      templateIdsByTitle.set(template.title, id);
    }

    for (const assignment of assignments) {
      const templateId = templateIdsByTitle.get(assignment.templateTitle);
      if (!templateId) {
        throw new Error(
          `Template not found in map: ${assignment.templateTitle}`,
        );
      }

      await ensureAssignment({
        dataSource,
        assignment,
        classId,
        teacherId: adminId,
        templateId,
      });
    }

    console.log('TeraORM AB study module seeded successfully.');
    console.log(`Class: ${STUDY_CLASS_NAME}`);
    console.log(`Assignments: ${assignments.length}`);
  } finally {
    await dataSource.destroy();
  }
}

run().catch((error) => {
  console.error('TeraORM AB study seed failed:', error);
  process.exit(1);
});
