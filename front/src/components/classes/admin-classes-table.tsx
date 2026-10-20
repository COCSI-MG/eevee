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
import { ClipboardList, Info, RotateCcw } from "lucide-react";

interface AdminClassesTableProps {
  classes: Class[];
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
          <TableHead>Nome da Turma</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {classes.length === 0 && (
          <TableRow key={0}>
            <TableCell colSpan={3} className="text-center text-muted-foreground">
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
        {classes.map((cls) => {

          const isArchived = Boolean(cls.deletedAt);
          const classPath = `/${Route.AdminClasses}/${cls.id}`;

          const otherActions = isArchived
            ?
              [
                <DropdownMenuItem
                  key="restore"
                  onSelect={() => handleRestore(cls.id)}
                >
                  <RotateCcw className="h-4 w-4" />
                  Restaurar turma
                </DropdownMenuItem>,
              ]
            :
              [
                <DropdownMenuItem key="details" asChild>
                  <Link href={`${classPath}/${Route.AdminClassInfos}`}>
                    <Info className="h-4 w-4" />
                    Ver detalhes
                  </Link>
                </DropdownMenuItem>,

                <DropdownMenuItem key="exams" asChild>
                  <Link href={`${classPath}/${Route.AdminClassExams}`}>
                    <ClipboardList className="h-4 w-4" />
                    Provas
                  </Link>
                </DropdownMenuItem>,
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
