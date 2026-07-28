"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Exam } from "@/app/interface/scheduler-api/exam";

type ExamView = "activities" | "students";

interface ExamDetailsHeaderProps {
  exam: Exam;
  classId: number;
  currentView: ExamView;
  onChangeView: (view: ExamView) => void;
}

export default function ExamDetailsHeader({
  exam,
  classId,
  currentView,
  onChangeView,
}: ExamDetailsHeaderProps) {
  return (
    <>
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href={`/admin/classes/${classId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para a turma
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{exam.title}</h1>
      </div>

      <div className="flex gap-2">
        <Button
          variant={currentView === "activities" ? "default" : "outline"}
          onClick={() => onChangeView("activities")}
        >
          Atividades
        </Button>
        <Button
          variant={currentView === "students" ? "default" : "outline"}
          onClick={() => onChangeView("students")}
        >
          Alunos
        </Button>
      </div>
    </>
  );
}
