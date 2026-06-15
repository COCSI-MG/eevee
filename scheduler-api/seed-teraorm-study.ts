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
];

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
          label: 'Quão claro foi escrever esta query em SQL puro? (1 = nada claro, 5 = muito claro)',
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
 *
 * NOTE: \`table\` is already a backtick-quoted FQN like \`project.dataset.table\`,
 * so you can interpolate it directly into the FROM clause.
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
          label: 'Quão claro foi expressar esta query com TeraORM? (1 = nada claro, 5 = muito claro)',
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

export type RevenueReportRow = { store: string; revenue: number };

/**
 * ORM track: model and execute the query using TeraORM primitives.
 * You may still call bq.query() to run the resulting SQL, but the composition
 * itself must be ORM-style (no hand-written SELECT/FROM in this file).
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
          label: 'Quão claro foi escrever esta query em SQL puro? (1 = nada claro, 5 = muito claro)',
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
          label: 'Quão claro foi expressar esta query com TeraORM? (1 = nada claro, 5 = muito claro)',
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
