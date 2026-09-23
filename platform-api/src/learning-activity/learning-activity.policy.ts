import { BadRequestException } from '@nestjs/common';
import {
  LearningActivityDto,
  QuizAnswerDto,
  QuizQuestionDto,
} from './learning-activity.dto';

function unique(ids: string[]) {
  return new Set(ids).size === ids.length;
}
export function canonicalJson(value: unknown): string {
  const normalize = (item: any): any =>
    Array.isArray(item)
      ? item.map(normalize)
      : item && typeof item === 'object'
        ? Object.fromEntries(
            Object.keys(item)
              .sort()
              .map((key) => [key, normalize(item[key])]),
          )
        : item;
  return JSON.stringify(normalize(value));
}
export function validateActivity(dto: LearningActivityDto) {
  if (!dto.title.trim()) throw new BadRequestException('Informe um título.');
  if (
    dto.startDate &&
    dto.dueDate &&
    new Date(dto.startDate) > new Date(dto.dueDate)
  )
    throw new BadRequestException('O prazo deve ser posterior à abertura.');
  if (dto.kind === 'practice') {
    if (!dto.practice || !dto.practice.tasks?.length || dto.questions?.length)
      throw new BadRequestException('Configure o laboratório.');
    if (!unique(dto.practice.tasks.map((t) => t.id)))
      throw new BadRequestException('Identificadores de tarefas repetidos.');
    for (const task of dto.practice.tasks) {
      if (!task.prompt.trim())
        throw new BadRequestException('Informe o objetivo de cada tarefa.');
      if (dto.practice.lab === 'sql') {
        if (!task.checkSql?.trim() || !task.expectedRows)
          throw new BadRequestException(
            'Configure a consulta de verificação e o resultado esperado.',
          );
        let rows: unknown;
        try {
          rows = JSON.parse(task.expectedRows);
        } catch {
          throw new BadRequestException(
            'O resultado esperado deve ser um array JSON.',
          );
        }
        if (!Array.isArray(rows) || rows.length > 200)
          throw new BadRequestException('Use no máximo 200 linhas esperadas.');
      } else if (
        !task.tool ||
        !task.expectedValue ||
        !/^\d+(\.\d+)?$/.test(task.expectedValue) ||
        !Number.isFinite(Number(task.expectedValue)) ||
        Number(task.expectedValue) > Number.MAX_SAFE_INTEGER
      ) {
        throw new BadRequestException(
          'Configure a ferramenta e o valor decimal esperado.',
        );
      }
    }
  } else {
    if (!dto.questions?.length || dto.practice)
      throw new BadRequestException('Configure as questões.');
    if (!unique(dto.questions.map((q) => q.id)))
      throw new BadRequestException('Identificadores de questões repetidos.');
    for (const q of dto.questions) {
      if (
        !q.prompt.trim() ||
        q.choices.some((c) => !c.text.trim()) ||
        !unique(q.choices.map((c) => c.id)) ||
        !unique(
          q.choices.map((c) =>
            c.text.trim().replace(/\s+/g, ' ').toLocaleLowerCase(),
          ),
        ) ||
        !q.choices.some((c) => c.id === q.correctChoiceId)
      )
        throw new BadRequestException(
          'Revise o enunciado, as alternativas e a resposta correta.',
        );
    }
  }
}
export function publicQuestions(questions: QuizQuestionDto[] | null) {
  return (
    questions?.map(({ id, prompt, choices }) => ({ id, prompt, choices })) ??
    null
  );
}
export function gradeQuiz(
  questions: QuizQuestionDto[],
  answers: QuizAnswerDto[],
) {
  if (
    answers.length !== questions.length ||
    !unique(answers.map((a) => a.questionId))
  )
    throw new BadRequestException('Responda cada questão uma vez.');
  const selected = new Map(answers.map((a) => [a.questionId, a.choiceId]));
  for (const q of questions)
    if (!q.choices.some((c) => c.id === selected.get(q.id)))
      throw new BadRequestException('Alternativa inválida.');
  return (
    questions.filter((q) => selected.get(q.id) === q.correctChoiceId).length /
    questions.length
  );
}
