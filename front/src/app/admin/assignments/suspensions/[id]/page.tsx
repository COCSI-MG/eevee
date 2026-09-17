"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, BellRing, Eye } from "lucide-react";
import { AssignmentAlertService } from "@/app/integration/scheduler-api/assignment-alert";
import type { AssignmentAlertUserSummary } from "@/app/interface/scheduler-api/assignment-alert";
import { AssignmentAlertHistoryDialog } from "@/app/admin/assignments/suspensions/[id]/_components/assignment-alert-history-dialog";
import { formatDate } from "@/utils/date";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const assignmentId = Number(id);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AssignmentAlertUserSummary | null>(null);

  const usersQuery = useQuery({
    queryKey: ["assignment-alert-users", assignmentId, search],
    queryFn: () =>
      AssignmentAlertService.listUsers(assignmentId, {
        page: 1,
        pageSize: 100,
        status: "all",
        search: search.trim() || undefined,
      }),
    enabled: Number.isInteger(assignmentId) && assignmentId > 0
  });

  if (usersQuery.isLoading) {
    return (
      <div className="p-6 text-muted-foreground">Carregando alertas...</div>
    );
  }

  if (usersQuery.isError) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-2 h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">
            Falha ao carregar os alertas
          </p>
        </div>
      </div>
    );
  }

  const users = usersQuery.data?.data ?? [];

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="space-y-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="h-5 w-5" />
              Alertas e bloqueios da atividade
            </CardTitle>

            <p className="text-sm text-muted-foreground">
              A suspensão é calculada pelos alertas ativos. Abra o histórico
              para consultar ou arquivar uma ocorrência específica.
            </p>
          </div>

          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome ou e-mail"
            className="max-w-md"
          />
        </CardHeader>

        <CardContent>
          {users.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Nenhum alerta registrado nesta atividade.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Alertas ativos</TableHead>
                  <TableHead>Total histórico</TableHead>
                  <TableHead>Último alerta</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.userId}>
                    <TableCell>
                      <span className="block font-medium">{user.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.activeCount} / {user.limit}
                    </TableCell>
                    <TableCell>{user.totalCount}</TableCell>
                    <TableCell>{formatDate(user.lastAlertAt)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={user.suspended ? "destructive" : "outline"}
                      >
                        {user.suspended ? "Bloqueado" : "Liberado"}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        Histórico
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AssignmentAlertHistoryDialog
        assignmentId={assignmentId}
        onClose={() => setSelectedUser(null)}
        selectedUser={selectedUser}
      />
    </div>
  );
}
