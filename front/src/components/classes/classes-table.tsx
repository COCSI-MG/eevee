"use client";

import { ClassesService } from "@/app/integration/scheduler-api/classes";
import { Class } from "@/app/interface/scheduler-api/class";
import { ExamService } from "@/app/integration/scheduler-api/exam";
import { LearningActivities } from "@/app/integration/scheduler-api/learning-activity";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthContext } from "@/hooks/use-auth-context";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, ClipboardList, FlaskConical, GraduationCap, Loader } from "lucide-react";
import Link from "next/link";

function ClassActivityLinks({ cls }: { cls: Class }) {
  const { user } = useAuthContext();
  const learning = useQuery({
    queryKey: ["learning-activities", cls.id, user?.userId],
    queryFn: () => LearningActivities.list(cls.id),
    enabled: !cls.activityCounts,
  });
  const exams = useQuery({
    queryKey: ["paginatedExams", cls.id, "home-count", user?.userId],
    queryFn: () => ExamService.listByClass({ classId: cls.id, page: 1, pageSize: 1 }),
    enabled: !cls.activityCounts,
  });
  const pendingCount = (failed: boolean) => failed ? "Indisponível" : "Carregando";
  const rows = [
    { label: "Tarefas", count: cls.assignments?.length, href: `/classes/${cls.id}`, icon: BookOpen, pending: "Indisponível" },
    { label: "Provas", count: cls.activityCounts?.exams ?? exams.data?.meta.total, href: `/classes/${cls.id}?view=exams`, icon: GraduationCap, pending: pendingCount(exams.isError) },
    { label: "Práticas", count: cls.activityCounts?.practices ?? learning.data?.filter(a => a.kind === "practice").length, href: `/classes/${cls.id}?view=learning`, icon: FlaskConical, pending: pendingCount(learning.isError) },
    { label: "Questionários", count: cls.activityCounts?.quizzes ?? learning.data?.filter(a => a.kind === "quiz").length, href: `/classes/${cls.id}?view=learning`, icon: ClipboardList, pending: pendingCount(learning.isError) },
  ];
  return (
    <div className="grid gap-2">
      {rows.map(({ label, count, href, icon: Icon, pending }) => (
        <Link
          key={label}
          href={href}
          aria-label={`${label}: ${count ?? pending} — ${cls.name}`}
          className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="flex-1 font-medium">{label}</span>
          <span className="rounded bg-muted text-foreground px-2 py-0.5 tabular-nums" title={count === undefined ? pending : undefined}>
            {count ?? (pending === "Carregando" ? "…" : "—")}
          </span>
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Link>
      ))}
      {!cls.activityCounts && (learning.isError || exams.isError) && (
        <button type="button" className="text-sm underline text-foreground" onClick={() => { void learning.refetch(); void exams.refetch(); }}>
          Tentar carregar os totais novamente
        </button>
      )}
    </div>
  );
}

export default function ClassesTable() {
  const { user } = useAuthContext();

  const {
    data: classes,
    isSuccess,
    isPending,
  } = useQuery({
    queryKey: ["classes", user?.userId],
    initialData: [],
    queryFn: ({ queryKey }) => {
      return ClassesService.listClassesByUserId(Number(queryKey[1]!));
    },
    enabled: !!user && !!user.userId,
  });

  if (isPending) {
    return <Loader />;
  }

  if (!isSuccess) {
    return (
      <div className="flex items-center justify-center h-full">
        <h2 className="text-xl font-bold">
          Ocorreu um erro carregando as classes
        </h2>
      </div>
    );
  }

  if (isSuccess && classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-xl font-bold">Nenhuma classe encontrada</h2>
        <p className="text-muted-foreground">
          Você não está matriculado em nenhuma classe.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {classes.map((cls) => (
        <Card
          key={cls.id}
          className="flex flex-col overflow-hidden hover:shadow-md transition-shadow"
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl">{cls.name}</CardTitle>
              <GraduationCap className="h-6 w-6" />
            </div>
            <CardDescription className="line-clamp-2">
              {cls.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto pt-4">
            <ClassActivityLinks cls={cls} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
