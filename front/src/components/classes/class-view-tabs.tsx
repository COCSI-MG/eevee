"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { BookOpen, GraduationCap } from "lucide-react";
import ClassesAssignments from "@/components/assignment/classes-assignments";
import ClassesExams from "@/components/exam/classes-exams";
import { Button } from "@/components/ui/button";

type View = "assignments" | "exams";

const VIEWS: { key: View; label: string; icon: typeof BookOpen }[] = [
  { key: "assignments", label: "Tarefas", icon: BookOpen },
  { key: "exams", label: "Provas", icon: GraduationCap },
];

export default function ClassViewTabs() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const raw = searchParams.get("view");
  const current: View = raw === "exams" ? "exams" : "assignments";

  const setView = (next: View) => {
    const qs = next === "assignments" ? "" : `?view=${next}`;
    router.replace(`/classes/${id}${qs}`, { scroll: false });
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 border-b border-slate-700/50 pb-4">
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

      {current === "assignments" ? (
        <ClassesAssignments />
      ) : (
        <ClassesExams />
      )}
    </div>
  );
}
