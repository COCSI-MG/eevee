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

type StudyAssignment = {
  title: string;
  description: string;
  workerType: WorkerType;
  maxAttempts: number;
  boilerplateContent: string;
  templateTitle: string;
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
      'Validates SQL-first implementation for grouped revenue by store.',
    workerType: WorkerType.NODE_DEFAULT,
    content: `import fs from 'fs';
import {
  buildRevenueByStoreQuery,
  computeRevenueByStore,
} from './src/app';

describe('AB01 SDK - Revenue by store', () => {
  const rows = [
    { store: 'A', total: 50 },
    { store: 'A', total: 25 },
    { store: 'B', total: 70 },
    { store: 'C', total: 10 },
    { store: 'B', total: 20 },
  ];

  it('buildRevenueByStoreQuery should express grouped SQL intent', () => {
    const sql = buildRevenueByStoreQuery(60).toLowerCase();
    expect(sql).toContain('select');
    expect(sql).toContain('from');
    expect(sql).toContain('group by');
    expect(sql).toContain('order by');
  });

  it('computeRevenueByStore should aggregate and filter correctly', () => {
    const report = computeRevenueByStore(rows, 60);
    expect(report).toEqual([
      { store: 'B', revenue: 90 },
      { store: 'A', revenue: 75 },
    ]);
  });

  it('solution should stay SDK-oriented for this track', () => {
    const source = fs.readFileSync('./src/app.ts', 'utf8').toLowerCase();
    expect(source.includes('teraorm')).toBe(false);
  });
});
`,
  },
  {
    title: 'AB01 ORM - Revenue by store test',
    description:
      'Validates ORM-oriented implementation for grouped revenue by store.',
    workerType: WorkerType.NODE_TERAORM,
    content: `import fs from 'fs';
import { buildRevenueByStoreReport } from './src/app';

describe('AB01 ORM - Revenue by store', () => {
  const rows = [
    { store: 'A', total: 50 },
    { store: 'A', total: 25 },
    { store: 'B', total: 70 },
    { store: 'C', total: 10 },
    { store: 'B', total: 20 },
  ];

  it('buildRevenueByStoreReport should aggregate and filter correctly', () => {
    const report = buildRevenueByStoreReport(rows, 60);
    expect(report).toEqual([
      { store: 'B', revenue: 90 },
      { store: 'A', revenue: 75 },
    ]);
  });

  it('solution should reference TeraORM in this track', () => {
    const source = fs.readFileSync('./src/app.ts', 'utf8').toLowerCase();
    expect(source.includes('teraorm')).toBe(true);
  });

  it('solution should avoid raw SQL composition in this track', () => {
    const source = fs.readFileSync('./src/app.ts', 'utf8').toLowerCase();
    expect(/\\bselect\\s+.+\\bfrom\\b/.test(source)).toBe(false);
  });
});
`,
  },
  {
    title: 'AB02 SDK - Top customers test',
    description:
      'Validates SQL-first implementation for filtered top customers.',
    workerType: WorkerType.NODE_DEFAULT,
    content: `import fs from 'fs';
import {
  buildTopCustomersQuery,
  computeTopCustomers,
} from './src/app';

describe('AB02 SDK - Top customers', () => {
  const rows = [
    { customer: 'Ana', region: 'sudeste', orders: 7 },
    { customer: 'Bruno', region: 'sul', orders: 4 },
    { customer: 'Carla', region: 'sudeste', orders: 10 },
    { customer: 'Diego', region: 'sudeste', orders: 6 },
  ];

  it('buildTopCustomersQuery should contain SQL clauses', () => {
    const sql = buildTopCustomersQuery('sudeste', 6, 2).toLowerCase();
    expect(sql).toContain('select');
    expect(sql).toContain('where');
    expect(sql).toContain('order by');
    expect(sql).toContain('limit');
  });

  it('computeTopCustomers should filter and rank correctly', () => {
    const out = computeTopCustomers(rows, 'sudeste', 6, 2);
    expect(out).toEqual([
      { customer: 'Carla', orders: 10 },
      { customer: 'Ana', orders: 7 },
    ]);
  });

  it('solution should stay SDK-oriented for this track', () => {
    const source = fs.readFileSync('./src/app.ts', 'utf8').toLowerCase();
    expect(source.includes('teraorm')).toBe(false);
  });
});
`,
  },
  {
    title: 'AB02 ORM - Top customers test',
    description:
      'Validates ORM-oriented implementation for filtered top customers.',
    workerType: WorkerType.NODE_TERAORM,
    content: `import fs from 'fs';
import { buildTopCustomersReport } from './src/app';

describe('AB02 ORM - Top customers', () => {
  const rows = [
    { customer: 'Ana', region: 'sudeste', orders: 7 },
    { customer: 'Bruno', region: 'sul', orders: 4 },
    { customer: 'Carla', region: 'sudeste', orders: 10 },
    { customer: 'Diego', region: 'sudeste', orders: 6 },
  ];

  it('buildTopCustomersReport should filter and rank correctly', () => {
    const out = buildTopCustomersReport(rows, 'sudeste', 6, 2);
    expect(out).toEqual([
      { customer: 'Carla', orders: 10 },
      { customer: 'Ana', orders: 7 },
    ]);
  });

  it('solution should reference TeraORM in this track', () => {
    const source = fs.readFileSync('./src/app.ts', 'utf8').toLowerCase();
    expect(source.includes('teraorm')).toBe(true);
  });

  it('solution should avoid raw SQL composition in this track', () => {
    const source = fs.readFileSync('./src/app.ts', 'utf8').toLowerCase();
    expect(/\\bselect\\s+.+\\bfrom\\b/.test(source)).toBe(false);
  });
});
`,
  },
];

const assignments: StudyAssignment[] = [
  {
    title: 'AB01-A SDK Native: Revenue by Store',
    description:
      'Question: build grouped revenue query and execute equivalent local aggregation without ORM. Answer target: report sorted by revenue desc and threshold filtering.',
    workerType: WorkerType.NODE_DEFAULT,
    maxAttempts: 20,
    templateTitle: 'AB01 SDK - Revenue by store test',
    boilerplateContent: `export type RevenueRow = { store: string; total: number };
export type RevenueReportRow = { store: string; revenue: number };

// Question 1: Write a SQL string that represents grouped revenue by store.
export function buildRevenueByStoreQuery(minRevenue: number): string {
  // TODO: implement for SDK track
  return '';
}

// Question 2: Simulate query execution result using local data.
export function computeRevenueByStore(
  rows: RevenueRow[],
  minRevenue: number,
): RevenueReportRow[] {
  // TODO: implement for SDK track
  return [];
}
`,
  },
  {
    title: 'AB01-B TeraORM: Revenue by Store',
    description:
      'Question: solve same grouped revenue scenario with ORM-oriented code style. Answer target: same output as AB01-A, but modeled with TeraORM style and no raw SQL.',
    workerType: WorkerType.NODE_TERAORM,
    maxAttempts: 20,
    templateTitle: 'AB01 ORM - Revenue by store test',
    boilerplateContent: `import { tera } from 'teraorm';

export type RevenueRow = { store: string; total: number };
export type RevenueReportRow = { store: string; revenue: number };

/*
  Question: implement with ORM-oriented style.
  You do not need a real DB adapter in this exercise, only preserve ORM semantics.
*/
export function buildRevenueByStoreReport(
  rows: RevenueRow[],
  minRevenue: number,
): RevenueReportRow[] {
  void tera;
  // TODO: implement for ORM track
  return [];
}
`,
  },
  {
    title: 'AB02-A SDK Native: Top Customers by Region',
    description:
      'Question: build SQL for ranking customers by region and minimum orders, and compute the same result locally. Answer target: ordered list with limit.',
    workerType: WorkerType.NODE_DEFAULT,
    maxAttempts: 20,
    templateTitle: 'AB02 SDK - Top customers test',
    boilerplateContent: `export type CustomerOrderRow = {
  customer: string;
  region: string;
  orders: number;
};

export type CustomerReportRow = {
  customer: string;
  orders: number;
};

export function buildTopCustomersQuery(
  region: string,
  minOrders: number,
  limit: number,
): string {
  // TODO: implement for SDK track
  return '';
}

export function computeTopCustomers(
  rows: CustomerOrderRow[],
  region: string,
  minOrders: number,
  limit: number,
): CustomerReportRow[] {
  // TODO: implement for SDK track
  return [];
}
`,
  },
  {
    title: 'AB02-B TeraORM: Top Customers by Region',
    description:
      'Question: solve same ranking scenario with ORM-oriented composition. Answer target: same output as AB02-A, with explicit intent and no raw SQL.',
    workerType: WorkerType.NODE_TERAORM,
    maxAttempts: 20,
    templateTitle: 'AB02 ORM - Top customers test',
    boilerplateContent: `import { tera } from 'teraorm';

export type CustomerOrderRow = {
  customer: string;
  region: string;
  orders: number;
};

export type CustomerReportRow = {
  customer: string;
  orders: number;
};

export function buildTopCustomersReport(
  rows: CustomerOrderRow[],
  region: string,
  minOrders: number,
  limit: number,
): CustomerReportRow[] {
  void tera;
  // TODO: implement for ORM track
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
