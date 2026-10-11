"use client";

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
import { Class } from "@/app/interface/scheduler-api/class";
import { Route } from "@/app/routes";
import Link from "next/link";
import { ClipboardList, RotateCcw } from "lucide-react";

const ViewExamsComponent = ({ classId }: { classId: number }) => (
  <Link
    href={`/${Route.AdminClasses}/${classId}/${Route.AdminClassExams}`}
  >
    <DropdownMenuItem>
      <ClipboardList className="h-4 w-4" />
      provas
    </DropdownMenuItem>
  </Link>
);

interface AdminClassesTableProps {
  classes: Array<Class> | undefined;
  handleDelete: (id: number) => void;
  handleRestore: (id: number) => void;
  emptyMessage?: string;
}

export default function AdminClassesTable({
  classes,
  handleDelete,
  handleRestore,
  emptyMessage = "Nenhuma turma encontrada.",
}: AdminClassesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <div className="flex items-center">Nome da Turma</div>
          </TableHead>
          <TableHead>
            <div className="flex items-center">Descrição</div>
          </TableHead>
          <TableHead>
            <div className="flex items-center">Ações</div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(classes ?? []).length === 0 && (
          <TableRow key={0}>
            <TableCell colSpan={3} className="text-center text-muted-foreground">
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
        {(classes ?? []).map((cls) => {

          const otherActions = cls.deletedAt
            ?
              [
                <DropdownMenuItem
                  key={`${cls.id}-restore`}
                  onClick={() => handleRestore(cls.id)}
                >
                  <RotateCcw className="h-4 w-4" />
                  Restaurar turma
                </DropdownMenuItem>,
              ]
            :
              [
                <ViewExamsComponent
                  key={`${cls.id}-exams`}
                  classId={cls.id}
                />,
              ];

          return (
            <TableRow key={cls.id}>
              <TableCell className="font-medium">{cls.name}</TableCell>
              <TableCell className={cn(!cls.description && "text-muted")}>
                {cls.description ?? "Vazio"}
              </TableCell>
              <TableCell>
                <TableActions
                  href={cls.deletedAt ? undefined : `/admin/classes/${cls.id}`}
                  onDelete={cls.deletedAt ? undefined : () => handleDelete(cls.id)}
                  deleteTitle="Arquivar turma"
                  deleteDescription="O histórico será preservado e a turma poderá ser restaurada por um administrador."
                  deleteActionLabel="Arquivar turma"
                  deleteMenuLabel="Arquivar"

                  otherActions={otherActions}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
