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
import { ClipboardList } from "lucide-react";

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
  emptyMessage?: string;
}

export default function AdminClassesTable({
  classes,
  handleDelete,
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
          return (
            <TableRow key={cls.id}>
              <TableCell className="font-medium">{cls.name}</TableCell>
              <TableCell className={cn(!cls.description && "text-muted")}>
                {cls.description ?? "Vazio"}
              </TableCell>
              <TableCell>
                <TableActions
                  href={`/admin/classes/${cls.id}`}
                  onDelete={() => handleDelete(cls.id)}
                  otherActions={[
                    <ViewExamsComponent
                      key={`${cls.id}-exams`}
                      classId={cls.id}
                    />,
                  ]}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
