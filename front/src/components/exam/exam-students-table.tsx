"use client";

import { ExamStudentGrades } from "@/app/interface/scheduler-api/exam-student-grades";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye } from "lucide-react";

interface ExamStudentsTableProps {
  students: ExamStudentGrades[];
  emptyMessage?: string;
  onViewDetails: (student: ExamStudentGrades) => void;
}

function formatGrade(grade: number, max: number) {
  if (max === 0) return "—";
  return `${grade.toFixed(2)} / ${max.toFixed(2)}`;
}

export default function ExamStudentsTable({
  students,
  emptyMessage = "Nenhum aluno encontrado.",
  onViewDetails,
}: ExamStudentsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Usuário</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Aprovadas</TableHead>
          <TableHead>Tentadas</TableHead>
          <TableHead>Nota da prova</TableHead>
          <TableHead className="w-[80px] text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}

        {students.map((student) => (
          <TableRow key={student.userId} className="hover:bg-background/60">
            <TableCell className="font-medium text-foreground">
              {student.name}
            </TableCell>
            <TableCell className="text-muted-foreground">{student.email}</TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={
                  student.approvedAssignments > 0
                    ? "border-success text-success"
                    : "border-border text-muted-foreground"
                }
              >
                {student.approvedAssignments}/{student.totalAssignments}
              </Badge>
            </TableCell>
            <TableCell className="text-foreground">
              {student.attemptedAssignments}/{student.totalAssignments}
            </TableCell>
            <TableCell className="tabular-nums text-foreground">
              {formatGrade(student.examGrade, student.maxExamGrade)}
            </TableCell>
            <TableCell>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border bg-background text-foreground hover:bg-card"
                  onClick={() => onViewDetails(student)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver mais
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
