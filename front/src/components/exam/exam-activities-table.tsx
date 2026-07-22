"use client";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../ui/table";
import TableActions from "../table/table-actions";
import {
  WorkspaceLinkComponent,
  ViewUserSuspensionComponent,
} from "../assignment/activity-actions";
import { Route as AppRoutes } from "@/app/routes";
import { AssignmentSummary } from "@/app/interface/scheduler-api/exam";

interface ExamActivitiesTableProps {
  activities: Array<AssignmentSummary>;
  emptyMessage?: string;
  onDelete: (activity: AssignmentSummary) => void;
  onUnlink: (activity: AssignmentSummary) => void;
}

const DESCRIPTION_MAX_LENGTH = 100;

export default function ExamActivitiesTable({
  activities,
  emptyMessage = "Nenhuma atividade.",
  onDelete,
  onUnlink,
}: ExamActivitiesTableProps) {
  const list = activities ?? [];

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
            <div className="flex items-center">Tentativas Máximas</div>
          </TableHead>
          <TableHead>
            <div className="flex items-center">Worker Type</div>
          </TableHead>
          <TableHead className="w-[100px]">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {list.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={5}
              className="text-center text-muted-foreground"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
        {list.map((activity) => {
          const description = activity.description ?? "";

          return (
            <TableRow key={activity.id}>
              <TableCell>{activity.title}</TableCell>
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
              <TableCell>{activity.maxAttempts}</TableCell>
              <TableCell>{activity.workerType}</TableCell>
              <TableCell>
                <TableActions
                  href={`${AppRoutes.AdminAssignments}/${activity.id}`}
                  onDelete={() => onDelete(activity)}
                  onUnlink={() => onUnlink(activity)}
                  unlinkTitle={`Tem certeza que deseja desvincular esta atividade '${activity.title}'?`}
                  unlinkDescription="A atividade não será excluída, apenas removida desta prova."
                  otherActions={[
                    <WorkspaceLinkComponent
                      key={activity.id}
                      assignmentId={activity.id.toString()}
                    />,
                    <ViewUserSuspensionComponent
                      key={`${activity.id}-suspensions`}
                      assignmentId={activity.id.toString()}
                    />,
                  ]}
                  resourceName="atividade"
                  itemName={activity.title}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
