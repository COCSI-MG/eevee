'use client';

import Link from 'next/link';
import { MoreHorizontal, Plus, Pencil, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AssignmentService } from '@/app/integration/scheduler-api/assignment';
import { useQuery } from '@tanstack/react-query';
import { Route } from '@/app/routes';
import DeleteAlertDialog from '@/components/table/delete-alert-dialog';

export default function AssignmentsAdminPage() {
  const { data, isSuccess, isPending, refetch } = useQuery({
    queryKey: ['adminAssignments'],
    retryOnMount: true,
    initialData: [],
    queryFn: AssignmentService.GetAssignmentsAdmin,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>

        <Link href="/admin/assignments/new">
          <Button variant={'outline'}>
            <Plus className="h-4 w-4 mr-2" />
            Add Assignment
          </Button>
        </Link>
      </div>

      {/* <div className="flex items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search assignments..."
            className="pl-8"
          />
        </div>
      </div> */}

      <div className="border rounded-md">
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
            {!isPending &&
              isSuccess &&
              (data ?? []).map((assignment) => {
                return (
                  <TableRow key={assignment.id}>
                    <TableCell>{assignment.title}</TableCell>
                    <TableCell>{assignment.class.name}</TableCell>
                    <TableCell>{assignment.description}</TableCell>
                    <TableCell>{assignment.workerType}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link
                            href={`/${Route.Assignment}/${assignment.id}/${Route.Workspace}`}
                          >
                            <DropdownMenuItem>
                              Workspace
                              <Code className="ml-auto h-4 w-4" />
                            </DropdownMenuItem>
                          </Link>
                          <Link href={`/admin/assignments/${assignment.id}`}>
                            <DropdownMenuItem>
                              Edit
                              <Pencil className="ml-auto h-4 w-4" />
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem
                            className="text-destructive"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <DeleteAlertDialog
                              resourceName="assignment"
                              onDelete={() => {
                                AssignmentService.DeleteAssignment(
                                  assignment.id
                                );
                                refetch();
                              }}
                            />
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
