'use client';

import { useQuery } from '@tanstack/react-query';
import { TemplatesService } from '@/app/integration/scheduler-api/templates';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Code, Edit, Eye, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenu,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Route } from '@/app/routes';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function TemplatePage() {
  const {
    data: templates,
    isPending,
    isSuccess,
  } = useQuery({
    queryKey: ['templates'],
    retryOnMount: true,
    initialData: [],
    queryFn: TemplatesService.listTemplates,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Templates</h1>
        <Link href="/admin/templates/new">
          <Button variant={'outline'}>
            <Plus className="h-4 w-4 mr-2" />
            Add Template
          </Button>
        </Link>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer">
                <div className="flex items-center">Title</div>
              </TableHead>
              <TableHead className="cursor-pointer">
                <div className="flex items-center">Description</div>
              </TableHead>
              <TableHead className="cursor-pointer">
                <div className="flex items-center">Conteúdo</div>
              </TableHead>
              <TableHead className="cursor-pointer">
                <div className="flex items-center">Actions</div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isPending && isSuccess && (templates ?? 0).length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  No templates found.
                </TableCell>
              </TableRow>
            )}
            {!isPending &&
              isSuccess &&
              (templates ?? []).map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">
                    {template.title}
                  </TableCell>
                  <TableCell>{template.description}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant={'outline'}
                          size="sm"
                          className="text-slate-40 hover:text-white"
                        >
                          <Eye className="h-4 w-4" />
                          Visualizar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-800 border-slate-700 max-w-4xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle className="text-white flex items-center gap-2">
                            <Code className="w-5 h-5" />
                            {template.title}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="bg-slate-900 border borde-slate-600 rounded-md p4 max-h-[50vh] overflow-y-auto">
                            <pre className="whitespace-pre-wrap break-words text-green-400">
                              {template.templateContent}
                            </pre>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant={'ghost'}
                          size="sm"
                          className="text-slate-40 hover:text-white"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-700 border-slate-600">
                        <Link href={`${Route.AdminTemplate}/${template.id}`}>
                          <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-600">
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                        </Link>
                        {/* <DropdownMenuItem className="text-red-400 hover:text-red-300 hover:bg-slate-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Deletar
                        </DropdownMenuItem> */}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
