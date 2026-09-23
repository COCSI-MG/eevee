"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LearningActivity } from "@/app/interface/scheduler-api/learning-activity";
import {
  LearningActivities,
  learningError,
} from "@/app/integration/scheduler-api/learning-activity";
import { Button } from "@/components/ui/button";
export function QuizSpace({
  activity,
  admin = false,
}: {
  activity: LearningActivity;
  admin?: boolean;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const cache = useQueryClient();
  const history = useQuery({
    queryKey: ["learning-attempts", activity.id],
    queryFn: () => LearningActivities.attempts(activity.id),
  });
  const submit = useMutation({
    mutationFn: () =>
      LearningActivities.submit(
        activity.id,
        Object.entries(answers).map(([questionId, choiceId]) => ({
          questionId,
          choiceId,
        })),
      ),
    onSuccess: () =>
      cache.invalidateQueries({ queryKey: ["learning-attempts", activity.id] }),
  });
  const closed =
    activity.feedbackReleased ||
    !!(activity.dueDate && new Date(activity.dueDate) < new Date()) ||
    (history.data?.length ?? 0) >= activity.maxAttempts;
  return (
    <div className="space-y-6">
      <p className="rounded-lg border bg-muted/30 p-4">
        {admin
          ? "Prévia do questionário e respostas da turma."
          : `Até ${activity.maxAttempts} envio(s). A nota e as explicações aparecem quando o professor liberar o resultado.`}
      </p>
      {activity.questions?.map((q, index) => (
        <fieldset
          key={q.id}
          disabled={admin || closed || submit.isPending}
          className="space-y-3 rounded-xl border p-5"
        >
          <legend className="px-2 font-semibold">Questão {index + 1}</legend>
          <p className="whitespace-pre-wrap">{q.prompt}</p>
          {q.choices.map((choice) => (
            <label
              key={choice.id}
              className="flex cursor-pointer items-start gap-3 rounded-lg border p-3"
            >
              <input
                type="radio"
                name={q.id}
                value={choice.id}
                checked={answers[q.id] === choice.id}
                onChange={() =>
                  setAnswers((a) => ({ ...a, [q.id]: choice.id }))
                }
                className="mt-1"
              />
              <span>{choice.text}</span>
            </label>
          ))}
        </fieldset>
      ))}
      {!admin && (
        <Button
          disabled={
            closed ||
            history.isPending ||
            history.isError ||
            submit.isPending ||
            Object.keys(answers).length !== activity.questions?.length
          }
          onClick={() => {
            if (
              window.confirm("Enviar suas respostas e registrar uma tentativa?")
            )
              submit.mutate();
          }}
        >
          {submit.isPending ? "Enviando…" : "Enviar respostas"}
        </Button>
      )}
      {submit.isSuccess && (
        <p role="status">
          Respostas registradas. O professor liberará o resultado.
        </p>
      )}
      {submit.isError && <p role="alert">{learningError(submit.error)}</p>}
      {closed && !admin && <p>Novos envios encerrados.</p>}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">
          {admin ? "Respostas da turma" : "Seus envios"}
        </h2>
        {history.isError && (
          <p role="alert">
            Não foi possível carregar os envios.{" "}
            <button onClick={() => history.refetch()}>Tentar novamente</button>
          </p>
        )}
        {history.data?.map((a) => (
          <div key={a.id} className="rounded-lg border p-4">
            <p>
              {admin && `${a.name || `Estudante ${a.userId}`} · `}Envio{" "}
              {a.attempt} · {new Date(a.createdAt).toLocaleString("pt-BR")} ·{" "}
              {a.score === null
                ? "Resultado aguardando liberação"
                : `${Math.round(a.score * 100)}%`}
            </p>
            {a.feedback?.map((f) => {
              const q = activity.questions?.find((q) => q.id === f.questionId);
              return (
                <div key={f.questionId} className="mt-3 border-t pt-2 text-sm">
                  <p>{q?.prompt}</p>
                  <p>
                    Sua resposta:{" "}
                    {
                      q?.choices.find(
                        (c) =>
                          c.id ===
                          a.answers.find((a) => a.questionId === f.questionId)
                            ?.choiceId,
                      )?.text
                    }
                  </p>
                  <p>
                    Resposta correta:{" "}
                    {q?.choices.find((c) => c.id === f.correctChoiceId)?.text}
                  </p>
                  <p>{f.explanation}</p>
                </div>
              );
            })}
          </div>
        ))}
      </section>
    </div>
  );
}
