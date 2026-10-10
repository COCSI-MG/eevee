"use client";

import { Pencil } from "lucide-react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../ui/table";
import TableActions from "../table/table-actions";
import { Button } from "../ui/button";
import {
  WorkspaceLinkComponent,
  ViewAssignmentAlertsComponent
} from "../assignment/activity-actions";
import { Route as AppRoutes } from "@/app/routes";
import { AssignmentSummary } from "@/app/interface/scheduler-api/exam";
import { formatDateTime } from "@/utils/date";

interface ExamAssignmentsTableProps {
  assignments: Array<AssignmentSummary>;
  emptyMessage?: string;
  onDelete: (assignment: AssignmentSummary) => void;
  onUnlink: (assignment: AssignmentSummary) => void;
  onEditScore?: (assignment: AssignmentSummary) => void;
}

const DESCRIPTION_MAX_LENGTH = 100;

export default function ExamAssignmentsTable({
  assignments,
  emptyMessage = "Nenhuma atividade.",
  onDelete,
  onUnlink,
  onEditScore,
}: ExamAssignmentsTableProps) {
  const list = assignments ?? [];

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
            <div className="flex items-center">Pontuação</div>
          </TableHead>
          <TableHead>
            <div className="flex items-center">Tentativas Máximas</div>
          </TableHead>
          <TableHead>
            <div className="flex items-center">Worker Type</div>
          </TableHead>
          <TableHead>Data de início</TableHead>
          <TableHead>Data de entrega</TableHead>
          <TableHead className="w-[100px]">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {list.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={8}
              className="text-center text-muted-foreground"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
        {list.map((assignment) => {
          const description = assignment.description ?? "";

          return (
            <TableRow key={assignment.id}>
              <TableCell>{assignment.title}</TableCell>
              <TableCell
                title={
                  description.length > DESCRIPTION_MAX_LENGTH
                    ? description
                    : undefined
                }
                className="max-w-[24rem]"
              >
                {description.length > DESCRIPTION_MAX_LENGTH
                  ? `${description.slice(0, DESCRIPTION_MAX_LENGTH)}...`
                  : description}
              </TableCell>
              <TableCell className="tabular-nums">
                <div className="flex items-center gap-1">
                  <span>
                    {!assignment.score
                      ? "—"
                      : Number(assignment.score).toFixed(2)}
                  </span>
                  {onEditScore && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onEditScore(assignment)}
                      aria-label="Editar pontuação"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </TableCell>
              <TableCell>{assignment.maxAttempts}</TableCell>
              <TableCell>{assignment.workerType}</TableCell>
              <TableCell>{formatDateTime(assignment.startDate)}</TableCell>
              <TableCell>{formatDateTime(assignment.dueDate)}</TableCell>
              <TableCell>
                <TableActions
                  href={`${AppRoutes.AdminAssignments}/${assignment.id}`}
                  onDelete={() => onDelete(assignment)}
                  onUnlink={() => onUnlink(assignment)}
                  unlinkTitle={`Tem certeza que deseja desvincular esta atividade '${assignment.title}'?`}
                  unlinkDescription="A atividade não será excluída, apenas removida desta prova."
                  otherActions={[
                    <WorkspaceLinkComponent
                      key={assignment.id}
                      assignmentId={assignment.id.toString()}
                    />,
                    <ViewAssignmentAlertsComponent
                      key={`${assignment.id}-alerts`}
                      assignmentId={assignment.id.toString()}
                    />,
                  ]}
                  resourceName="atividade"
                  itemName={assignment.title}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
