"use client";

import { AssignmentService } from "@/app/integration/scheduler-api/assignment";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Loader from "../loader";
import AssignmentsCard from "./assignments-card";
import { Button } from "../ui/button";
import { ArrowLeft } from "lucide-react";

export default function ClassesAssignments() {
  const { id } = useParams();
  const { back } = useRouter();

  const { data, isError, isFetching } = useQuery({
    queryKey: ["assignments", id],
    refetchInterval: 5000,
    initialData: [],
    queryFn: ({ queryKey }) =>
      AssignmentService.GetAssignmentsByClassId(Number(queryKey[1])),
  });

  if (isFetching && data.length === 0) {
    return <Loader />;
  }

  return (
    <>
      <div className="mb-8">
        <Button variant="outline" className="mb-4" onClick={() => back()}>
          <ArrowLeft className="mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Tarefas da Turma
        </h1>
        <p className="text-muted-foreground mt-1">
          Aqui você pode ver todas as tarefas atribuídas a esta turma.
        </p>
      </div>

      {isError ? (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
          Ocorreu um erro ao carregar as tarefas desta turma.
        </div>
      ) : data.length > 0 ? (
        <AssignmentsCard data={data} />
      ) : (
        <p>Nenhuma tarefa encontrada para esta turma.</p>
      )}
    </>
  );
}
