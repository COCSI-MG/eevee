"use client";

import { Exam } from "@/app/interface/scheduler-api/exam";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/utils/date";

interface ExamInfoCardProps {
  exam: Exam;
}

export default function ExamInfoCard({ exam }: ExamInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações da prova</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Descrição
          </p>
          <p
            className={cn(
              "mt-1",
              !exam.description && "text-muted-foreground",
            )}
          >
            {exam.description ?? "Sem descrição"}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Data de vencimento
          </p>
          <p
            className={cn(
              "mt-1",
              !exam.dueDate && "text-muted-foreground",
            )}
          >
            {formatDateTime(exam.dueDate)}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Data de início
          </p>
          <p
            className={cn(
              "mt-1",
              !exam.startDate && "text-muted-foreground",
            )}
          >
            {formatDateTime(exam.startDate)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
