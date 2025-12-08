"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import TableActions from "../table/table-actions";
import { cn } from "@/lib/utils";
import { Class } from "@/app/interface/scheduler-api/class";

interface AdminClassesTableProps {
  classes: Array<Class> | undefined;
  handleDelete: (id: number) => void;
}

export default function AdminClassesTable({
  classes,
  handleDelete,
}: AdminClassesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <div className="flex items-center">Class Name</div>
          </TableHead>
          <TableHead>
            <div className="flex items-center">Description</div>
          </TableHead>
          <TableHead>
            <div className="flex items-center">Actions</div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(classes ?? []).length === 0 && (
          <TableRow key={0}>
            <TableCell colSpan={3} className="text-center">
              No classes found.
            </TableCell>
          </TableRow>
        )}
        {(classes ?? []).map((cls) => {
          return (
            <TableRow key={cls.id}>
              <TableCell className="font-medium">{cls.name}</TableCell>
              <TableCell className={cn(!cls.description && "text-muted")}>
                {cls.description ?? "Empty"}
              </TableCell>
              <TableCell>
                <TableActions
                  href={`/admin/classes/${cls.id}`}
                  onDelete={() => handleDelete(cls.id)}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
