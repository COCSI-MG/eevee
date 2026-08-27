"use client";

import { GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Exam } from "@/app/interface/scheduler-api/exam";
import { formatDateTime } from "@/utils/date";

interface ExamCardProps {
  exam: Exam;
  classId: number;
}

export default function ExamCard({ exam, classId }: ExamCardProps) {
  const { push } = useRouter();
  const dueDate = formatDateTime(exam.dueDate);

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between space-x-2 text-foreground">
          {exam.title}
          <GraduationCap className="h-5 w-5 text-muted-foreground" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          {exam.description && (
            <CardDescription className="text-muted-foreground line-clamp-2">
              {exam.description}
            </CardDescription>
          )}

          {dueDate && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                Data de entrega:
              </span>{" "}
              {dueDate}
            </p>
          )}

          <Button
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => push(`/classes/${classId}/exam/${exam.id}`)}
          >
            <GraduationCap className="h-4 w-4 mr-2" />
            Iniciar Prova
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
