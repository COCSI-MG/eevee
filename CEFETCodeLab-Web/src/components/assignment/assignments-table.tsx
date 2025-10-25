"use client";

import { AssignmentService } from "@/app/integration/scheduler-api/assignment";
import { Code, UserCog } from "lucide-react";
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
}

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

export default function AssignmentsTable({
  assignments,
}: AssignmentsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="cursor-pointer">
            <div className="flex items-center">Title</div>
          </TableHead>
          <TableHead className="cursor-pointer">
            <div className="flex items-center">Class</div>
          </TableHead>
          <TableHead className="cursor-pointer">
            <div className="flex items-center">Description</div>
          </TableHead>
          <TableHead className="cursor-pointer">
            <div className="flex items-center">Worker Type</div>
          </TableHead>
          <TableHead className="w-[100px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(assignments ?? []).length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="text-center">
              No Assignments found.
            </TableCell>
          </TableRow>
        )}
        {(assignments ?? []).map((assignment) => {
          return (
            <TableRow key={assignment.id}>
              <TableCell>{assignment.title}</TableCell>
              <TableCell>{assignment.class.name}</TableCell>
              <TableCell>{assignment.description}</TableCell>
              <TableCell>{assignment.workerType}</TableCell>
              <TableCell>
                <TableActions
                  href={`${AppRoutes.AdminAssignments}/${assignment.id}`}
                  onDelete={() => {
                    AssignmentService.DeleteAssignment(assignment.id);
                  }}
                  otherActions={[
                    <WorkspaceLinkComponent
                      key={assignment.id}
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
