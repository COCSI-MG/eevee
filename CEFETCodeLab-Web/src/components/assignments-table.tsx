"use client"

import { AssignmentService } from '@/app/integration/scheduler-api/assignment';
import { Code, UserCog } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from './ui/table';
import TableActions from './table/table-actions';
import { DropdownMenuItem } from './ui/dropdown-menu';
import { Route as AppRoutes } from '@/app/routes';
import { useAdminAssignments } from '@/hooks/use-assignments';
import Link from 'next/link';

export default function AssignmentsTable() {
  const { data, isPending, isSuccess } = useAdminAssignments();

  const WorkspaceLinkComponent = ({
    assignmentId,
  }: {
    assignmentId: string;
  }) => {
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
          Usuarios Suspensos
        </DropdownMenuItem>
      </Link>
    );
  }

  if (isPending) {
    return <div>Loading...</div>;
  }

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
        {isSuccess && (data ?? []).length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="text-center">
              No Assignments found.
            </TableCell>
          </TableRow>
        )}
        {isSuccess &&
          (data ?? []).map((assignment) => {
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
