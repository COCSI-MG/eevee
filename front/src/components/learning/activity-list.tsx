"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  LearningActivities,
  learningError,
} from "@/app/integration/scheduler-api/learning-activity";
export function LearningActivityList({
  classId,
  admin = false,
}: {
  classId: number;
  admin?: boolean;
}) {
  const query = useQuery({
    queryKey: ["learning-activities", classId],
    queryFn: () => LearningActivities.list(classId),
  });
  if (query.isPending) return <p>Carregando atividades…</p>;
  if (query.isError)
    return (
      <p role="alert">
        {learningError(query.error)}{" "}
        <button onClick={() => query.refetch()}>Tentar novamente</button>
      </p>
    );
  return (
    <div className="space-y-4">
      {admin && (
        <Link
          className="inline-block rounded-lg bg-primary px-4 py-2 text-primary-foreground"
          href={`/admin/classes/${classId}/learning/new`}
        >
          Criar prática ou questionário
        </Link>
      )}
      {!query.data.length && (
        <p className="rounded-xl border p-8 text-muted-foreground">
          {admin
            ? "Crie um laboratório guiado ou um questionário para esta turma."
            : "O professor ainda não publicou práticas ou questionários."}
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {query.data.map((a) => (
          <article
            key={a.id}
            className="space-y-3 rounded-xl border bg-card p-5"
          >
            <p className="text-sm text-muted-foreground">
              {a.kind === "practice"
                ? "Laboratório · sem nota"
                : "Questionário"}
              {admin && ` · ${a.published ? "Publicado" : "Rascunho"}`}
            </p>
            <h2 className="text-xl font-semibold">{a.title}</h2>
            <p className="line-clamp-3 whitespace-pre-wrap text-sm">
              {a.description}
            </p>
            {a.dueDate && (
              <p className="text-sm">
                Prazo: {new Date(a.dueDate).toLocaleString("pt-BR")}
              </p>
            )}
            <Link
              className="inline-block rounded border px-4 py-2"
              href={
                admin
                  ? `/admin/classes/${classId}/learning/${a.id}`
                  : `/classes/${classId}/learning/${a.id}`
              }
            >
              {admin
                ? "Editar e acompanhar"
                : a.kind === "practice"
                  ? "Abrir prática"
                  : "Responder questionário"}
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
