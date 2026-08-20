"use client";

import Link from "next/link";
import { Code, UserCog } from "lucide-react";
import { DropdownMenuItem } from "../ui/dropdown-menu";
import { Route as AppRoutes } from "@/app/routes";

export const WorkspaceLinkComponent = ({
  assignmentId,
}: {
  assignmentId: string;
}) => (
  <Link
    href={`/${AppRoutes.Assignment}/${assignmentId}/${AppRoutes.Workspace}`}
  >
    <DropdownMenuItem>
      <Code className="h-4 w-4" />
      Workspace
    </DropdownMenuItem>
  </Link>
);

export const ViewUserSuspensionComponent = ({
  assignmentId,
}: {
  assignmentId: string;
}) => (
  <Link
    href={`${AppRoutes.AdminAssignments}/${AppRoutes.AssignmenstUsersSuspensions}/${assignmentId}`}
  >
    <DropdownMenuItem>
      <UserCog className="h-4 w-4" />
      Usuários Suspensos
    </DropdownMenuItem>
  </Link>
);
