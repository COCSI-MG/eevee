"use client";

import { useParams, useRouter } from "next/navigation";
import Loader from "../loader";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useFetchAssignment } from "@/hooks/use-assignments";
import { Badge } from "../ui/badge";
import { ArrowLeft } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

export default function AttemptsCard() {
  const { id } = useParams();
  const { back } = useRouter();

  const { data: assignmentAttempts, isFetching: isAssignmentAttemptsFetching } =
    useFetchAssignment(Number(id));

  if (isAssignmentAttemptsFetching) {
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
          Resultados do Aluno
        </h1>
        <p className="text-muted-foreground mt-1">
          Aqui você pode ver todas as tentativas para a realização da tarefa.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {assignmentAttempts?.assignmentAttempts.length === 0 ? (
          <div className="text-center text-gray-500">
            No attempts found for this assignment.
          </div>
        ) : (
          assignmentAttempts?.assignmentAttempts
            .sort((a, b) => b.attempt - a.attempt)
            .map((attempt) => (
              <Card
                key={attempt.id}
                className={cn(
                  "overflow-hidden hover:shadow-md transition-shadow",
                  {
                    "opacity-50": attempt.status !== "running",
                  },
                  {
                    "border border-red-600 text-white":
                      attempt.status === "failed" || !attempt.isAcceptable,
                  },
                  {
                    "border border-green-600 text-white":
                      attempt.status === "running",
                  },
                )}
              >
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center justify-between">
                    {attempt.attempt}&deg; Tentativa
                    {attempt.status === "running" ? (
                      <Badge
                        variant="default"
                        className="bg-yellow-600 text-white animate-pulse"
                      >
                        Em execução
                      </Badge>
                    ) : attempt.status === "failed" || !attempt.isAcceptable ? (
                      <Badge
                        variant="destructive"
                        className="ml-2 bg-red-600 text-white"
                      >
                        Falhou
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="ml-2 bg-green-600 text-white"
                      >
                        Aceito
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-2">
                    <p className="text-sm text-white">
                      Resultado: {attempt.score}
                    </p>
                    <p className="text-sm text-white">
                      Passou: {attempt.passes}
                    </p>
                    <p className="text-sm text-white">
                      Falhas: {attempt.fails}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>
    </>
  );
}
