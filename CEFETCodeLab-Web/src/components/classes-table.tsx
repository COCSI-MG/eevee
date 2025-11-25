"use client";

import { useClasses } from "@/hooks/use-classes";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import TableActions from "./table/table-actions";
import { cn } from "@/lib/utils";
import { ClassesService } from "@/app/integration/scheduler-api/classes";

export default function ClassesTable() {
  const { data, isPending, isSuccess, refetch } = useClasses();

  if (isPending) {
    return <div>Loading...</div>;
  }

  const handleDelete = async (id: number) => {
    await ClassesService.delete(id);
    refetch();
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="cursor-pointer">
            <div className="flex items-center">Class Name</div>
          </TableHead>
          <TableHead className="cursor-pointer">
            <div className="flex items-center">Description</div>
          </TableHead>
          <TableHead className="w-[100px]">
            <div className="flex items-center">Actions</div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isSuccess && (data ?? []).length === 0 && (
          <TableRow>
            <TableCell colSpan={2} className="text-center">
              No classes found.
            </TableCell>
          </TableRow>
        )}
        {isSuccess &&
          (data ?? []).map((cls) => {
            return (
              <TableRow key={cls.id}>
                <TableCell className="font-medium">{cls.name}</TableCell>
                <TableCell className={cn(cls.description ?? "text-muted")}>
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
