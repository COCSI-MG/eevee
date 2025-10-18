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
import { ClassesService } from "@/app/integration/scheduler-api/classes";
import { useClasses } from "@/hooks/use-classes";

export default function AdminClassesTable() {
  const { data, isFetching, isError, refetch } = useClasses();

  const handleDelete = async (id: number) => {
    try {
      await ClassesService.remove(id);
      refetch();
    } catch (err) {
      console.error("Failed to delete class:", err);
    }
  };

  if (isFetching && !data) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error loading classes.</div>;
  }

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
        {(data ?? []).length === 0 && (
          <TableRow>
            <TableCell colSpan={3} className="text-center">
              No classes found.
            </TableCell>
          </TableRow>
        )}
        {(data ?? []).map((cls) => {
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
