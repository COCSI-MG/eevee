import * as dotenv from 'dotenv';
import { join } from 'path';
import { DataSource, QueryRunner } from 'typeorm';
import { WorkerType } from '../src/worker/enum/worker-type.enum';

dotenv.config({ path: join(__dirname, '../.env') });

export type PythonExample = {
  code: string;
  title: string;
  description: string;
  maxAttempts: number;
  boilerplateContent: string;
  templateTitle: string;
  templateDescription: string;
  testContent: string;
};

const DEFAULT_CLASS_NAME = 'Introdução à Programação com Python';
const DEFAULT_CLASS_DESCRIPTION =
  'Módulo introdutório com exercícios executados online pelo worker Python + pytest do EEVEE.';

export const PYTHON_EXAMPLES: PythonExample[] = [
  {
    code: 'PY01',
    title: 'PY01 - Saudação personalizada',
    description: `Implemente a função saudacao(nome).

Regras:
- receba uma string com o nome de uma pessoa;
- retorne exatamente a mensagem "Olá, <nome>!";
- preserve os caracteres e espaços internos do nome.

Exemplo: saudacao("Ana") deve retornar "Olá, Ana!".

Não remova a função main(nome): ela é o ponto de entrada exigido pelo EEVEE e deve delegar para saudacao(nome).`,
    maxAttempts: 5,
    boilerplateContent: `def saudacao(nome):
    """Retorne uma saudação no formato: Olá, <nome>!"""
    pass


def main(nome):
    """Ponto de entrada usado pelo EEVEE."""
    return saudacao(nome)
`,
    templateTitle: 'PY01 - Testes de saudação personalizada',
    templateDescription:
      'Valida retorno, acentuação e nomes compostos na função saudacao.',
    testContent: `from app import main, saudacao


def test_nome_simples():
    assert saudacao("Ana") == "Olá, Ana!"


def test_nome_composto():
    assert saudacao("João da Silva") == "Olá, João da Silva!"


def test_retorno_eh_string():
    resultado = saudacao("CEFET")
    assert isinstance(resultado, str)
    assert resultado == "Olá, CEFET!"


def test_main_delega_para_saudacao():
    assert main("Ada") == saudacao("Ada") == "Olá, Ada!"
`,
  },
  {
    code: 'PY02',
    title: 'PY02 - Classificação de nota',
    description: `Implemente a função classificar_nota(nota).

Regras:
- notas de 7 a 10: "aprovado";
- notas de 5 até abaixo de 7: "recuperação";
- notas de 0 até abaixo de 5: "reprovado";
- valores fora do intervalo de 0 a 10 devem gerar ValueError.

Não remova a função main(nota): ela é o ponto de entrada exigido pelo EEVEE e deve delegar para classificar_nota(nota).`,
    maxAttempts: 5,
    boilerplateContent: `def classificar_nota(nota):
    """Classifique uma nota entre 0 e 10."""
    pass


def main(nota):
    """Ponto de entrada usado pelo EEVEE."""
    return classificar_nota(nota)
`,
    templateTitle: 'PY02 - Testes de classificação de nota',
    templateDescription:
      'Valida condicionais, valores de fronteira e tratamento de notas inválidas.',
    testContent: `import pytest

from app import classificar_nota, main


@pytest.mark.parametrize(
    ("nota", "esperado"),
    [
        (10, "aprovado"),
        (7, "aprovado"),
        (6.9, "recuperação"),
        (5, "recuperação"),
        (4.9, "reprovado"),
        (0, "reprovado"),
    ],
)
def test_classificacoes(nota, esperado):
    assert classificar_nota(nota) == esperado


@pytest.mark.parametrize("nota", [-0.1, 10.1, -20, 11])
def test_notas_fora_do_intervalo(nota):
    with pytest.raises(ValueError):
        classificar_nota(nota)


def test_main_delega_para_classificacao():
    assert main(7) == classificar_nota(7) == "aprovado"
`,
  },
  {
    code: 'PY03',
    title: 'PY03 - Soma dos números pares',
    description: `Implemente a função somar_pares(numeros).

A função deve receber uma lista de números inteiros e retornar a soma apenas dos elementos pares. Considere números negativos e retorne 0 quando a lista estiver vazia ou não possuir pares.

Não remova a função main(numeros): ela é o ponto de entrada exigido pelo EEVEE e deve delegar para somar_pares(numeros).`,
    maxAttempts: 5,
    boilerplateContent: `def somar_pares(numeros):
    """Some somente os números pares da lista recebida."""
    pass


def main(numeros):
    """Ponto de entrada usado pelo EEVEE."""
    return somar_pares(numeros)
`,
    templateTitle: 'PY03 - Testes de soma dos números pares',
    templateDescription:
      'Valida repetição, operador módulo, lista vazia e números negativos.',
    testContent: `from app import main, somar_pares


def test_lista_mista():
    assert somar_pares([1, 2, 3, 4, 5, 6]) == 12


def test_pares_negativos_e_zero():
    assert somar_pares([-4, -3, -2, 0, 7]) == -6


def test_sem_pares():
    assert somar_pares([1, 3, 5]) == 0


def test_lista_vazia():
    assert somar_pares([]) == 0


def test_main_delega_para_soma():
    assert main([2, 3, 4]) == somar_pares([2, 3, 4]) == 6
`,
  },
  {
    code: 'PY04',
    title: 'PY04 - Estatísticas de uma lista',
    description: `Implemente a função estatisticas(numeros).

Para uma lista não vazia, retorne um dicionário com as chaves "minimo", "maximo" e "media". A média deve ser numérica. Para uma lista vazia, gere ValueError.

Não remova a função main(numeros): ela é o ponto de entrada exigido pelo EEVEE e deve delegar para estatisticas(numeros).`,
    maxAttempts: 5,
    boilerplateContent: `def estatisticas(numeros):
    """Retorne mínimo, máximo e média em um dicionário."""
    pass


def main(numeros):
    """Ponto de entrada usado pelo EEVEE."""
    return estatisticas(numeros)
`,
    templateTitle: 'PY04 - Testes de estatísticas de uma lista',
    templateDescription:
      'Valida funções, agregações, dicionários, números negativos e lista vazia.',
    testContent: `import pytest

from app import estatisticas, main


def test_estatisticas_basicas():
    assert estatisticas([2, 4, 6, 8]) == {
        "minimo": 2,
        "maximo": 8,
        "media": 5,
    }


def test_estatisticas_com_negativos():
    resultado = estatisticas([-5, 0, 10])
    assert resultado["minimo"] == -5
    assert resultado["maximo"] == 10
    assert resultado["media"] == pytest.approx(5 / 3)


def test_lista_vazia():
    with pytest.raises(ValueError):
        estatisticas([])


def test_main_delega_para_estatisticas():
    numeros = [1, 2, 3]
    assert main(numeros) == estatisticas(numeros)
`,
  },
  {
    code: 'PY05',
    title: 'PY05 - Frequência de palavras',
    description: `Implemente a função frequencia_palavras(texto).

Converta o texto para minúsculas, considere como palavra cada sequência alfanumérica e retorne um dicionário com a contagem de ocorrências. Pontuação não deve fazer parte das palavras.

Não remova a função main(texto): ela é o ponto de entrada exigido pelo EEVEE e deve delegar para frequencia_palavras(texto).`,
    maxAttempts: 5,
    boilerplateContent: `def frequencia_palavras(texto):
    """Conte palavras sem diferenciar letras maiúsculas e minúsculas."""
    pass


def main(texto):
    """Ponto de entrada usado pelo EEVEE."""
    return frequencia_palavras(texto)
`,
    templateTitle: 'PY05 - Testes de frequência de palavras',
    templateDescription:
      'Valida strings, normalização, pontuação e construção de dicionários.',
    testContent: `from app import frequencia_palavras, main


def test_repeticoes_e_maiusculas():
    assert frequencia_palavras("Python é ótimo. PYTHON é simples!") == {
        "python": 2,
        "é": 2,
        "ótimo": 1,
        "simples": 1,
    }


def test_pontuacao_nao_faz_parte_da_palavra():
    assert frequencia_palavras("um, dois; um... três?") == {
        "um": 2,
        "dois": 1,
        "três": 1,
    }


def test_texto_vazio():
    assert frequencia_palavras("") == {}


def test_main_delega_para_frequencia():
    texto = "Python python"
    assert main(texto) == frequencia_palavras(texto) == {"python": 2}
`,
  },
  {
    code: 'PY06',
    title: 'PY06 - Resumo de arquivo de texto',
    description: `Implemente a função resumir_arquivo(caminho).

Leia um arquivo UTF-8 e retorne um dicionário com:
- "linhas": quantidade total de linhas;
- "linhas_nao_vazias": linhas que possuem conteúdo após remover espaços;
- "palavras": total de palavras separadas por espaços.

Use with para abrir o arquivo.

Não remova a função main(caminho): ela é o ponto de entrada exigido pelo EEVEE e deve delegar para resumir_arquivo(caminho).`,
    maxAttempts: 5,
    boilerplateContent: `def resumir_arquivo(caminho):
    """Leia um arquivo UTF-8 e retorne um resumo do conteúdo."""
    pass


def main(caminho):
    """Ponto de entrada usado pelo EEVEE."""
    return resumir_arquivo(caminho)
`,
    templateTitle: 'PY06 - Testes de resumo de arquivo de texto',
    templateDescription:
      'Valida leitura de arquivos, gerenciador de contexto, linhas vazias e UTF-8.',
    testContent: `from app import main, resumir_arquivo


def test_arquivo_com_linha_vazia(tmp_path):
    arquivo = tmp_path / "entrada.txt"
    arquivo.write_text("Python no CEFET\\n\\nExercício online\\n", encoding="utf-8")

    assert resumir_arquivo(arquivo) == {
        "linhas": 3,
        "linhas_nao_vazias": 2,
        "palavras": 5,
    }


def test_arquivo_sem_quebra_final(tmp_path):
    arquivo = tmp_path / "dados.txt"
    arquivo.write_text("um dois\\ntrês", encoding="utf-8")

    assert resumir_arquivo(str(arquivo)) == {
        "linhas": 2,
        "linhas_nao_vazias": 2,
        "palavras": 3,
    }


def test_arquivo_vazio(tmp_path):
    arquivo = tmp_path / "vazio.txt"
    arquivo.write_text("", encoding="utf-8")

    assert resumir_arquivo(arquivo) == {
        "linhas": 0,
        "linhas_nao_vazias": 0,
        "palavras": 0,
    }


def test_main_delega_para_resumo(tmp_path):
    arquivo = tmp_path / "main.txt"
    arquivo.write_text("Python online", encoding="utf-8")

    assert main(arquivo) == resumir_arquivo(arquivo) == {
        "linhas": 1,
        "linhas_nao_vazias": 1,
        "palavras": 2,
    }
`,
  },
];

function parseBoolean(value: string | undefined): boolean {
  return ['1', 'true', 'yes', 'sim'].includes((value ?? '').toLowerCase());
}

function parseEmails(value: string | undefined): string[] {
  return [
    ...new Set(
      (value ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

async function hasColumn(
  queryRunner: QueryRunner,
  tableName: string,
  columnName: string,
): Promise<boolean> {
  const rows = await queryRunner.query(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = $1
         AND column_name = $2
     ) AS "exists"`,
    [tableName, columnName],
  );

  return Boolean(rows?.[0]?.exists);
}

async function assertPythonWorkerSchema(
  queryRunner: QueryRunner,
): Promise<void> {
  const requiredColumns: Array<[string, string]> = [
    ['class', 'name'],
    ['template', 'title'],
    ['template', 'content'],
    ['template', 'workerType'],
    ['template', 'dependencies'],
    ['assignment', 'classId'],
    ['assignment', 'title'],
    ['assignment', 'workerType'],
    ['assignment', 'boilerplateContent'],
    ['assignment_template', 'assignmentId'],
    ['assignment_template', 'templateId'],
    ['user_class', 'userId'],
    ['user_class', 'classId'],
  ];

  const missing: string[] = [];
  for (const [tableName, columnName] of requiredColumns) {
    if (!(await hasColumn(queryRunner, tableName, columnName))) {
      missing.push(`${tableName}.${columnName}`);
    }
  }

  if (missing.length) {
    throw new Error(
      `Database schema is not ready for the Python examples. Missing: ${missing.join(', ')}`,
    );
  }

  const enumRows = await queryRunner.query(
    `SELECT t.typname AS "typeName", e.enumlabel AS "value"
     FROM pg_type t
     JOIN pg_enum e ON e.enumtypid = t.oid
     WHERE t.typname IN ('assignment_workertype_enum', 'template_workertype_enum')
       AND e.enumlabel = $1`,
    [WorkerType.PYTHON_DEFAULT],
  );

  const enumTypes = new Set(
    enumRows.map((row: { typeName: string }) => row.typeName),
  );
  if (
    !enumTypes.has('assignment_workertype_enum') ||
    !enumTypes.has('template_workertype_enum')
  ) {
    throw new Error(
      'python_default is missing from the assignment/template worker enums. Apply the Python worker migration before running this seed.',
    );
  }
}

async function findTeacher(
  queryRunner: QueryRunner,
  teacherEmail: string,
): Promise<number> {
  const rows = await queryRunner.query(
    `SELECT "id", "email", "isAdmin" FROM "user" WHERE "email" = $1 LIMIT 1`,
    [teacherEmail],
  );

  if (!rows.length) {
    throw new Error(
      `Teacher not found: ${teacherEmail}. Set PYTHON_SEED_TEACHER_EMAIL to an existing administrator account.`,
    );
  }

  if (!rows[0].isAdmin) {
    throw new Error(
      `The seed teacher must be an administrator: ${teacherEmail}`,
    );
  }

  return Number(rows[0].id);
}

async function findStudents(
  queryRunner: QueryRunner,
  studentEmails: string[],
): Promise<number[]> {
  if (!studentEmails.length) return [];

  const rows = await queryRunner.query(
    `SELECT "id", "email", "isAdmin" FROM "user" WHERE "email" = ANY($1)`,
    [studentEmails],
  );
  type UserRow = { id: number; email: string; isAdmin: boolean };
  const found = new Map<string, UserRow>(
    rows.map((row: UserRow) => [row.email, row] as [string, UserRow]),
  );
  const missing = studentEmails.filter((email) => !found.has(email));

  if (missing.length) {
    throw new Error(`Student account(s) not found: ${missing.join(', ')}`);
  }

  return studentEmails.map((email) => Number(found.get(email)!.id));
}

async function ensureClass(
  queryRunner: QueryRunner,
  className: string,
  classDescription: string,
): Promise<number> {
  const existing = await queryRunner.query(
    `SELECT "id" FROM "class" WHERE "name" = $1 ORDER BY "id"`,
    [className],
  );

  if (existing.length > 1) {
    throw new Error(`More than one class uses the seed name: ${className}`);
  }

  const hasDescription = await hasColumn(queryRunner, 'class', 'description');
  if (existing.length === 1) {
    const classId = Number(existing[0].id);
    if (hasDescription) {
      await queryRunner.query(
        `UPDATE "class" SET "description" = $1 WHERE "id" = $2`,
        [classDescription, classId],
      );
    }
    return classId;
  }

  const inserted = hasDescription
    ? await queryRunner.query(
        `INSERT INTO "class" ("name", "description") VALUES ($1, $2) RETURNING "id"`,
        [className, classDescription],
      )
    : await queryRunner.query(
        `INSERT INTO "class" ("name") VALUES ($1) RETURNING "id"`,
        [className],
      );

  return Number(inserted[0].id);
}

async function enrollUsers(
  queryRunner: QueryRunner,
  classId: number,
  userIds: number[],
): Promise<void> {
  for (const userId of userIds) {
    await queryRunner.query(
      `INSERT INTO "user_class" ("userId", "classId")
       VALUES ($1, $2)
       ON CONFLICT ("userId", "classId") DO NOTHING`,
      [userId, classId],
    );
  }
}

async function ensureTemplate(
  queryRunner: QueryRunner,
  example: PythonExample,
): Promise<number> {
  const existing = await queryRunner.query(
    `SELECT "id" FROM "template" WHERE "title" = $1 ORDER BY "id"`,
    [example.templateTitle],
  );

  if (existing.length > 1) {
    throw new Error(
      `More than one template uses the seed title: ${example.templateTitle}`,
    );
  }

  if (existing.length === 1) {
    const templateId = Number(existing[0].id);
    await queryRunner.query(
      `UPDATE "template"
       SET "description" = $1,
           "filePath" = $2,
           "content" = $3,
           "workerType" = $4,
           "dependencies" = $5
       WHERE "id" = $6`,
      [
        example.templateDescription,
        '',
        example.testContent,
        WorkerType.PYTHON_DEFAULT,
        [],
        templateId,
      ],
    );
    return templateId;
  }

  const inserted = await queryRunner.query(
    `INSERT INTO "template"
       ("title", "description", "filePath", "content", "workerType", "dependencies")
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING "id"`,
    [
      example.templateTitle,
      example.templateDescription,
      '',
      example.testContent,
      WorkerType.PYTHON_DEFAULT,
      [],
    ],
  );

  return Number(inserted[0].id);
}

async function ensureAssignment(options: {
  queryRunner: QueryRunner;
  example: PythonExample;
  classId: number;
  teacherId: number;
  templateId: number;
}): Promise<number> {
  const { queryRunner, example, classId, teacherId, templateId } = options;
  const existing = await queryRunner.query(
    `SELECT "id" FROM "assignment"
     WHERE "classId" = $1 AND "title" = $2
     ORDER BY "id"`,
    [classId, example.title],
  );

  if (existing.length > 1) {
    throw new Error(
      `More than one assignment uses the seed title: ${example.title}`,
    );
  }

  const hasCreatedById = await hasColumn(
    queryRunner,
    'assignment',
    'createdById',
  );
  let assignmentId: number;

  if (existing.length === 1) {
    assignmentId = Number(existing[0].id);
    const setParts = [
      `"description" = $1`,
      `"maxAttempts" = $2`,
      `"workerType" = $3`,
      `"boilerplateContent" = $4`,
    ];
    const params: unknown[] = [
      example.description,
      example.maxAttempts,
      WorkerType.PYTHON_DEFAULT,
      example.boilerplateContent,
    ];

    if (hasCreatedById) {
      setParts.push(`"createdById" = $5`);
      params.push(teacherId);
    }

    params.push(assignmentId);
    await queryRunner.query(
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
      '"boilerplateContent"',
    ];
    const values: unknown[] = [
      classId,
      example.title,
      example.description,
      example.maxAttempts,
      WorkerType.PYTHON_DEFAULT,
      example.boilerplateContent,
    ];

    if (hasCreatedById) {
      columns.push('"createdById"');
      values.push(teacherId);
    }

    const placeholders = values
      .map((_value, index) => `$${index + 1}`)
      .join(', ');
    const inserted = await queryRunner.query(
      `INSERT INTO "assignment" (${columns.join(', ')})
       VALUES (${placeholders})
       RETURNING "id"`,
      values,
    );
    assignmentId = Number(inserted[0].id);
  }

  await queryRunner.query(
    `DELETE FROM "assignment_template" WHERE "assignmentId" = $1`,
    [assignmentId],
  );
  await queryRunner.query(
    `INSERT INTO "assignment_template" ("assignmentId", "templateId") VALUES ($1, $2)`,
    [assignmentId, templateId],
  );

  if (await hasColumn(queryRunner, 'assignment_param', 'assignmentId')) {
    await queryRunner.query(
      `DELETE FROM "assignment_param" WHERE "assignmentId" = $1`,
      [assignmentId],
    );
  }

  return assignmentId;
}

async function run(): Promise<void> {
  const teacherEmail =
    process.env.PYTHON_SEED_TEACHER_EMAIL?.trim() || 'admin@example.com';
  const studentEmails = parseEmails(process.env.PYTHON_SEED_STUDENT_EMAILS);
  const className =
    process.env.PYTHON_SEED_CLASS_NAME?.trim() || DEFAULT_CLASS_NAME;
  const classDescription =
    process.env.PYTHON_SEED_CLASS_DESCRIPTION?.trim() ||
    DEFAULT_CLASS_DESCRIPTION;
  const dryRun =
    process.argv.includes('--dry-run') ||
    parseBoolean(process.env.PYTHON_SEED_DRY_RUN);

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
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    await assertPythonWorkerSchema(queryRunner);
    const teacherId = await findTeacher(queryRunner, teacherEmail);
    const studentIds = await findStudents(queryRunner, studentEmails);

    if (dryRun) {
      console.log('Python examples seed validation succeeded (dry run).');
      console.log(`Teacher: ${teacherEmail} (id=${teacherId})`);
      console.log(`Class: ${className}`);
      console.log(`Students to enroll: ${studentIds.length}`);
      console.log(`Assignments/templates to upsert: ${PYTHON_EXAMPLES.length}`);
      return;
    }

    await queryRunner.startTransaction();
    try {
      const classId = await ensureClass(
        queryRunner,
        className,
        classDescription,
      );
      await enrollUsers(queryRunner, classId, [teacherId, ...studentIds]);

      for (const example of PYTHON_EXAMPLES) {
        const templateId = await ensureTemplate(queryRunner, example);
        await ensureAssignment({
          queryRunner,
          example,
          classId,
          teacherId,
          templateId,
        });
      }

      await queryRunner.commitTransaction();
      console.log('Python example module seeded successfully.');
      console.log(`Class: ${className} (id=${classId})`);
      console.log(`Teacher: ${teacherEmail}`);
      console.log(`Students enrolled: ${studentIds.length}`);
      console.log(`Assignments/templates upserted: ${PYTHON_EXAMPLES.length}`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

if (require.main === module) {
  run().catch((error) => {
    console.error('Python examples seed failed:', error);
    process.exit(1);
  });
}
