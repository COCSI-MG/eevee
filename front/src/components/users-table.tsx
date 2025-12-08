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
}

export default function UsersTable({ users, handleDelete }: UsersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="cursor-pointer">
            <div className="flex items-center">Name</div>
          </TableHead>
          <TableHead className="cursor-pointer">
            <div className="flex items-center">Email</div>
          </TableHead>
          <TableHead className="cursor-pointer">
            <div className="flex items-center">Role</div>
          </TableHead>
          <TableHead className="w-[100px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(users ?? []).map((user) => {
          return (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant={user.isAdmin ? "default" : "outline"}>
                  {user.isAdmin ? "Admin" : "User"}
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
