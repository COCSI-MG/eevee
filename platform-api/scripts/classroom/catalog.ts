import type { LearningActivityDto } from '../../src/learning-activity/learning-activity.dto';
import { architecturePractice, sqlPractice } from './practice';
import { quizzes } from './quizzes';

export const classroomCatalog = [
  {
    name: 'Arquitetura de Computadores',
    topic: 'architecture',
    folder: 'arquitetura-computadores',
  },
  { name: 'Banco de Dados II', topic: 'sql', folder: 'banco-dados-ii' },
  { name: 'Ciência de Dados', topic: 'sql', folder: 'ciencia-dados' },
  {
    name: 'Desenvolvimento Mobile',
    topic: 'sql',
    folder: 'aplicativos-moveis',
  },
  { name: 'Jogos Educativos', topic: 'sql', folder: 'games-educativos' },
  {
    name: 'Python — Turma Sexta de Manhã — Curso Técnico',
    topic: 'architecture',
    folder: 'tecnico-industrial',
  },
] as const;

export function activitiesFor(
  topic: 'architecture' | 'sql',
): Omit<LearningActivityDto, 'classId'>[] {
  const label =
    topic === 'architecture'
      ? 'Arquitetura de Computadores'
      : 'SQL — Manipulação de Dados';
  const common = {
    published: false,
    startDate: null,
    dueDate: null,
    maxAttempts: 3,
    feedbackReleased: false,
  };
  return [
    {
      ...common,
      kind: 'practice',
      title: `${label} — Laboratório guiado`,
      description:
        topic === 'sql'
          ? 'Pratique os conteúdos das questões 01–30 da lista: INSERT, UPDATE, DELETE, integridade e transações. Cada tarefa abre uma base PostgreSQL isolada no navegador. Execute, observe e verifique; experimente livremente e use Reiniciar para restaurar os dados. A verificação compara o estado final, sem exigir uma única forma de escrever o SQL. Não comprova a sequência de comandos experimentada. Ao final, responda ao questionário separado.'
          : 'Pratique unidades e sistemas numéricos das questões 07–30. Escolha uma tarefa, experimente a ferramenta, verifique e reinicie quando quiser. Para respostas decimais ou fracionárias, use ponto. A verificação compara o valor numérico, não a quantidade de zeros à esquerda. As questões conceituais 01–06 sobre gerações estão no questionário e devem ser discutidas com o professor. Ao final, responda ao questionário separado.',
      practice: topic === 'sql' ? sqlPractice : architecturePractice,
      questions: null,
    },
    {
      ...common,
      kind: 'quiz',
      title: `${label} — Questionário (30 questões)`,
      description:
        'Responda às 30 questões após explorar o laboratório. Você tem até três envios. A pontuação e as explicações serão exibidas quando o professor liberar o feedback. Esta é uma adaptação revisada da lista fornecida para a turma.',
      practice: null,
      questions: quizzes[topic],
    },
  ];
}
