"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { DropdownMenuItem } from "../ui/dropdown-menu";
import TableActions from "../table/table-actions";
import { cn } from "@/lib/utils";
import { Exam } from "@/app/interface/scheduler-api/exam";
import { Pencil, Eye } from "lucide-react";

interface AdminExamsTableProps {
  exams: Array<Exam> | undefined;
  emptyMessage?: string;
  onEdit: (exam: Exam) => void;
  onDelete: (exam: Exam) => void;
}

function formatDueDate(dueDate: string | undefined): string {
  if (!dueDate) return "—";

  return new Date(dueDate).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

const EditExamComponent = ({
  exam,
  onEdit,
}: {
  exam: Exam;
  onEdit: (exam: Exam) => void;
}) => (
  <DropdownMenuItem onClick={() => onEdit(exam)}>
    <Pencil className="h-4 w-4 mr-2" />
    Editar
  </DropdownMenuItem>
);


const SeeMoreExamComponent = ({
  exam,
}: {
  exam: Exam;
}) => {
  const router = useRouter();

  const handleSeeMore = () => {
    router.push(`/admin/classes/${exam.classId}/exams/${exam.id}`);
  };

  return (
    <DropdownMenuItem onClick={handleSeeMore}>
      <Eye className="h-4 w-4 mr-2" />
      Ver detalhes
    </DropdownMenuItem>
  );
};

export default function AdminExamsTable({
  exams,
  emptyMessage = "No exams found.",
  onEdit,
  onDelete,
}: AdminExamsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <div className="flex items-center">Titulo</div>
          </TableHead>
          <TableHead>
            <div className="flex items-center">Descrição</div>
          </TableHead>
          <TableHead>
            <div className="flex items-center">Data de Vencimento</div>
          </TableHead>
          <TableHead>
            <div className="flex items-center">Ações</div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(exams ?? []).length === 0 && (
          <TableRow key={0}>
            <TableCell
              colSpan={4}
              className="text-center text-muted-foreground"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
        {(exams ?? []).map((exam) => {
          return (
            <TableRow key={exam.id}>
              <TableCell className="font-medium">{exam.title}</TableCell>
              <TableCell
                className={cn(!exam.description && "text-muted")}
              >
                {exam.description ?? "Empty"}
              </TableCell>
              <TableCell
                className={cn(!exam.dueDate && "text-muted")}
              >
                {formatDueDate(exam.dueDate)}
              </TableCell>
              <TableCell>
                <TableActions
                  otherActions={[
                    <SeeMoreExamComponent
                      key={`${exam.id}-see-more`}
                      exam={exam}
                    />,

                    <EditExamComponent
                      key={`${exam.id}-edit`}
                      exam={exam}
                      onEdit={onEdit}
                    />,
                  ]}
                  onDelete={() => onDelete(exam)}
                  resourceName="prova"
                  itemName={exam.title}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
