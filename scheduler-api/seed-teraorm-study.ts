import * as dotenv from 'dotenv';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { WorkerType } from './src/worker/enum/worker-type.enum';

dotenv.config({ path: join(__dirname, '.env') });

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

const STUDY_CLASS_NAME = 'TeraORM AB Validation Module';
const STUDY_CLASS_DESCRIPTION =
  'Paired exercises to compare SDK-native and TeraORM-based implementations.';

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
    title: 'AB01 SDK - Revenue by store test',
    description:
      'Executes the student SDK-track function against a freshly seeded BigQuery table.',
    workerType: WorkerType.NODE_TERAORM,
    content: `import fs from 'fs';
import { bq, seedTable, SeededTable } from '../test-utils/bq';
import { runRevenueByStore } from './src/app';

describe('AB01 SDK - Revenue by store (BigQuery)', () => {
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

  it('returns aggregated and filtered revenue from real BigQuery', async () => {
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
    title: 'AB01 ORM - Revenue by store test',
    description:
      'Executes the student ORM-track function against a freshly seeded BigQuery table.',
    workerType: WorkerType.NODE_TERAORM,
    content: `import fs from 'fs';
import { bq, seedTable, SeededTable } from '../test-utils/bq';
import { runRevenueByStore } from './src/app';

describe('AB01 ORM - Revenue by store (BigQuery)', () => {
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

  it('returns aggregated and filtered revenue from real BigQuery', async () => {
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
    title: 'AB02 SDK - Top customers test',
    description:
      'Executes the student SDK-track function against a freshly seeded BigQuery table.',
    workerType: WorkerType.NODE_TERAORM,
    content: `import fs from 'fs';
import { bq, seedTable, SeededTable } from '../test-utils/bq';
import { runTopCustomers } from './src/app';

describe('AB02 SDK - Top customers (BigQuery)', () => {
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

  it('returns top customers from real BigQuery', async () => {
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
    title: 'AB02 ORM - Top customers test',
    description:
      'Executes the student ORM-track function against a freshly seeded BigQuery table.',
    workerType: WorkerType.NODE_TERAORM,
    content: `import fs from 'fs';
import { bq, seedTable, SeededTable } from '../test-utils/bq';
import { runTopCustomers } from './src/app';

describe('AB02 ORM - Top customers (BigQuery)', () => {
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

  it('returns top customers from real BigQuery', async () => {
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
    title: 'AB03 SDK - Average ticket by category test',
    description:
      'Executes the student SDK-track function against a freshly seeded BigQuery table.',
    workerType: WorkerType.NODE_TERAORM,
    content: `import fs from 'fs';
import { bq, seedTable, SeededTable } from '../test-utils/bq';
import { runAvgTicketByCategory } from './src/app';

describe('AB03 SDK - Average ticket by category (BigQuery)', () => {
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

  it('returns average ticket per category, filtered and ordered', async () => {
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

  it('SDK track marker: solution must not depend on TeraORM', () => {
    const source = fs.readFileSync('./src/app.ts', 'utf8').toLowerCase();
    expect(source.includes('teraorm')).toBe(false);
  });
});
`,
  },
  {
    title: 'AB03 ORM - Average ticket by category test',
    description:
      'Executes the student ORM-track function against a freshly seeded BigQuery table.',
    workerType: WorkerType.NODE_TERAORM,
    content: `import fs from 'fs';
import { bq, seedTable, SeededTable } from '../test-utils/bq';
import { runAvgTicketByCategory } from './src/app';

describe('AB03 ORM - Average ticket by category (BigQuery)', () => {
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

  it('returns average ticket per category, filtered and ordered', async () => {
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

  it('ORM track marker: solution must reference TeraORM', () => {
    const source = fs.readFileSync('./src/app.ts', 'utf8').toLowerCase();
    expect(source.includes('teraorm')).toBe(true);
  });
});
`,
  },
  {
    title: 'AB04 SDK - Low stock products test',
    description:
      'Executes the student SDK-track function against a freshly seeded BigQuery table.',
    workerType: WorkerType.NODE_TERAORM,
    content: `import fs from 'fs';
import { bq, seedTable, SeededTable } from '../test-utils/bq';
import { runLowStock } from './src/app';

describe('AB04 SDK - Low stock products (BigQuery)', () => {
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
    title: 'AB04 ORM - Low stock products test',
    description:
      'Executes the student ORM-track function against a freshly seeded BigQuery table.',
    workerType: WorkerType.NODE_TERAORM,
    content: `import fs from 'fs';
import { bq, seedTable, SeededTable } from '../test-utils/bq';
import { runLowStock } from './src/app';

describe('AB04 ORM - Low stock products (BigQuery)', () => {
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
 * === SDK track primer (read first) ===
 *
 * You receive an already-configured BigQuery client (\`bq\`) from
 * '@google-cloud/bigquery' and a table reference (\`table\`) that is ALREADY a
 * backtick-quoted fully-qualified name, e.g.  \\\`project.dataset.table\\\`.
 * Interpolate it directly into the FROM clause — do NOT add extra backticks.
 *
 * Minimal pattern:
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
 *   return rows.map((r: any) => ({ ...your shape... }));
 *
 * Notes:
 *  - \`bq.query\` returns \`[rows, jobMetadata]\`; destructure the first element.
 *  - Prefer named parameters (\`@name\`) and the \`params\` option over string
 *    concatenation for any value you did not produce yourself.
 *  - INT64 columns come back as numbers OR strings depending on size — call
 *    \`Number(value)\` if the test expects a JS number.
 *  - The aliases you SELECT are the keys of each row object.
 */`;

const ORM_PRIMER = `/**
 * === TeraORM track primer (read first) ===
 *
 * TeraORM is a lightweight, chainable query builder. You compose a plan with
 * a fluent API instead of writing SQL by hand, then execute it through an
 * adapter (here: BigQuery).
 *
 * Minimal pattern:
 *
 *   import { BigQuery } from '@google-cloud/bigquery';
 *   import { defineModel, tera } from 'teraorm';
 *   import { createBigQueryAdapter } from '@teraorm/bigquery';
 *
 *   // 1. Describe the columns (just the names matter for the plan).
 *   const Sales = defineModel('sales', {
 *     category: '' as string,
 *     price: 0 as number,
 *   });
 *
 *   // 2. Build an adapter bound to the seeded table. The \`table\` argument
 *   //    you receive is \\\`project.dataset.table\\\` — strip the backticks
 *   //    and split it to feed projectId / datasetId / tableName.
 *   const [projectId, datasetId, tableName] = table.replace(/\`/g, '').split('.');
 *   const adapter = createBigQueryAdapter({
 *     projectId,
 *     datasetId,
 *     tableName,
 *     bigquery: bq,
 *   });
 *
 *   // 3. Compose and execute. Aggregates take an alias; filter post-aggregate
 *   //    rows with .having(alias, op, value); sort by alias with .orderByAlias.
 *   const rows = await tera(Sales, adapter)
 *     .select('category')
 *     .avg('price', 'avgPrice')
 *     .count('price', 'sales')
 *     .groupBy('category')
 *     .having('sales', '>=', minSales)
 *     .orderByAlias('avgPrice', 'desc')
 *     .execute();
 *
 *   return rows.map((r: any) => ({ ...your shape... }));
 *
 * Operator cheat sheet (.where / .andWhere / .having):
 *   '=', '!=', '>', '>=', '<', '<=', 'LIKE', 'IN', 'BETWEEN'
 *
 * The ORM-marker test will fail unless this file imports from 'teraorm'.
 */`;

const assignments: StudyAssignment[] = [
  {
    title: 'AB01-A SDK Native: Revenue by Store',
    description:
      'Question: write a BigQuery SQL query (via @google-cloud/bigquery) that returns aggregated revenue per store, filtered by minRevenue and ordered desc.',
    workerType: WorkerType.NODE_TERAORM,
    maxAttempts: 20,
    templateTitle: 'AB01 SDK - Revenue by store test',
    interviewConfig: {
      questions: [
        {
          key: 'sdkRevenueClarity',
          label:
            'Quão claro foi escrever esta query em SQL puro? (1 = nada claro, 5 = muito claro)',
          type: 'likert_1_5',
        },
        {
          key: 'sdkRevenueConfidence',
          label:
            'Quão confiante você está de que sua solução funciona em todos os casos? (1 = nada confiante, 5 = muito confiante)',
          type: 'likert_1_5',
        },
        {
          key: 'sdkRevenueErrorRisk',
          label:
            'Quanto risco de erro você sente em escrever este SQL à mão? (1 = nenhum, 5 = muito alto)',
          type: 'likert_1_5',
        },
        {
          key: 'sdkRevenueDifficulty',
          label: 'Qual foi a principal dificuldade neste exercício?',
          type: 'short_text',
        },
      ],
    },
    boilerplateContent: `import { BigQuery } from '@google-cloud/bigquery';

${SDK_PRIMER}

export type RevenueReportRow = { store: string; revenue: number };

/**
 * SDK track: compose a raw SQL query and execute it via the provided BigQuery client.
 *
 * The seeded table has columns:
 *   - store  STRING
 *   - total  INT64
 *
 * Return rows whose SUM(total) >= minRevenue, ordered by revenue desc.
 * The shape returned by the query must match { store: string; revenue: number }.
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
    title: 'AB01-B TeraORM: Revenue by Store',
    description:
      'Question: solve the same revenue-by-store scenario but using TeraORM to express the query against BigQuery. Result must match the SDK track exactly.',
    workerType: WorkerType.NODE_TERAORM,
    maxAttempts: 20,
    templateTitle: 'AB01 ORM - Revenue by store test',
    interviewConfig: {
      questions: [
        {
          key: 'ormRevenueClarity',
          label:
            'Quão claro foi expressar esta query com TeraORM? (1 = nada claro, 5 = muito claro)',
          type: 'likert_1_5',
        },
        {
          key: 'ormRevenueConfidence',
          label:
            'Quão confiante você está de que sua solução funciona em todos os casos? (1 = nada confiante, 5 = muito confiante)',
          type: 'likert_1_5',
        },
        {
          key: 'ormRevenueMentalEffort',
          label:
            'Quanto esforço mental foi necessário comparado à versão em SQL puro? (1 = muito menos, 5 = muito mais)',
          type: 'likert_1_5',
        },
        {
          key: 'ormRevenueDifficulty',
          label: 'Qual foi a principal dificuldade neste exercício?',
          type: 'short_text',
        },
      ],
    },
    boilerplateContent: `import { BigQuery } from '@google-cloud/bigquery';
import * as teraorm from 'teraorm';

${ORM_PRIMER}

export type RevenueReportRow = { store: string; revenue: number };

/**
 * ORM track: model and execute the query using TeraORM primitives.
 *
 * Seeded table columns:
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
`,
  },
  {
    title: 'AB02-A SDK Native: Top Customers by Region',
    description:
      'Question: write a BigQuery SQL query that returns top N customers in a region with at least minOrders, ordered by orders desc.',
    workerType: WorkerType.NODE_TERAORM,
    maxAttempts: 20,
    templateTitle: 'AB02 SDK - Top customers test',
    interviewConfig: {
      questions: [
        {
          key: 'sdkTopCustomersClarity',
          label:
            'Quão claro foi escrever esta query em SQL puro? (1 = nada claro, 5 = muito claro)',
          type: 'likert_1_5',
        },
        {
          key: 'sdkTopCustomersConfidence',
          label:
            'Quão confiante você está de que sua solução funciona em todos os casos? (1 = nada confiante, 5 = muito confiante)',
          type: 'likert_1_5',
        },
        {
          key: 'sdkTopCustomersErrorRisk',
          label:
            'Quanto risco de erro você sente em escrever este SQL à mão? (1 = nenhum, 5 = muito alto)',
          type: 'likert_1_5',
        },
        {
          key: 'sdkTopCustomersDifficulty',
          label: 'Qual foi a principal dificuldade neste exercício?',
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
    title: 'AB02-B TeraORM: Top Customers by Region',
    description:
      'Question: same top-customers scenario as AB02-A but composed with TeraORM. Result must match the SDK track exactly.',
    workerType: WorkerType.NODE_TERAORM,
    maxAttempts: 20,
    templateTitle: 'AB02 ORM - Top customers test',
    interviewConfig: {
      questions: [
        {
          key: 'ormTopCustomersClarity',
          label:
            'Quão claro foi expressar esta query com TeraORM? (1 = nada claro, 5 = muito claro)',
          type: 'likert_1_5',
        },
        {
          key: 'ormTopCustomersConfidence',
          label:
            'Quão confiante você está de que sua solução funciona em todos os casos? (1 = nada confiante, 5 = muito confiante)',
          type: 'likert_1_5',
        },
        {
          key: 'ormTopCustomersMentalEffort',
          label:
            'Quanto esforço mental foi necessário comparado à versão em SQL puro? (1 = muito menos, 5 = muito mais)',
          type: 'likert_1_5',
        },
        {
          key: 'ormTopCustomersDifficulty',
          label: 'Qual foi a principal dificuldade neste exercício?',
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
    title: 'AB03-A SDK Native: Average Ticket by Category',
    description:
      'Question: write a BigQuery SQL query that returns the average ticket (AVG of price) per category, filtered by minSales (HAVING COUNT(*) >= minSales) and ordered by avgTicket desc.',
    workerType: WorkerType.NODE_TERAORM,
    maxAttempts: 20,
    templateTitle: 'AB03 SDK - Average ticket by category test',
    interviewConfig: {
      questions: [
        {
          key: 'sdkAvgTicketClarity',
          label:
            'Quão claro foi escrever esta query em SQL puro? (1 = nada claro, 5 = muito claro)',
          type: 'likert_1_5',
        },
        {
          key: 'sdkAvgTicketConfidence',
          label:
            'Quão confiante você está de que sua solução funciona em todos os casos? (1 = nada confiante, 5 = muito confiante)',
          type: 'likert_1_5',
        },
        {
          key: 'sdkAvgTicketHavingDifficulty',
          label:
            'O uso de HAVING para filtrar agrupamentos foi natural? (1 = nada natural, 5 = muito natural)',
          type: 'likert_1_5',
        },
        {
          key: 'sdkAvgTicketDifficulty',
          label: 'Qual foi a principal dificuldade neste exercício?',
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
    title: 'AB03-B TeraORM: Average Ticket by Category',
    description:
      'Question: same average-ticket scenario as AB03-A but composed with TeraORM. Result must match the SDK track exactly.',
    workerType: WorkerType.NODE_TERAORM,
    maxAttempts: 20,
    templateTitle: 'AB03 ORM - Average ticket by category test',
    interviewConfig: {
      questions: [
        {
          key: 'ormAvgTicketClarity',
          label:
            'Quão claro foi expressar esta query com TeraORM? (1 = nada claro, 5 = muito claro)',
          type: 'likert_1_5',
        },
        {
          key: 'ormAvgTicketConfidence',
          label:
            'Quão confiante você está de que sua solução funciona em todos os casos? (1 = nada confiante, 5 = muito confiante)',
          type: 'likert_1_5',
        },
        {
          key: 'ormAvgTicketAggregations',
          label:
            'Expressar agregações (AVG, COUNT, HAVING) com TeraORM pareceu mais simples que SQL puro? (1 = muito mais difícil, 5 = muito mais simples)',
          type: 'likert_1_5',
        },
        {
          key: 'ormAvgTicketDifficulty',
          label: 'Qual foi a principal dificuldade neste exercício?',
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
    title: 'AB04-A SDK Native: Low Stock Products',
    description:
      'Question: write a BigQuery SQL query that returns active products (active = TRUE) whose stock is strictly less than threshold, ordered by stock asc, limited to N rows.',
    workerType: WorkerType.NODE_TERAORM,
    maxAttempts: 20,
    templateTitle: 'AB04 SDK - Low stock products test',
    interviewConfig: {
      questions: [
        {
          key: 'sdkLowStockClarity',
          label:
            'Quão claro foi escrever esta query em SQL puro? (1 = nada claro, 5 = muito claro)',
          type: 'likert_1_5',
        },
        {
          key: 'sdkLowStockConfidence',
          label:
            'Quão confiante você está de que sua solução funciona em todos os casos? (1 = nada confiante, 5 = muito confiante)',
          type: 'likert_1_5',
        },
        {
          key: 'sdkLowStockBoolFilter',
          label:
            'Expressar o filtro booleano (active = TRUE) foi natural em SQL? (1 = nada natural, 5 = muito natural)',
          type: 'likert_1_5',
        },
        {
          key: 'sdkLowStockDifficulty',
          label: 'Qual foi a principal dificuldade neste exercício?',
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
    title: 'AB04-B TeraORM: Low Stock Products',
    description:
      'Question: same low-stock scenario as AB04-A but composed with TeraORM. Result must match the SDK track exactly.',
    workerType: WorkerType.NODE_TERAORM,
    maxAttempts: 20,
    templateTitle: 'AB04 ORM - Low stock products test',
    interviewConfig: {
      questions: [
        {
          key: 'ormLowStockClarity',
          label:
            'Quão claro foi expressar esta query com TeraORM? (1 = nada claro, 5 = muito claro)',
          type: 'likert_1_5',
        },
        {
          key: 'ormLowStockConfidence',
          label:
            'Quão confiante você está de que sua solução funciona em todos os casos? (1 = nada confiante, 5 = muito confiante)',
          type: 'likert_1_5',
        },
        {
          key: 'ormLowStockBoolFilter',
          label:
            'Expressar o filtro booleano com TeraORM ficou mais legível que com SQL puro? (1 = muito menos legível, 5 = muito mais legível)',
          type: 'likert_1_5',
        },
        {
          key: 'ormLowStockDifficulty',
          label: 'Qual foi a principal dificuldade neste exercício?',
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
`,
  },
];

async function ensureClass(
  dataSource: DataSource,
  teacherId: number,
  studentId: number,
): Promise<number> {
  const classHasDescription = await hasColumn(dataSource, 'class', 'description');

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

    const admin = users.find((u: { email: string }) => u.email === 'admin@example.com');
    const student = users.find((u: { email: string }) => u.email === 'student@example.com');

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
        throw new Error(`Template not found in map: ${assignment.templateTitle}`);
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
