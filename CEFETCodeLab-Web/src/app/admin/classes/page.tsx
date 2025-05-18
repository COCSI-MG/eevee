'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MoreHorizontal,
  Plus,
  Search,
  Trash,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { ClassesService } from '@/app/integration/scheduler-api/classes';

export default function ClassesPage() {
  const { data, isPending, isSuccess } = useQuery({
    queryKey: ['classes'],
    retryOnMount: true,
    initialData: [],
    queryFn: ClassesService.listClasses
  })
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
//   const [classToDelete, setClassToDelete] = useState<string | null>(null);

//   // Handle delete
//   const handleDelete = () => {
//     if (classToDelete) {
//       setClasses(classes.filter((cls) => cls.id !== classToDelete));
//       setClassToDelete(null);
//       setDeleteDialogOpen(false);
//     }
//   };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Classes</h1>
        <Link href="/admin/classes/new">
          <Button variant={'outline'}>
            <Plus className="h-4 w-4 mr-2" />
            Add Class
          </Button>
        </Link>
      </div>

      <div className="flex items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search classes..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer"
              >
                <div className="flex items-center">
                  Class Name
                </div>
              </TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isPending && isSuccess && (data ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="text-center">
                  No classes found.
                </TableCell>
              </TableRow>
            )}
            {!isPending &&
              isSuccess &&
              (data ?? []).map((cls) => {
                return (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">
                      {cls.name}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/admin/classes/${cls.id}`}>
                            <DropdownMenuItem>
                              Edit
                              <Pencil className="ml-auto h-4 w-4" />
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setDeleteDialogOpen(true);
                            }}
                          >
                            Delete
                            <Trash className="ml-auto h-4 w-4" />
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

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Are you sure you want to delete this class?
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              class and all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => {
                setDeleteDialogOpen(false);
            }}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
