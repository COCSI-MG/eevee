'use client';

import {
  DialogHeader,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from '../ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../ui/dropdown-menu';
import { Eye, Code, MoreHorizontal, Edit } from 'lucide-react';
import DeleteAlertDialog from '../table/delete-alert-dialog';
import { Button } from '../ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { TemplatesService } from '@/app/integration/scheduler-api/templates';
import { useQuery } from '@tanstack/react-query';
import { Route } from '@/app/routes';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import React from 'react';

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
});

export default function TemplatesTable() {
  const [open, setOpen] = React.useState(false);

  const {
    data: templates,
    isFetching,
    isSuccess,
    refetch: refetchTemplates,
  } = useQuery({
    queryKey: ['templates'],
    retryOnMount: true,
    initialData: [],
    queryFn: TemplatesService.listTemplates,
  });

  const handleDeleteTemplate = async (templateId: number) => {
    try {
      await TemplatesService.deleteTemplate(templateId);
      refetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  if (isFetching) {
    return <div>Loading ...</div>;
  }

  return (
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
        {isSuccess && (templates ?? 0).length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="text-center py-4">
              No templates found.
            </TableCell>
          </TableRow>
        )}
        {isSuccess &&
          (templates ?? []).map((template) => (
            <TableRow key={template.id}>
              <TableCell className="font-medium">{template.title}</TableCell>
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
                        <Editor
                            defaultLanguage='typescript'
                            theme='vs-dark'
                            value={template.templateContent}
                            height={'420px'}
                        />
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
                    <DropdownMenuItem
                      className="text-red-400 hover:text-red-300 hover:bg-slate-600"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <DeleteAlertDialog
                        open={open}
                        onOpenChange={setOpen}
                        resourceName="template"
                        onDelete={() =>
                          handleDeleteTemplate(Number(template.id))
                        }
                      />
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
}
