"use client";
import { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LearningActivity,
  PracticeTask,
  QuizQuestion,
} from "@/app/interface/scheduler-api/learning-activity";
import {
  LearningActivities,
  learningError,
} from "@/app/integration/scheduler-api/learning-activity";
import { architecturePractice, sqlPractice } from "@/lib/practice/presets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PracticeSpace } from "./practice-space";
import { QuizSpace } from "./quiz-space";

const question = (): QuizQuestion => ({
  id: crypto.randomUUID(),
  prompt: "",
  choices: [
    { id: "a", text: "" },
    { id: "b", text: "" },
    { id: "c", text: "" },
    { id: "d", text: "" },
  ],
  correctChoiceId: "a",
  explanation: "",
});
function localDate(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export function ActivityEditor({
  classId,
  activityId,
}: {
  classId: number;
  activityId?: number;
}) {
  const query = useQuery({
    queryKey: ["learning-activity-editor", activityId],
    queryFn: () => LearningActivities.get(activityId!),
    enabled: !!activityId,
  });
  if (activityId && query.isPending) return <p>Carregando…</p>;
  if (query.isError) return <p role="alert">{learningError(query.error)}</p>;
  if (query.data && query.data.classId !== classId)
    return <p>Atividade não encontrada nesta turma.</p>;
  return (
    <Editor
      key={activityId || "new"}
      initial={
        query.data || {
          id: 0,
          classId,
          kind: "practice",
          title: "",
          description: "",
          published: false,
          startDate: null,
          dueDate: null,
          maxAttempts: 1,
          feedbackReleased: false,
          practice: sqlPractice(),
          questions: null,
        }
      }
    />
  );
}
function Editor({ initial }: { initial: LearningActivity }) {
  const formId = useId();
  const [value, setValue] = useState(initial);
  const [preview, setPreview] = useState(false);
  const [notice, setNotice] = useState("");
  const router = useRouter();
  const cache = useQueryClient();
  const save = useMutation({
    mutationFn: () => LearningActivities.save(value),
    onSuccess: (activity) => {
      setNotice("Atividade salva.");
      cache.invalidateQueries({ queryKey: ["classes"] });
      cache.invalidateQueries({
        queryKey: ["learning-activities", value.classId],
      });
      cache.invalidateQueries({
        queryKey: ["learning-activity", String(activity.id)],
      });
      if (!value.id)
        router.replace(
          `/admin/classes/${value.classId}/learning/${activity.id}`,
        );
      else {
        setValue(activity);
        cache.invalidateQueries({
          queryKey: ["learning-attempts", activity.id],
        });
      }
    },
  });
  const patch = (fields: Partial<LearningActivity>) => {
    setValue((v) => ({ ...v, ...fields }));
    setNotice("");
  };
  const taskPatch = (index: number, fields: Partial<PracticeTask>) =>
    patch({
      practice: {
        ...value.practice!,
        tasks: value.practice!.tasks.map((t, i) =>
          i === index ? { ...t, ...fields } : t,
        ),
      },
    });
  const questionPatch = (index: number, fields: Partial<QuizQuestion>) =>
    patch({
      questions: value.questions!.map((q, i) =>
        i === index ? { ...q, ...fields } : q,
      ),
    });
  const saveActions = (
    <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
      <Button
        type="submit"
        form={formId}
        disabled={save.isPending}
        className="w-full sm:w-auto"
      >
        {save.isPending ? "Salvando…" : "Salvar atividade"}
      </Button>
      {save.isError && <p role="alert">{learningError(save.error)}</p>}
      {notice && <p role="status">{notice}</p>}
    </div>
  );
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href={`/admin/classes/${value.classId}`}>← Voltar à turma</Link>
      <h1 className="text-3xl font-bold">
        {value.id ? "Editar atividade" : "Nova prática ou questionário"}
      </h1>
      <form
        id={formId}
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          setPreview(false);
          save.mutate();
        }}
      >
        <section className="grid gap-4 rounded-xl border p-5 sm:grid-cols-2">
          <label>
            Tipo
            <select
              className="mt-2 block w-full rounded border bg-background p-2"
              value={value.kind}
              disabled={!!value.id}
              onChange={(e) =>
                patch(
                  e.target.value === "practice"
                    ? {
                        kind: "practice",
                        practice: sqlPractice(),
                        questions: null,
                      }
                    : { kind: "quiz", practice: null, questions: [question()] },
                )
              }
            >
              <option value="practice">Laboratório de prática</option>
              <option value="quiz">Questionário de múltipla escolha</option>
            </select>
          </label>
          <label>
            Título
            <Input
              required
              maxLength={160}
              value={value.title}
              onChange={(e) => patch({ title: e.target.value })}
            />
          </label>
          <label className="sm:col-span-2">
            Contexto e instruções
            <Textarea
              value={value.description}
              maxLength={10000}
              onChange={(e) => patch({ description: e.target.value })}
            />
          </label>
          <label>
            Abertura
            <Input
              type="datetime-local"
              value={localDate(value.startDate)}
              onChange={(e) =>
                patch({
                  startDate: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : null,
                })
              }
            />
          </label>
          <label>
            Prazo para respostas
            <Input
              type="datetime-local"
              value={localDate(value.dueDate)}
              onChange={(e) =>
                patch({
                  dueDate: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : null,
                })
              }
            />
            <span className="text-xs text-muted-foreground">
              A prática continua disponível para revisão; o prazo encerra envios
              de questionários.
            </span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.published}
              onChange={(e) => patch({ published: e.target.checked })}
            />
            Publicar para os estudantes
          </label>
          {value.kind === "quiz" && (
            <>
              <label>
                Tentativas
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={value.maxAttempts}
                  onChange={(e) =>
                    patch({ maxAttempts: Number(e.target.value) })
                  }
                />
              </label>
              <label className="flex items-center gap-2 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={value.feedbackReleased}
                  onChange={(e) =>
                    patch({ feedbackReleased: e.target.checked })
                  }
                />
                Liberar notas e explicações (encerra novos envios)
              </label>
              <p className="text-sm text-muted-foreground sm:col-span-2">
                Questões ficam bloqueadas para edição após o primeiro envio. Não
                há prévia de correção para estudantes.
              </p>
            </>
          )}
        </section>

        {saveActions}

        {value.kind === "practice" && value.practice && (
          <section className="space-y-4">
            <label>
              Laboratório
              <select
                className="ml-3 rounded border bg-background p-2"
                value={value.practice.lab}
                onChange={(e) => {
                  if (
                    window.confirm(
                      "Trocar o laboratório substitui as tarefas atuais pelo roteiro inicial. Continuar?",
                    )
                  )
                    patch({
                      practice:
                        e.target.value === "sql"
                          ? sqlPractice()
                          : architecturePractice(),
                    });
                }}
              >
                <option value="sql">SQL e manipulação de dados</option>
                <option value="architecture">Bases numéricas e unidades</option>
              </select>
            </label>
            <p className="text-sm text-muted-foreground">
              O roteiro inicial contém exemplos adaptados para experimentar os
              conceitos. Revise os objetivos antes de publicar. A prática livre
              e o botão de reiniciar ficam disponíveis aos estudantes.
            </p>
            {value.practice.lab === "sql" && (
              <label className="block">
                Banco inicial: tabelas e dados
                <Textarea
                  className="min-h-40 font-mono"
                  maxLength={50000}
                  value={value.practice.setupSql}
                  onChange={(e) =>
                    patch({
                      practice: {
                        ...value.practice!,
                        setupSql: e.target.value,
                      },
                    })
                  }
                />
              </label>
            )}
            {value.practice.tasks.map((task, index) => (
              <fieldset
                key={task.id}
                className="space-y-3 rounded-xl border p-5"
              >
                <legend className="px-2 font-semibold">
                  Tarefa {index + 1}
                </legend>
                <label className="block">
                  Objetivo
                  <Textarea
                    required
                    maxLength={4000}
                    value={task.prompt}
                    onChange={(e) =>
                      taskPatch(index, { prompt: e.target.value })
                    }
                  />
                </label>
                <label className="block">
                  {value.practice?.lab === "sql"
                    ? "SQL inicial no editor"
                    : "Valor inicial"}
                  <Textarea
                    maxLength={20000}
                    value={task.starter}
                    onChange={(e) =>
                      taskPatch(index, { starter: e.target.value })
                    }
                  />
                </label>
                {value.practice?.lab === "sql" ? (
                  <>
                    <label className="block">
                      Consulta para verificar o resultado (use ORDER BY para
                      ordem estável)
                      <Textarea
                        required
                        className="font-mono"
                        value={task.checkSql || ""}
                        onChange={(e) =>
                          taskPatch(index, { checkSql: e.target.value })
                        }
                      />
                    </label>
                    <label className="block">
                      Linhas esperadas em JSON
                      <Textarea
                        required
                        className="font-mono"
                        value={task.expectedRows || ""}
                        onChange={(e) =>
                          taskPatch(index, { expectedRows: e.target.value })
                        }
                      />
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Verifique também linhas que devem permanecer intactas.
                      Esses critérios são feedback de prática, não avaliação
                      protegida.
                    </p>
                  </>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label>
                      Ferramenta
                      <select
                        className="block w-full rounded border bg-background p-2"
                        value={task.tool}
                        onChange={(e) =>
                          taskPatch(index, {
                            tool: e.target.value as "base" | "storage",
                          })
                        }
                      >
                        <option value="base">Conversão de bases</option>
                        <option value="storage">Quantidade em bytes</option>
                      </select>
                    </label>
                    {task.tool === "base" && (
                      <label>
                        Base da resposta
                        <select
                          className="block w-full rounded border bg-background p-2"
                          value={task.inputBase || 2}
                          onChange={(e) =>
                            taskPatch(index, {
                              inputBase: Number(e.target.value),
                            })
                          }
                        >
                          {[2, 10, 16].map((b) => (
                            <option key={b}>{b}</option>
                          ))}
                        </select>
                      </label>
                    )}
                    <label>
                      Valor esperado{" "}
                      {task.tool === "storage" ? "(bytes)" : "(decimal)"}
                      <Input
                        required
                        value={task.expectedValue || ""}
                        onChange={(e) =>
                          taskPatch(index, { expectedValue: e.target.value })
                        }
                      />
                    </label>
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  disabled={value.practice!.tasks.length <= 1}
                  onClick={() =>
                    patch({
                      practice: {
                        ...value.practice!,
                        tasks: value.practice!.tasks.filter(
                          (_, i) => i !== index,
                        ),
                      },
                    })
                  }
                >
                  Remover tarefa
                </Button>
              </fieldset>
            ))}
            <Button
              type="button"
              variant="outline"
              disabled={value.practice.tasks.length >= 30}
              onClick={() =>
                patch({
                  practice: {
                    ...value.practice!,
                    tasks: [
                      ...value.practice!.tasks,
                      {
                        id: crypto.randomUUID(),
                        prompt: "",
                        starter: "",
                        ...(value.practice!.lab === "sql"
                          ? { checkSql: "", expectedRows: "[]" }
                          : {
                              tool: "base" as const,
                              inputBase: 2,
                              expectedValue: "0",
                            }),
                      },
                    ],
                  },
                })
              }
            >
              Adicionar tarefa
            </Button>
          </section>
        )}
        {value.kind === "quiz" && (
          <section className="space-y-4">
            {value.questions?.map((q, index) => (
              <fieldset key={q.id} className="space-y-4 rounded-xl border p-5">
                <legend className="px-2 font-semibold">
                  Questão {index + 1}
                </legend>
                <label className="block">
                  Enunciado
                  <Textarea
                    required
                    value={q.prompt}
                    maxLength={4000}
                    onChange={(e) =>
                      questionPatch(index, { prompt: e.target.value })
                    }
                  />
                </label>
                <p className="text-sm">Marque a alternativa correta.</p>
                {q.choices.map((choice, ci) => (
                  <label key={choice.id} className="flex items-center gap-3">
                    <input
                      aria-label={`Alternativa correta ${ci + 1}`}
                      type="radio"
                      name={`correct-${q.id}`}
                      checked={q.correctChoiceId === choice.id}
                      onChange={() =>
                        questionPatch(index, { correctChoiceId: choice.id })
                      }
                    />
                    <Input
                      aria-label={`Texto da alternativa ${ci + 1}`}
                      required
                      maxLength={2000}
                      value={choice.text}
                      onChange={(e) =>
                        questionPatch(index, {
                          choices: q.choices.map((c, i) =>
                            i === ci ? { ...c, text: e.target.value } : c,
                          ),
                        })
                      }
                    />
                  </label>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  disabled={q.choices.length >= 8}
                  onClick={() =>
                    questionPatch(index, {
                      choices: [
                        ...q.choices,
                        { id: crypto.randomUUID(), text: "" },
                      ],
                    })
                  }
                >
                  Adicionar alternativa
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={q.choices.length <= 2}
                  onClick={() => {
                    const choices = q.choices.slice(0, -1);
                    questionPatch(index, {
                      choices,
                      correctChoiceId: choices.some(
                        (c) => c.id === q.correctChoiceId,
                      )
                        ? q.correctChoiceId
                        : choices[0].id,
                    });
                  }}
                >
                  Remover última alternativa
                </Button>
                <label className="block">
                  Explicação após liberação
                  <Textarea
                    value={q.explanation || ""}
                    maxLength={4000}
                    onChange={(e) =>
                      questionPatch(index, { explanation: e.target.value })
                    }
                  />
                </label>
                <Button
                  type="button"
                  variant="outline"
                  disabled={value.questions!.length <= 1}
                  onClick={() =>
                    patch({
                      questions: value.questions!.filter((_, i) => i !== index),
                    })
                  }
                >
                  Remover questão
                </Button>
              </fieldset>
            ))}
            <Button
              type="button"
              variant="outline"
              disabled={(value.questions?.length || 0) >= 100}
              onClick={() =>
                patch({ questions: [...value.questions!, question()] })
              }
            >
              Adicionar questão
            </Button>
          </section>
        )}
        <div className="flex gap-3">
          {value.practice && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreview((p) => !p)}
            >
              {preview ? "Fechar prévia" : "Experimentar prática"}
            </Button>
          )}
        </div>
      </form>
      {preview && value.practice && (
        <section className="space-y-4 border-t pt-6">
          <h2 className="text-xl font-semibold">
            Prévia da prática · alterações ainda não salvas
          </h2>
          <PracticeSpace
            key={JSON.stringify(value.practice)}
            config={value.practice}
          />
        </section>
      )}
      {!!value.id && value.kind === "quiz" && (
        <QuizSpace activity={value} admin />
      )}
      {saveActions}
    </div>
  );
}
