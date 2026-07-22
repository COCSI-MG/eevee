"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import TableActions from "./table/table-actions";
import { User } from "@/app/interface/scheduler-api/user";

interface UsersTableProps {
  users: User[] | undefined;
  handleDelete: (id: number) => void;
  emptyMessage?: string;
}

export default function UsersTable({
  users,
  handleDelete,
  emptyMessage = "Nenhum usuário encontrado.",
}: UsersTableProps) {
  const rows = users ?? [];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="cursor-pointer">
            <div className="flex items-center">Nome</div>
          </TableHead>
          <TableHead className="cursor-pointer">
            <div className="flex items-center">Email</div>
          </TableHead>
          <TableHead className="cursor-pointer">
            <div className="flex items-center">Função</div>
          </TableHead>
          <TableHead className="w-[100px]">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="text-center text-muted-foreground">
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
        {rows.map((user) => {
          return (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant={user.isAdmin ? "default" : "outline"}>
                  {user.isAdmin ? "Administrador" : "Usuário"}
                </Badge>
              </TableCell>
              <TableCell>
                <TableActions
                  href={`/admin/users/${user.id}`}
                  onDelete={() => handleDelete(user.id)}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
