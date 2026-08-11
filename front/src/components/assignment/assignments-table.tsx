"use client";

import { AssignmentService } from "@/app/integration/scheduler-api/assignment";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { BookOpenCheck, Code, UserCog } from "lucide-react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../ui/table";
import TableActions from "../table/table-actions";
import { DropdownMenuItem } from "../ui/dropdown-menu";
import { Route as AppRoutes } from "@/app/routes";
import Link from "next/link";
import { Assignment } from "@/app/interface/scheduler-api/assignment";

interface AssignmentsTableProps {
  assignments: Array<Assignment>;
  emptyMessage?: string;
}

const ASSIGNMENT_DESCRIPTION_MAX_LENGTH = 100;

const WorkspaceLinkComponent = ({ assignmentId }: { assignmentId: string }) => {
  return (
    <Link
      href={`/${AppRoutes.Assignment}/${assignmentId}/${AppRoutes.Workspace}`}
    >
      <DropdownMenuItem>
        <Code className="h-4 w-4" />
        Workspace
      </DropdownMenuItem>
    </Link>
  );
};

const ViewUserSuspensionComponent = ({
  assignmentId,
}: {
  assignmentId: string;
}) => {
  return (
    <Link
      href={`${AppRoutes.AdminAssignments}/${AppRoutes.AssignmenstUsersSuspensions}/${assignmentId}`}
    >
      <DropdownMenuItem>
        <UserCog className="h-4 w-4" />
        Usuários Suspensos
      </DropdownMenuItem>
    </Link>
  );
};

const AnswerKeyLinkComponent = ({ assignmentId }: { assignmentId: string }) => {
  return (
    <Link
      href={`/${AppRoutes.Assignment}/${assignmentId}/${AppRoutes.Workspace}/${AppRoutes.AnswerKey}`}
    >
      <DropdownMenuItem>
        <BookOpenCheck className="h-4 w-4" />
        Gabarito
      </DropdownMenuItem>
    </Link>
  );
};

export default function AssignmentsTable({
  assignments,
  emptyMessage = "Nenhuma atividade encontrada.",
}: AssignmentsTableProps) {
  const queryClient = useQueryClient();
  const list = assignments ?? [];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="cursor-pointer">
            <div className="flex items-center">Título</div>
          </TableHead>
          <TableHead className="cursor-pointer">
            <div className="flex items-center">Turma</div>
          </TableHead>
          <TableHead className="cursor-pointer">
            <div className="flex items-center">Descrição</div>
          </TableHead>
          <TableHead className="cursor-pointer">
            <div className="flex items-center">Tipo de Worker</div>
          </TableHead>
          <TableHead className="w-[100px]">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {list.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground">
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
        {list.map((assignment) => {
          const description = assignment.description ?? "";

          return (
            <TableRow key={assignment.id}>
              <TableCell>{assignment.title}</TableCell>
              <TableCell>{assignment.class.name}</TableCell>
              <TableCell
                title={
                  description.length > ASSIGNMENT_DESCRIPTION_MAX_LENGTH
                    ? description
                    : undefined
                }
                className="max-w-[24rem]"
              >
                {description.length > ASSIGNMENT_DESCRIPTION_MAX_LENGTH
                  ? `${description.slice(0, ASSIGNMENT_DESCRIPTION_MAX_LENGTH)}...`
                  : description}
              </TableCell>
              <TableCell>{assignment.workerType}</TableCell>
              <TableCell>
                <TableActions
                  href={`${AppRoutes.AdminAssignments}/${assignment.id}`}
                  onDelete={async () => {
                    try {
                      await AssignmentService.DeleteAssignment(assignment.id);
                      toast({
                        title: "Tarefa excluída",
                        description: "A tarefa foi removida com sucesso.",
                      });
                      await queryClient.invalidateQueries({
                        queryKey: ["adminAssignments"],
                      });
                    } catch (err) {
                      const description =
                        err instanceof Error
                          ? err.message
                          : "Não foi possível excluir a tarefa.";
                      toast({
                        variant: "destructive",
                        title: "Não foi possível excluir",
                        description,
                      });
                      throw err;
                    }
                  }}
                  otherActions={[
                    <WorkspaceLinkComponent
                      key={assignment.id}
                      assignmentId={assignment.id.toString()}
                    />,
                    <AnswerKeyLinkComponent
                      key={`${assignment.id}-answer-key`}
                      assignmentId={assignment.id.toString()}
                    />,
                    <ViewUserSuspensionComponent
                      key={`${assignment.id}-suspensions`}
                      assignmentId={assignment.id.toString()}
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
