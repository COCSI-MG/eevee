"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AxiosError } from "axios";
import { useMemo } from "react";
import { useFetchExam } from "@/hooks/use-fetch-exam";
import { formatDateTime } from "@/utils/date";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import QueryErrorState from "@/components/shared/query-error-state";
import { useAuthContext } from "@/hooks/use-auth-context";
import AssignmentsCard from "@/components/assignment/assignments-card";
import { Assignment, WorkerDefinition } from "@/app/interface/scheduler-api/assignment";
import { AssignmentSummary } from "@/app/interface/scheduler-api/exam";
import { AssignmentUserSuspension } from "@/app/interface/scheduler-api/assignment-user-suspension";
import { Class } from "@/app/interface/scheduler-api/class";
import { User } from "@/app/interface/scheduler-api/user";

function summaryToAssignment(
  s: AssignmentSummary,
  currentUserId: number | undefined,
): Assignment {
  return {
    id: s.id,
    classId: s.classId,
    title: s.title,
    description: s.description ?? "",
    maxAttempts: s.maxAttempts,
    workerType: s.workerType,
    assignmentAttempts: s.lastAttempt ? [s.lastAttempt] : [],
    suspensions: s.suspensions.length > 0 && currentUserId
      ? s.suspensions.map(
          (susp): AssignmentUserSuspension => ({
            id: susp.id,
            assignmentId: s.id,
            userId: currentUserId,
            reason: susp.reason ?? undefined,
            createdAt: new Date(susp.createdAt),
            isActive: true,
            user: {} as User,
            assignment: {} as Assignment,
          }),
        )
      : [],
    workerDefinition: { files: null, startCommands: [], testCommands: [], dependencies: [] } as WorkerDefinition,
    class: {} as Class,
    assignmentTemplates: [],
    assignmentParams: [],
  };
}

export default function StudentExamDetail() {
  const { id, idExam } = useParams<{ id: string; idExam: string }>();
  const classId = Number(id);
  const examId = Number(idExam);
  const { user } = useAuthContext();

  const { data, isFetching, isError, error, refetch } = useFetchExam(examId);
  const exam = data?.exam;
  const assignments = data?.assignments ?? [];

  const hydratedAssignments = useMemo<Assignment[]>(
    () => assignments.map((s) => summaryToAssignment(s, user?.userId)),
    [assignments, user?.userId],
  );

  if (isFetching && !data) {
    return <Loader fullScreen={false} />;
  }

  if (
    isError &&
    error instanceof AxiosError &&
    error.response?.status === 404
  ) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href={`/classes/${classId}?view=exams`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para a turma
          </Link>
        </Button>
        <QueryErrorState
          title="Prova não encontrada"
          description="A prova solicitada não existe ou foi removida."
          onRetry={() => {}}
          retryLabel="Voltar para a turma"
        />
      </div>
    );
  }

  if (isError || !exam) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href={`/classes/${classId}?view=exams`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para a turma
          </Link>
        </Button>
        <QueryErrorState
          title="Não foi possível carregar a prova"
          description="Ocorreu um erro ao buscar os dados da prova. Tente novamente."
          onRetry={() => void refetch()}
          retryLabel="Tentar novamente"
          isRetrying={isFetching}
        />
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <Button variant="outline" className="mb-4" asChild>
          <Link href={`/classes/${classId}?view=exams`}>
            <ArrowLeft className="mr-2" />
            Voltar
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          {exam.title}
        </h1>
        <p className="text-muted-foreground mt-1">
          {exam.description ??
            "Esta prova contém as atividades listadas abaixo."}
        </p>
        {exam.dueDate && (
          <p className="text-sm text-slate-500 mt-2">
            <span className="font-medium text-slate-300">Data de entrega:</span>{" "}
            {formatDateTime(exam.dueDate)}
          </p>
        )}
      </div>

      {hydratedAssignments.length > 0 ? (
        <AssignmentsCard data={hydratedAssignments} />
      ) : (
        <p>Nenhuma atividade vinculada a esta prova.</p>
      )}
    </>
  );
}
