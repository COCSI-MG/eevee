"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  LearningActivities,
  learningError,
} from "@/app/integration/scheduler-api/learning-activity";
import { PracticeSpace } from "@/components/learning/practice-space";
import { QuizSpace } from "@/components/learning/quiz-space";
export default function LearningPage() {
  const { id, activityId } = useParams<{ id: string; activityId: string }>();
  const query = useQuery({
    queryKey: ["learning-activity", activityId],
    queryFn: () => LearningActivities.get(Number(activityId)),
  });
  if (query.isPending) return <p>Carregando atividade…</p>;
  if (query.isError) return <p role="alert">{learningError(query.error)}</p>;
  const activity = query.data;
  if (activity.classId !== Number(id))
    return <p>Atividade não encontrada nesta turma.</p>;
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4">
      <Link href={`/classes/${id}?view=learning`}>← Voltar à turma</Link>
      <header className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {activity.kind === "practice"
            ? "Prática guiada e experimentação livre"
            : "Questionário"}
        </p>
        <h1 className="text-3xl font-bold">{activity.title}</h1>
        <p className="whitespace-pre-wrap">{activity.description}</p>
      </header>
      {activity.kind === "practice" && activity.practice ? (
        <PracticeSpace config={activity.practice} />
      ) : (
        <QuizSpace activity={activity} />
      )}
    </main>
  );
}
