import * as dotenv from 'dotenv';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { WorkerType } from '../src/worker/enum/worker-type.enum';

dotenv.config({ path: join(__dirname, '../.env') });

type StudyTemplate = {
  title: string;
  legacyTitles?: string[];
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
  legacyTitles?: string[];
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
    title: 'AB01 SDK - Teste de Relatório de Onboarding',
    legacyTitles: ['AB01 SDK - Teste de Receita por Loja'],
    description:
      'Valida uma consulta com filtros opcionais sobre onboarding_events na trilha SDK.',
    workerType: WorkerType.NODE_TERAORM,
    content: `import fs from 'fs';
import { bq, seedTable, SeededTable } from '../test-utils/bq';
import { runOnboardingReport } from './src/app';

describe('AB01 SDK - Relatório de onboarding (BigQuery)', () => {
  let table: SeededTable;

  beforeAll(async () => {
    table = await seedTable(
      'ab01_onboarding',
      [
        { name: 'participant', type: 'STRING' },
        { name: 'razaoSocial', type: 'STRING' },
        { name: 'stage', type: 'STRING' },
        { name: 'economicGroup', type: 'STRING' },
        { name: 'idEmpreendimento', type: 'STRING' },
        { name: 'nomeComercial', type: 'STRING' },
      ],
      [
        { participant: '111', razaoSocial: 'Alpha DI', stage: 'IM002A', economicGroup: 'Grupo Norte', idEmpreendimento: 'E1', nomeComercial: 'Vista Norte' },
        { participant: '222', razaoSocial: 'Beta DI', stage: 'IM002A', economicGroup: 'Grupo Norte', idEmpreendimento: 'E2', nomeComercial: 'Parque Sul' },
        { participant: '333', razaoSocial: 'Gamma DI', stage: 'IM003B', economicGroup: 'Grupo Norte', idEmpreendimento: 'E3', nomeComercial: 'Solar Leste' },
        { participant: '444', razaoSocial: 'Delta DI', stage: 'IM002A', economicGroup: 'Grupo Sul', idEmpreendimento: 'E4', nomeComercial: 'Alto Oeste' },
      ],
    );
  }, 120000);

  afterAll(async () => {
    if (table) await table.drop();
  });

  it('retorna somente linhas que satisfazem os filtros opcionais', async () => {
    const normalized = await runOnboardingReport(bq, table.fqn, {
      currentStage: 'IM002A',
      economicGroup: 'Grupo Norte',
    });
    expect(normalized).toEqual([
      {
        participantDocument: '111',
        participantName: 'Alpha DI',
        currentStage: 'IM002A',
        economicGroup: 'Grupo Norte',
        empreendimentoId: 'E1',
        empreendimentoName: 'Vista Norte',
      },
      {
        participantDocument: '222',
        participantName: 'Beta DI',
        currentStage: 'IM002A',
        economicGroup: 'Grupo Norte',
        empreendimentoId: 'E2',
        empreendimentoName: 'Parque Sul',
      },
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
    title: 'AB01 ORM - Teste de Relatório de Onboarding',
    legacyTitles: ['AB01 ORM - Teste de Receita por Loja'],
    description:
      'Valida uma consulta com filtros opcionais sobre onboarding_events na trilha TeraORM.',
    workerType: WorkerType.NODE_TERAORM,
    dependencies: ['teraorm', '@teraorm/bigquery'],
    content: `import fs from 'fs';
  import { bq, seedTable, SeededTable } from '../test-utils/bq';
  import { createTeraRepository } from '../test-utils/tera';
import { buildOnboardingReportQuery } from './src/app';

describe('AB01 TeraORM - Relatório de onboarding (BigQuery)', () => {
  let table: SeededTable;

  beforeAll(async () => {
    table = await seedTable(
      'ab01_onboarding',
      [
        { name: 'participant', type: 'STRING' },
        { name: 'razaoSocial', type: 'STRING' },
        { name: 'stage', type: 'STRING' },
        { name: 'economicGroup', type: 'STRING' },
        { name: 'idEmpreendimento', type: 'STRING' },
        { name: 'nomeComercial', type: 'STRING' },
      ],
      [
        { participant: '111', razaoSocial: 'Alpha DI', stage: 'IM002A', economicGroup: 'Grupo Norte', idEmpreendimento: 'E1', nomeComercial: 'Vista Norte' },
        { participant: '222', razaoSocial: 'Beta DI', stage: 'IM002A', economicGroup: 'Grupo Norte', idEmpreendimento: 'E2', nomeComercial: 'Parque Sul' },
        { participant: '333', razaoSocial: 'Gamma DI', stage: 'IM003B', economicGroup: 'Grupo Norte', idEmpreendimento: 'E3', nomeComercial: 'Solar Leste' },
        { participant: '444', razaoSocial: 'Delta DI', stage: 'IM002A', economicGroup: 'Grupo Sul', idEmpreendimento: 'E4', nomeComercial: 'Alto Oeste' },
      ],
    );
  }, 120000);

  afterAll(async () => {
    if (table) await table.drop();
  });

  it('retorna somente linhas que satisfazem os filtros opcionais', async () => {
    const events = createTeraRepository(bq, table.fqn, 'ab01_onboarding_model', {
      participant: '' as string,
      razaoSocial: '' as string,
      stage: '' as string,
      economicGroup: '' as string,
      idEmpreendimento: '' as string,
      nomeComercial: '' as string,
    });

    const out = await buildOnboardingReportQuery(events, {
      currentStage: 'IM002A',
      economicGroup: 'Grupo Norte',
    }).execute();
    const normalized = out.map((r: any) => ({
      participantDocument: r.participant,
      participantName: r.razaoSocial,
      currentStage: r.stage,
      economicGroup: r.economicGroup,
      empreendimentoId: r.idEmpreendimento,
      empreendimentoName: r.nomeComercial,
    }));
    expect(normalized).toEqual([
      {
        participantDocument: '111',
        participantName: 'Alpha DI',
        currentStage: 'IM002A',
        economicGroup: 'Grupo Norte',
        empreendimentoId: 'E1',
        empreendimentoName: 'Vista Norte',
      },
      {
        participantDocument: '222',
        participantName: 'Beta DI',
        currentStage: 'IM002A',
        economicGroup: 'Grupo Norte',
        empreendimentoId: 'E2',
        empreendimentoName: 'Parque Sul',
      },
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
    title: 'AB02 SDK - Teste de Filtros de Empreendimento',
    legacyTitles: ['AB02 SDK - Teste de Principais Clientes'],
    description:
      'Valida uma busca com filtros LIKE/IN sobre onboarding_events na trilha SDK.',
    workerType: WorkerType.NODE_TERAORM,
    content: `import fs from 'fs';
import { bq, seedTable, SeededTable } from '../test-utils/bq';
import { runEmpreendimentoSearch } from './src/app';

describe('AB02 SDK - Filtros de empreendimento (BigQuery)', () => {
  let table: SeededTable;

  beforeAll(async () => {
    table = await seedTable(
      'ab02_onboarding',
      [
        { name: 'participant', type: 'STRING' },
        { name: 'razaoSocial', type: 'STRING' },
        { name: 'stage', type: 'STRING' },
        { name: 'economicGroup', type: 'STRING' },
        { name: 'idEmpreendimento', type: 'STRING' },
        { name: 'nomeComercial', type: 'STRING' },
      ],
      [
        { participant: '111', razaoSocial: 'Alpha DI', stage: 'IM002A', economicGroup: 'Grupo Norte', idEmpreendimento: 'E1', nomeComercial: 'Residencial Aurora' },
        { participant: '222', razaoSocial: 'Beta DI', stage: 'IM003A', economicGroup: 'Grupo Norte', idEmpreendimento: 'E2', nomeComercial: 'Residencial Brisa' },
        { participant: '333', razaoSocial: 'Gamma DI', stage: 'IM004C', economicGroup: 'Grupo Sul', idEmpreendimento: 'E3', nomeComercial: 'Comercial Centro' },
        { participant: '444', razaoSocial: 'Alpha DI', stage: 'IM002B', economicGroup: 'Grupo Norte', idEmpreendimento: 'E4', nomeComercial: 'Residencial Delta' },
      ],
    );
  }, 120000);

  afterAll(async () => {
    if (table) await table.drop();
  });

  it('retorna resultados combinando igualdade, like e in', async () => {
    const normalized = await runEmpreendimentoSearch(
      bq,
      table.fqn,
      {
        socialReasonDI: 'Alpha DI',
        empreendimentoNamePrefix: 'Residencial',
        stages: ['IM002A', 'IM002B'],
      },
      5,
    );
    expect(normalized).toEqual([
      {
        participantDocument: '111',
        participantName: 'Alpha DI',
        currentStage: 'IM002A',
        empreendimentoId: 'E1',
        empreendimentoName: 'Residencial Aurora',
      },
      {
        participantDocument: '444',
        participantName: 'Alpha DI',
        currentStage: 'IM002B',
        empreendimentoId: 'E4',
        empreendimentoName: 'Residencial Delta',
      },
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
    title: 'AB02 ORM - Teste de Filtros de Empreendimento',
    legacyTitles: ['AB02 ORM - Teste de Principais Clientes'],
    description:
      'Valida uma busca com filtros LIKE/IN sobre onboarding_events na trilha TeraORM.',
    workerType: WorkerType.NODE_TERAORM,
    dependencies: ['teraorm', '@teraorm/bigquery'],
    content: `import fs from 'fs';
  import { bq, seedTable, SeededTable } from '../test-utils/bq';
  import { createTeraRepository } from '../test-utils/tera';
import { buildEmpreendimentoSearchQuery } from './src/app';

describe('AB02 TeraORM - Filtros de empreendimento (BigQuery)', () => {
  let table: SeededTable;

  beforeAll(async () => {
    table = await seedTable(
      'ab02_onboarding',
      [
        { name: 'participant', type: 'STRING' },
        { name: 'razaoSocial', type: 'STRING' },
        { name: 'stage', type: 'STRING' },
        { name: 'economicGroup', type: 'STRING' },
        { name: 'idEmpreendimento', type: 'STRING' },
        { name: 'nomeComercial', type: 'STRING' },
      ],
      [
        { participant: '111', razaoSocial: 'Alpha DI', stage: 'IM002A', economicGroup: 'Grupo Norte', idEmpreendimento: 'E1', nomeComercial: 'Residencial Aurora' },
        { participant: '222', razaoSocial: 'Beta DI', stage: 'IM003A', economicGroup: 'Grupo Norte', idEmpreendimento: 'E2', nomeComercial: 'Residencial Brisa' },
        { participant: '333', razaoSocial: 'Gamma DI', stage: 'IM004C', economicGroup: 'Grupo Sul', idEmpreendimento: 'E3', nomeComercial: 'Comercial Centro' },
        { participant: '444', razaoSocial: 'Alpha DI', stage: 'IM002B', economicGroup: 'Grupo Norte', idEmpreendimento: 'E4', nomeComercial: 'Residencial Delta' },
      ],
    );
  }, 120000);

  afterAll(async () => {
    if (table) await table.drop();
  });

  it('retorna resultados combinando igualdade, like e in', async () => {
    const events = createTeraRepository(bq, table.fqn, 'ab02_onboarding_model', {
      participant: '' as string,
      razaoSocial: '' as string,
      stage: '' as string,
      economicGroup: '' as string,
      idEmpreendimento: '' as string,
      nomeComercial: '' as string,
    });

    const out = await buildEmpreendimentoSearchQuery(
      events,
      {
        socialReasonDI: 'Alpha DI',
        empreendimentoNamePrefix: 'Residencial',
        stages: ['IM002A', 'IM002B'],
      },
      2,
    ).execute();
    const normalized = out.map((r: any) => ({
      participantDocument: r.participant,
      participantName: r.razaoSocial,
      currentStage: r.stage,
      empreendimentoId: r.idEmpreendimento,
      empreendimentoName: r.nomeComercial,
    }));
    expect(normalized).toEqual([
      {
        participantDocument: '111',
        participantName: 'Alpha DI',
        currentStage: 'IM002A',
        empreendimentoId: 'E1',
        empreendimentoName: 'Residencial Aurora',
      },
      {
        participantDocument: '444',
        participantName: 'Alpha DI',
        currentStage: 'IM002B',
        empreendimentoId: 'E4',
        empreendimentoName: 'Residencial Delta',
      },
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
    title: 'AB03 SDK - Teste de Horas por Empreendimento',
    legacyTitles: ['AB03 SDK - Teste de Ticket Médio por Categoria'],
    description:
      'Valida uma consulta pontual em time_by_onboarding_step na trilha SDK.',
    workerType: WorkerType.NODE_TERAORM,
    content: `import fs from 'fs';
import { bq, seedTable, SeededTable } from '../test-utils/bq';
import { runTimeAggregatesByEmpreendimento } from './src/app';

describe('AB03 SDK - Horas por empreendimento (BigQuery)', () => {
  let table: SeededTable;

  beforeAll(async () => {
    table = await seedTable(
      'ab03_time_by_step',
      [
        { name: 'idEmpreendimento', type: 'STRING' },
        { name: 'totalHours', type: 'INT64' },
        { name: 'hours_in_IM002A', type: 'INT64' },
        { name: 'hours_in_IM002B', type: 'INT64' },
      ],
      [
        { idEmpreendimento: 'E1', totalHours: 12, hours_in_IM002A: 5, hours_in_IM002B: 7 },
        { idEmpreendimento: 'E2', totalHours: 20, hours_in_IM002A: 8, hours_in_IM002B: 12 },
        { idEmpreendimento: 'E3', totalHours: 9, hours_in_IM002A: 4, hours_in_IM002B: 5 },
      ],
    );
  }, 120000);

  afterAll(async () => {
    if (table) await table.drop();
  });

  it('retorna a linha esperada para um empreendimento especifico', async () => {
    const normalized = await runTimeAggregatesByEmpreendimento(
      bq,
      table.fqn,
      'E2',
    );
    expect(normalized).toEqual([
      {
        idEmpreendimento: 'E2',
        totalHours: 20,
        hoursInIM002A: 8,
        hoursInIM002B: 12,
      },
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
    title: 'AB03 ORM - Teste de Horas por Empreendimento',
    legacyTitles: ['AB03 ORM - Teste de Ticket Médio por Categoria'],
    description:
      'Valida uma consulta pontual em time_by_onboarding_step na trilha TeraORM.',
    workerType: WorkerType.NODE_TERAORM,
    dependencies: ['teraorm', '@teraorm/bigquery'],
    content: `import fs from 'fs';
  import { bq, seedTable, SeededTable } from '../test-utils/bq';
  import { createTeraRepository } from '../test-utils/tera';
import { buildTimeAggregatesQuery } from './src/app';

describe('AB03 TeraORM - Horas por empreendimento (BigQuery)', () => {
  let table: SeededTable;

  beforeAll(async () => {
    table = await seedTable(
      'ab03_time_by_step',
      [
        { name: 'idEmpreendimento', type: 'STRING' },
        { name: 'totalHours', type: 'INT64' },
        { name: 'hours_in_IM002A', type: 'INT64' },
        { name: 'hours_in_IM002B', type: 'INT64' },
      ],
      [
        { idEmpreendimento: 'E1', totalHours: 12, hours_in_IM002A: 5, hours_in_IM002B: 7 },
        { idEmpreendimento: 'E2', totalHours: 20, hours_in_IM002A: 8, hours_in_IM002B: 12 },
        { idEmpreendimento: 'E3', totalHours: 9, hours_in_IM002A: 4, hours_in_IM002B: 5 },
      ],
    );
  }, 120000);

  afterAll(async () => {
    if (table) await table.drop();
  });

  it('retorna a linha esperada para um empreendimento especifico', async () => {
    const steps = createTeraRepository(bq, table.fqn, 'ab03_time_model', {
      idEmpreendimento: '' as string,
      totalHours: 0 as number,
      hours_in_IM002A: 0 as number,
      hours_in_IM002B: 0 as number,
    });

    const out = await buildTimeAggregatesQuery(steps, 'E2').execute();
    const normalized = out.map((r: any) => ({
      idEmpreendimento: r.idEmpreendimento,
      totalHours: Number(r.totalHours),
      hoursInIM002A: Number(r.hours_in_IM002A),
      hoursInIM002B: Number(r.hours_in_IM002B),
    }));
    expect(normalized).toEqual([
      {
        idEmpreendimento: 'E2',
        totalHours: 20,
        hoursInIM002A: 8,
        hoursInIM002B: 12,
      },
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
    title: 'AB04 SDK - Teste de Ranking por Horas Totais',
    legacyTitles: ['AB04 SDK - Teste de Produtos com Baixo Estoque'],
    description:
      'Valida um ranking por totalHours com filtros opcionais na trilha SDK.',
    workerType: WorkerType.NODE_TERAORM,
    content: `import fs from 'fs';
import { bq, seedTable, SeededTable } from '../test-utils/bq';
import { runTopHoursRanking } from './src/app';

describe('AB04 SDK - Ranking por horas totais (BigQuery)', () => {
  let table: SeededTable;

  beforeAll(async () => {
    table = await seedTable(
      'ab04_time_by_step',
      [
        { name: 'idEmpreendimento', type: 'STRING' },
        { name: 'totalHours', type: 'INT64' },
      ],
      [
        { idEmpreendimento: 'E1', totalHours: 12 },
        { idEmpreendimento: 'E2', totalHours: 20 },
        { idEmpreendimento: 'E3', totalHours: 8 },
        { idEmpreendimento: 'E4', totalHours: 15 },
      ],
    );
  }, 120000);

  afterAll(async () => {
    if (table) await table.drop();
  });

  it('retorna ranking por totalHours com filtro opcional de ids', async () => {
    const normalized = await runTopHoursRanking(
      bq,
      table.fqn,
      10,
      ['E1', 'E2', 'E4'],
      2,
    );
    expect(normalized).toEqual([
      { idEmpreendimento: 'E2', totalHours: 20 },
      { idEmpreendimento: 'E4', totalHours: 15 },
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
    title: 'AB04 ORM - Teste de Ranking por Horas Totais',
    legacyTitles: ['AB04 ORM - Teste de Produtos com Baixo Estoque'],
    description:
      'Valida um ranking por totalHours com filtros opcionais na trilha TeraORM.',
    workerType: WorkerType.NODE_TERAORM,
    dependencies: ['teraorm', '@teraorm/bigquery'],
    content: `import fs from 'fs';
  import { bq, seedTable, SeededTable } from '../test-utils/bq';
  import { createTeraRepository } from '../test-utils/tera';
import { buildTopHoursRankingQuery } from './src/app';

describe('AB04 TeraORM - Ranking por horas totais (BigQuery)', () => {
  let table: SeededTable;

  beforeAll(async () => {
    table = await seedTable(
      'ab04_time_by_step',
      [
        { name: 'idEmpreendimento', type: 'STRING' },
        { name: 'totalHours', type: 'INT64' },
      ],
      [
        { idEmpreendimento: 'E1', totalHours: 12 },
        { idEmpreendimento: 'E2', totalHours: 20 },
        { idEmpreendimento: 'E3', totalHours: 8 },
        { idEmpreendimento: 'E4', totalHours: 15 },
      ],
    );
  }, 120000);

  afterAll(async () => {
    if (table) await table.drop();
  });

  it('retorna ranking por totalHours com filtro opcional de ids', async () => {
    const steps = createTeraRepository(
      bq,
      table.fqn,
      'ab04_time_model',
      {
        idEmpreendimento: '' as string,
        totalHours: 0 as number,
      },
    );

    const out = await buildTopHoursRankingQuery(
      steps,
      10,
      ['E1', 'E2', 'E4'],
      2,
    ).execute();
    const normalized = out.map((r: any) => ({
      idEmpreendimento: r.idEmpreendimento,
      totalHours: Number(r.totalHours),
    }));
    expect(normalized).toEqual([
      { idEmpreendimento: 'E2', totalHours: 20 },
      { idEmpreendimento: 'E4', totalHours: 15 },
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
 * === Guia rapido de operadores e metodos (sem depender de IntelliSense) ===
 *
 * Operadores de comparacao suportados em .where/.andWhere/.having:
 *   '=', '!=', '>', '>=', '<', '<=', 'LIKE', 'IN', 'BETWEEN'
 *
 * Como usar cada operador:
 *   - '=' e '!=': valor escalar, ex: .where('region', '=', 'sudeste')
 *   - '>', '>=', '<', '<=': valor numerico/data, ex: .andWhere('orders', '>=', 5)
 *   - 'LIKE': string com padrao, ex: .where('customer', 'LIKE', 'Ana%')
 *   - 'IN': array de valores, ex: .where('region', 'IN', ['sudeste', 'sul'])
 *   - 'BETWEEN': array com 2 valores [inicio, fim], ex: .where('price', 'BETWEEN', [10, 100])
 *
 * Metodos principais do builder:
 *   - .select('campo1', 'campo2', ...)
 *   - .where(campo, operador, valor)
 *   - .andWhere(campo, operador, valor)
 *   - .orderBy(campo, 'asc' | 'desc')
 *   - .limit(n)
 *   - .sum(campo, alias), .avg(campo, alias), .count(campo, alias)
 *   - .countDistinct(campo, alias), .min(campo, alias), .max(campo, alias)
 *   - .groupBy('campo1', 'campo2', ...)
 *   - .having(aliasAgregado, operador, valor)
 *   - .orderByAlias(alias, 'asc' | 'desc')
 *   - .execute()
 *
 * Regras praticas:
 *   - Se usar agregacao (sum/avg/count/etc), geralmente voce precisara de .groupBy.
 *   - Em .having, use o alias definido na agregacao (nao o nome bruto da coluna).
 *   - Em .orderByAlias, use alias de agregacao; em .orderBy, use coluna real do modelo.
 *   - .limit(n) exige inteiro nao-negativo.
 *
 * Nas atividades desta trilha, o boilerplate geralmente ja deixa model + adapter
 * montados acima da funcao principal. O foco esperado e a composicao da consulta.
 *
 * O teste de marcador ORM falhará a menos que este arquivo importe de 'teraorm'.
 */`;

const AB01_ACCEPTANCE_CRITERIA = [
  'Objetivo: montar um relatorio de onboarding com filtros opcionais.',
  'Entrada: tabela onboarding_events com participant, razaoSocial, stage, economicGroup, idEmpreendimento e nomeComercial.',
  'Filtros opcionais: participantDocument, currentStage e economicGroup.',
  'Regra: aplicar apenas os filtros informados.',
  'Ordenacao: participant em ordem crescente.',
  'Limite: retornar no maximo 100 linhas.',
].join(' ');

const AB02_ACCEPTANCE_CRITERIA = [
  'Objetivo: montar uma busca de empreendimentos com filtros compostos.',
  'Entrada: tabela onboarding_events com participant, razaoSocial, stage, economicGroup, idEmpreendimento e nomeComercial.',
  'Filtros: socialReasonDI opcional, empreendimentoNamePrefix opcional e stages opcional.',
  'Regra: usar igualdade para socialReasonDI, LIKE prefix% para empreendimentoNamePrefix e IN para stages.',
  'Ordenacao: nomeComercial em ordem crescente.',
  'Limite: retornar no maximo limit registros.',
].join(' ');

const AB03_ACCEPTANCE_CRITERIA = [
  'Objetivo: consultar horas agregadas por empreendimento.',
  'Entrada: tabela time_by_onboarding_step com idEmpreendimento, totalHours, hours_in_IM002A e hours_in_IM002B.',
  'Regra: filtrar por empreendimentoId exato.',
  'Selecao: retornar idEmpreendimento, totalHours, hours_in_IM002A e hours_in_IM002B.',
  'Limite: retornar apenas 1 linha.',
].join(' ');

const AB04_ACCEPTANCE_CRITERIA = [
  'Objetivo: montar um ranking por horas totais.',
  'Entrada: tabela time_by_onboarding_step com idEmpreendimento e totalHours.',
  'Filtro: totalHours >= minHours e, se informado, idEmpreendimento IN ids.',
  'Ordenacao: totalHours em ordem decrescente.',
  'Limite: retornar no maximo limit registros.',
].join(' ');

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
          label: 'Como você avalia sua familiaridade prévia com SQL?',
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
    title: 'AB01-A SDK Nativo: Relatório de Onboarding com Filtros Opcionais',
    legacyTitles: ['AB01-A SDK Nativo: Receita por Loja'],
    description: `Trilha SDK nativo. ${AB01_ACCEPTANCE_CRITERIA}`,
    workerType: WorkerType.NODE_TERAORM,
    maxAttempts: 20,
    templateTitle: 'AB01 SDK - Teste de Relatório de Onboarding',
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

export type OnboardingFilters = {
  participantDocument?: string;
  currentStage?: string;
  economicGroup?: string;
};

export type OnboardingReportRow = {
  participantDocument: string;
  participantName: string;
  currentStage: string;
  economicGroup: string;
  empreendimentoId: string;
  empreendimentoName: string;
};

/**
 * Monte um relatorio de onboarding usando SQL do BigQuery.
 *
 * Colunas da tabela:
 *   - participant        STRING
 *   - razaoSocial        STRING
 *   - stage              STRING
 *   - economicGroup      STRING
 *   - idEmpreendimento   STRING
 *   - nomeComercial      STRING
 *
 * Selecione:
 *   participant AS participantDocument,
 *   razaoSocial AS participantName,
 *   stage AS currentStage,
 *   economicGroup,
 *   idEmpreendimento AS empreendimentoId,
 *   nomeComercial AS empreendimentoName
 *
 * Regras:
 *   - aplique apenas os filtros informados em filters
 *   - ordene por participant asc
 *   - retorne no maximo 100 linhas
 */
export async function runOnboardingReport(
  bq: BigQuery,
  table: string,
  filters: OnboardingFilters,
): Promise<OnboardingReportRow[]> {
  // TODO: implemente usando bq.query({ query: 'SELECT ...', params: ... })
  return [];
}
`,
  },
  {
    title: 'AB02-A SDK Nativo: Filtros de Empreendimento',
    legacyTitles: ['AB02-A SDK Nativo: Principais Clientes por Região'],
    description: `Trilha SDK nativo. ${AB02_ACCEPTANCE_CRITERIA}`,
    workerType: WorkerType.NODE_TERAORM,
    maxAttempts: 20,
    templateTitle: 'AB02 SDK - Teste de Filtros de Empreendimento',
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

export type EmpreendimentoSearchFilters = {
  socialReasonDI?: string;
  empreendimentoNamePrefix?: string;
  stages?: string[];
};

export type EmpreendimentoSearchRow = {
  participantDocument: string;
  participantName: string;
  currentStage: string;
  empreendimentoId: string;
  empreendimentoName: string;
};

/**
 * Monte uma busca de empreendimentos usando SQL do BigQuery.
 *
 * Colunas da tabela:
 *   - participant        STRING
 *   - razaoSocial        STRING
 *   - stage              STRING
 *   - economicGroup      STRING
 *   - idEmpreendimento   STRING
 *   - nomeComercial      STRING
 *
 * Selecione:
 *   participant AS participantDocument,
 *   razaoSocial AS participantName,
 *   stage AS currentStage,
 *   idEmpreendimento AS empreendimentoId,
 *   nomeComercial AS empreendimentoName
 *
 * Regras:
 *   - se socialReasonDI existir, filtre razaoSocial = valor
 *   - se empreendimentoNamePrefix existir, filtre nomeComercial LIKE 'prefix%'
 *   - se stages existir e tiver itens, filtre stage IN UNNEST(@stages)
 *   - ordene por nomeComercial asc
 *   - limite a consulta pelo parametro limit
 */
export async function runEmpreendimentoSearch(
  bq: BigQuery,
  table: string,
  filters: EmpreendimentoSearchFilters,
  limit: number,
): Promise<EmpreendimentoSearchRow[]> {
  // TODO: implemente usando bq.query({ query: 'SELECT ...', params: ... })
  return [];
}
`,
  },
  {
    title: 'AB03-A SDK Nativo: Horas por Empreendimento',
    legacyTitles: ['AB03-A SDK Nativo: Ticket Médio por Categoria'],
    description: `Trilha SDK nativo. ${AB03_ACCEPTANCE_CRITERIA}`,
    workerType: WorkerType.NODE_TERAORM,
    maxAttempts: 20,
    templateTitle: 'AB03 SDK - Teste de Horas por Empreendimento',
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

export type TimeAggregateRow = {
  idEmpreendimento: string;
  totalHours: number;
  hoursInIM002A: number;
  hoursInIM002B: number;
};

/**
 * Consulte horas agregadas por empreendimento usando SQL do BigQuery.
 *
 * Colunas da tabela:
 *   - idEmpreendimento   STRING
 *   - totalHours         INT64
 *   - hours_in_IM002A    INT64
 *   - hours_in_IM002B    INT64
 *
 * Selecione:
 *   idEmpreendimento, totalHours,
 *   hours_in_IM002A, hours_in_IM002B
 *
 * Regras:
 *   - filtrar idEmpreendimento = parametro empreendimentoId
 *   - retornar apenas 1 linha
 *
 * Atencao: hours_in_IM002A e hours_in_IM002B voltam como INT64 — use Number().
 * O tipo de retorno espera hoursInIM002A e hoursInIM002B (camelCase).
 */
export async function runTimeAggregatesByEmpreendimento(
  bq: BigQuery,
  table: string,
  empreendimentoId: string,
): Promise<TimeAggregateRow[]> {
  // TODO: implemente usando bq.query({ query: 'SELECT ...', params: ... })
  return [];
}
`,
  },
  {
    title: 'AB04-A SDK Nativo: Ranking por Horas Totais',
    legacyTitles: ['AB04-A SDK Nativo: Produtos com Baixo Estoque'],
    description: `Trilha SDK nativo. ${AB04_ACCEPTANCE_CRITERIA}`,
    workerType: WorkerType.NODE_TERAORM,
    maxAttempts: 20,
    templateTitle: 'AB04 SDK - Teste de Ranking por Horas Totais',
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

export type HoursRankingRow = {
  idEmpreendimento: string;
  totalHours: number;
};

/**
 * Monte um ranking por horas totais usando SQL do BigQuery.
 *
 * Colunas da tabela:
 *   - idEmpreendimento   STRING
 *   - totalHours         INT64
 *
 * Selecione:
 *   idEmpreendimento, totalHours
 *
 * Regras:
 *   - filtrar totalHours >= minHours
 *   - se ids tiver itens, filtrar idEmpreendimento IN UNNEST(@ids)
 *   - ordenar por totalHours desc
 *   - limitar pelo parametro limit
 */
export async function runTopHoursRanking(
  bq: BigQuery,
  table: string,
  minHours: number,
  ids: string[],
  limit: number,
): Promise<HoursRankingRow[]> {
  // TODO: implemente usando bq.query({ query: 'SELECT ...', params: ... })
  return [];
}
`,
  },
  {
    title: 'AB01-B TeraORM: Relatório de Onboarding com Filtros Opcionais',
    legacyTitles: ['AB01-B TeraORM: Receita por Loja'],
    description: `Trilha TeraORM. ${AB01_ACCEPTANCE_CRITERIA} Requisito de trilha: a implementacao deve usar teraorm.`,
    workerType: WorkerType.NODE_TERAORM,
    maxAttempts: 20,
    templateTitle: 'AB01 ORM - Teste de Relatório de Onboarding',
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
import { defineModel, tera } from 'teraorm';
import { createBigQueryAdapter } from '@teraorm/bigquery';

${ORM_PRIMER}

export type OnboardingFilters = {
  participantDocument?: string;
  currentStage?: string;
  economicGroup?: string;
};

function createOnboardingEventsRepository(bq: BigQuery, table: string) {
  const [projectId, datasetId, tableName] = table.replace(/\`/g, '').split('.');
  const adapter = createBigQueryAdapter({ projectId, datasetId, tableName, bigquery: bq });

  const OnboardingEvents = defineModel('onboarding_events', {
    participant: '' as string,
    razaoSocial: '' as string,
    stage: '' as string,
    economicGroup: '' as string,
    idEmpreendimento: '' as string,
    nomeComercial: '' as string,
  });

  return tera(OnboardingEvents, adapter);
}

/**
 * Monte a consulta de onboarding com o repositorio TeraORM ja preparado.
 *
 * Regras:
 *   - aplique apenas os filtros informados em filters
 *   - ordene por participant asc
 *   - retorne no maximo 100 linhas
 */
export function buildOnboardingReportQuery(events: any, filters: OnboardingFilters) {
  // TODO: retorne a query TeraORM composta
  return events;
}

export async function runOnboardingReport(bq: BigQuery, table: string, filters: OnboardingFilters) {
  const events = createOnboardingEventsRepository(bq, table);
  return buildOnboardingReportQuery(events, filters).execute();
}
`,
  },
  {
    title: 'AB02-B TeraORM: Filtros de Empreendimento',
    legacyTitles: ['AB02-B TeraORM: Principais Clientes por Região'],
    description: `Trilha TeraORM. ${AB02_ACCEPTANCE_CRITERIA} Requisito de trilha: a implementacao deve usar teraorm.`,
    workerType: WorkerType.NODE_TERAORM,
    maxAttempts: 20,
    templateTitle: 'AB02 ORM - Teste de Filtros de Empreendimento',
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
import { defineModel, tera } from 'teraorm';
import { createBigQueryAdapter } from '@teraorm/bigquery';

${ORM_PRIMER}

export type EmpreendimentoSearchFilters = {
  socialReasonDI?: string;
  empreendimentoNamePrefix?: string;
  stages?: string[];
};

function createOnboardingEventsRepository(bq: BigQuery, table: string) {
  const [projectId, datasetId, tableName] = table.replace(/\`/g, '').split('.');
  const adapter = createBigQueryAdapter({ projectId, datasetId, tableName, bigquery: bq });

  const OnboardingEvents = defineModel('onboarding_events', {
    participant: '' as string,
    razaoSocial: '' as string,
    stage: '' as string,
    economicGroup: '' as string,
    idEmpreendimento: '' as string,
    nomeComercial: '' as string,
  });

  return tera(OnboardingEvents, adapter);
}

/**
 * Monte uma busca de empreendimentos com o repositorio TeraORM ja preparado.
 *
 * Regras:
 *   - se socialReasonDI existir, filtre razaoSocial = valor
 *   - se empreendimentoNamePrefix existir, filtre nomeComercial LIKE 'prefix%'
 *   - se stages existir e tiver itens, filtre stage IN stages
 *   - ordene por nomeComercial asc
 *   - limite a consulta pelo parametro limit
 */
export function buildEmpreendimentoSearchQuery(events: any, filters: EmpreendimentoSearchFilters, limit: number) {
  // TODO: retorne a query TeraORM composta
  return events;
}

export async function runEmpreendimentoSearch(
  bq: BigQuery,
  table: string,
  filters: EmpreendimentoSearchFilters,
  limit: number,
) {
  const events = createOnboardingEventsRepository(bq, table);
  return buildEmpreendimentoSearchQuery(events, filters, limit).execute();
}
`,
  },
  {
    title: 'AB03-B TeraORM: Horas por Empreendimento',
    legacyTitles: ['AB03-B TeraORM: Ticket Médio por Categoria'],
    description: `Trilha TeraORM. ${AB03_ACCEPTANCE_CRITERIA} Requisito de trilha: a implementacao deve usar teraorm.`,
    workerType: WorkerType.NODE_TERAORM,
    maxAttempts: 20,
    templateTitle: 'AB03 ORM - Teste de Horas por Empreendimento',
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
import { defineModel, tera } from 'teraorm';
import { createBigQueryAdapter } from '@teraorm/bigquery';

${ORM_PRIMER}

function createTimeByStepRepository(bq: BigQuery, table: string) {
  const [projectId, datasetId, tableName] = table.replace(/\`/g, '').split('.');
  const adapter = createBigQueryAdapter({ projectId, datasetId, tableName, bigquery: bq });

  const TimeByOnboardingStep = defineModel('time_by_onboarding_step', {
    idEmpreendimento: '' as string,
    totalHours: 0 as number,
    hours_in_IM002A: 0 as number,
    hours_in_IM002B: 0 as number,
  });

  return tera(TimeByOnboardingStep, adapter);
}

/**
 * Monte a consulta de horas por empreendimento com o repositorio TeraORM ja preparado.
 *
 * Regras:
 *   - filtrar idEmpreendimento = parametro empreendimentoId
 *   - selecionar idEmpreendimento, totalHours, hours_in_IM002A e hours_in_IM002B
 *   - retornar apenas 1 linha
 */
export function buildTimeAggregatesQuery(steps: any, empreendimentoId: string) {
  // TODO: retorne a query TeraORM composta
  return steps;
}

export async function runTimeAggregatesByEmpreendimento(
  bq: BigQuery,
  table: string,
  empreendimentoId: string,
) {
  const steps = createTimeByStepRepository(bq, table);
  return buildTimeAggregatesQuery(steps, empreendimentoId).execute();
}
`,
  },
  {
    title: 'AB04-B TeraORM: Ranking por Horas Totais',
    legacyTitles: ['AB04-B TeraORM: Produtos com Baixo Estoque'],
    description: `Trilha TeraORM. ${AB04_ACCEPTANCE_CRITERIA} Requisito de trilha: a implementacao deve usar teraorm.`,
    workerType: WorkerType.NODE_TERAORM,
    maxAttempts: 20,
    templateTitle: 'AB04 ORM - Teste de Ranking por Horas Totais',
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
import { defineModel, tera } from 'teraorm';
import { createBigQueryAdapter } from '@teraorm/bigquery';

${ORM_PRIMER}

function createTimeByStepRepository(bq: BigQuery, table: string) {
  const [projectId, datasetId, tableName] = table.replace(/\`/g, '').split('.');
  const adapter = createBigQueryAdapter({ projectId, datasetId, tableName, bigquery: bq });

  const TimeByOnboardingStep = defineModel('time_by_onboarding_step', {
    idEmpreendimento: '' as string,
    totalHours: 0 as number,
  });

  return tera(TimeByOnboardingStep, adapter);
}

/**
 * Monte um ranking por horas totais com o repositorio TeraORM ja preparado.
 *
 * Regras:
 *   - filtrar totalHours >= minHours
 *   - se ids tiver itens, filtrar idEmpreendimento IN ids
 *   - ordenar por totalHours desc
 *   - limitar pelo parametro limit
 */
export function buildTopHoursRankingQuery(
  steps: any,
  minHours: number,
  ids: string[],
  limit: number,
) {
  // TODO: retorne a query TeraORM composta
  return steps;
}

export async function runTopHoursRanking(
  bq: BigQuery,
  table: string,
  minHours: number,
  ids: string[],
  limit: number,
) {
  const steps = createTimeByStepRepository(bq, table);
  return buildTopHoursRankingQuery(steps, minHours, ids, limit).execute();
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
  },
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
  const candidateTitles = [template.title, ...(template.legacyTitles ?? [])];
  const existing = await dataSource.query(
    `SELECT "id" FROM "template" WHERE "title" = ANY($1) LIMIT 1`,
    [candidateTitles],
  );

  if (existing.length > 0) {
    const id = Number(existing[0].id);
    await dataSource.query(
      `UPDATE "template" SET "title" = $1, "description" = $2, "content" = $3, "workerType" = $4, "dependencies" = $5 WHERE "id" = $6`,
      [
        template.title,
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
  const candidateTitles = [
    assignment.title,
    ...(assignment.legacyTitles ?? []),
  ];

  const existing = await dataSource.query(
    `SELECT "id" FROM "assignment" WHERE "title" = ANY($1) AND "classId" = $2 LIMIT 1`,
    [candidateTitles, classId],
  );

  let assignmentId: number;
  if (existing.length > 0) {
    assignmentId = Number(existing[0].id);

    const setParts = [
      `"title" = $1`,
      `"description" = $2`,
      `"maxAttempts" = $3`,
      `"workerType" = $4`,
    ];
    const params: unknown[] = [
      assignment.title,
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
