"use client";

import { useParams, useRouter } from "next/navigation";
import Loader from "../loader";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useFetchAssignment } from "@/hooks/use-assignments";
import { Badge } from "../ui/badge";
import { ArrowLeft } from "lucide-react";
import { Button } from "../ui/button";
import { formatDateTime } from "@/utils/date";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import { useAttemptFeedback } from "@/hooks/use-attempt-feedback";
import { AssignmentAttempt } from "@/app/interface/scheduler-api/assignment-attempt";
import { formatScorePercentage } from "@/utils/score";

function AttemptFeedbackDialog({ attempt }: { attempt: AssignmentAttempt }) {
  const { isOpen, handleOpenChange, feedback, isGenerating } =
    useAttemptFeedback(attempt);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="mt-2 w-full text-xs">
          Ver feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Feedback — {attempt.attempt}ª Tentativa</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-96 pr-2">
          {isGenerating ? (
            <p className="text-sm text-muted-foreground animate-pulse">
              Gerando feedback...
            </p>
          ) : (
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {feedback}
            </p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default function AttemptsCard() {
  const { id } = useParams();
  const { back, push } = useRouter();

  const {
    data: assingmentData,
    isError: isAssignmentAttemptsError,
    isLoading: isAssignmentAttemptsLoading,
  } = useFetchAssignment(Number(id));

  if (isAssignmentAttemptsLoading) {
    return <Loader />;
  }

  return (
    <>
      <div className="mb-8">
        <div className="mb-4 flex gap-2">
          <Button variant="outline" onClick={() => back()}>
            <ArrowLeft className="mr-2" />
            Voltar
          </Button>
          <Button
            variant="default"
            onClick={() => push(`/assignment/${id}/interview`)}
          >
            Responder Entrevista
          </Button>
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Resultados do Aluno
        </h1>
        <p className="text-muted-foreground mt-1">
          Aqui você pode ver todas as tentativas para a realização da tarefa.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isAssignmentAttemptsError ? (
          <div className="text-center text-destructive">
            Ocorreu um erro ao carregar as tentativas desta tarefa.
          </div>
        ) : assingmentData === undefined ||
          assingmentData?.assignmentAttempts === undefined ||
          assingmentData?.assignmentAttempts.length === 0 ? (
          <div className="text-center text-muted-foreground">
            Nenhuma tentativa encontrada para esta tarefa.
          </div>
        ) : (
          assingmentData?.assignmentAttempts
            .sort((a, b) => b.attempt - a.attempt)
            .map((attempt) => (
              <Card
                key={attempt.id}
                className={cn(
                  "overflow-hidden hover:shadow-md transition-shadow",
                  {
                    "border border-destructive text-foreground":
                      attempt.status === "failed" || !attempt.isAcceptable,
                  },
                  {
                    "border border-success text-foreground":
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
                        className="bg-warning text-warning-foreground animate-pulse"
                      >
                        Em execução
                      </Badge>
                    ) : attempt.status === "failed" || !attempt.isAcceptable ? (
                      <Badge
                        variant="destructive"
                        className="ml-2 bg-destructive text-destructive-foreground"
                      >
                        Falhou
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="ml-2 bg-success text-success-foreground"
                      >
                        Aceito
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-2">
                    {attempt.createdAt && (
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(attempt.createdAt)}
                      </p>
                    )}
                    <p className="text-sm text-foreground">
                      Resultado:{" "}
                      <span
                        className={cn(
                          "font-semibold",
                          attempt.isAcceptable
                            ? "text-success"
                            : "text-destructive",
                        )}
                      >
                        {formatScorePercentage(attempt.score)}
                      </span>
                    </p>
                    <p className="text-sm text-foreground">
                      Passou: {attempt.passes}
                    </p>
                    <p className="text-sm text-foreground">
                      Falhas: {attempt.fails}
                    </p>
                    {attempt.report && (
                      <AttemptFeedbackDialog attempt={attempt} />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>
    </>
  );
}
