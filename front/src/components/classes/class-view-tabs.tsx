"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { BookOpen, GraduationCap } from "lucide-react";
import ClassesAssignments from "@/components/assignment/classes-assignments";
import ClassesExams from "@/components/exam/classes-exams";
import { Button } from "@/components/ui/button";
import { LearningActivityList } from "@/components/learning/activity-list";

export enum ClassView {
  ASSIGNMENTS = "assignments",
  EXAMS = "exams",
  LEARNING = "learning",
}

const VIEWS: { key: ClassView; label: string; icon: typeof BookOpen }[] = [
  { key: ClassView.ASSIGNMENTS, label: "Tarefas", icon: BookOpen },
  { key: ClassView.EXAMS, label: "Provas", icon: GraduationCap },
  {
    key: ClassView.LEARNING,
    label: "Práticas e questionários",
    icon: BookOpen,
  },
];

export default function ClassViewTabs() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const raw = searchParams.get("view");
  const current: ClassView =
    raw === ClassView.EXAMS || raw === ClassView.LEARNING
      ? raw
      : ClassView.ASSIGNMENTS;

  const setView = (next: ClassView) => {
    const qs = next === ClassView.ASSIGNMENTS ? "" : `?view=${next}`;
    router.replace(`/classes/${id}${qs}`, { scroll: false });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-border/50 pb-4">
        {VIEWS.map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            variant={current === key ? "default" : "outline"}
            onClick={() => setView(key)}
            className="flex items-center gap-2"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>

      {current === ClassView.LEARNING ? (
        <LearningActivityList classId={Number(id)} />
      ) : current === ClassView.ASSIGNMENTS ? (
        <ClassesAssignments />
      ) : (
        <ClassesExams />
      )}
    </div>
  );
}
