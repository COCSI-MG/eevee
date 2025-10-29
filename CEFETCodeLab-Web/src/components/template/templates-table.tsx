"use client";

import {
  DialogHeader,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "../ui/dialog";
import { Eye, Code } from "lucide-react";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Route } from "@/app/routes";
import dynamic from "next/dynamic";
import TableActions from "../table/table-actions";
import React from "react";
import { Template } from "@/app/interface/scheduler-api/template";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

interface TemplatesTableProps {
  templates: Template[] | undefined;
  handleDelete: (id: number) => void;
}

export default function TemplatesTable({
  templates,
  handleDelete,
}: TemplatesTableProps) {
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
        {(templates ?? []).length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="text-center py-4">
              No templates found.
            </TableCell>
          </TableRow>
        )}
        {(templates ?? []).map((template) => (
          <TableRow key={template.id}>
            <TableCell className="font-medium">{template.title}</TableCell>
            <TableCell>{template.description}</TableCell>
            <TableCell>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant={"outline"}
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
                        defaultLanguage="typescript"
                        theme="vs-dark"
                        value={template.templateContent}
                        height={"420px"}
                        options={{
                          readOnly: true,
                        }}
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </TableCell>
            <TableCell>
              <TableActions
                href={`${Route.AdminTemplate}/${template.id}`}
                onDelete={() => handleDelete(Number(template.id))}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
