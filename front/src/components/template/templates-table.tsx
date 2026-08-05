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
import {
  TEMPLATE_TABLE_TEXT,
  WorkerTypeLabelMap,
} from "@/app/admin/templates/constants";
import { readOnlyMonacoOptions } from "@/lib/monaco-options";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

interface TemplatesTableProps {
  templates: Template[] | undefined;
  handleDelete: (id: number) => void;
  emptyMessage?: string;
}

export default function TemplatesTable({
  templates,
  handleDelete,
  emptyMessage,
}: TemplatesTableProps) {
  const list = templates ?? [];
  const emptyText = emptyMessage ?? TEMPLATE_TABLE_TEXT.empty;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="cursor-pointer">
            <div className="flex items-center">
              {TEMPLATE_TABLE_TEXT.titleHeader}
            </div>
          </TableHead>
          <TableHead className="cursor-pointer">
            <div className="flex items-center">
              {TEMPLATE_TABLE_TEXT.descriptionHeader}
            </div>
          </TableHead>
          <TableHead className="cursor-pointer">
            <div className="flex items-center">
              {TEMPLATE_TABLE_TEXT.workerTypeHeader}
            </div>
          </TableHead>
          <TableHead className="cursor-pointer">
            <div className="flex items-center">
              {TEMPLATE_TABLE_TEXT.contentHeader}
            </div>
          </TableHead>
          <TableHead className="cursor-pointer">
            <div className="flex items-center">
              {TEMPLATE_TABLE_TEXT.actionsHeader}
            </div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {list.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
              {emptyText}
            </TableCell>
          </TableRow>
        )}
        {list.map((template) => (
          <TableRow key={template.id}>
            <TableCell className="font-medium">{template.title}</TableCell>
            <TableCell>{template.description}</TableCell>
            <TableCell>
              {WorkerTypeLabelMap[template.workerType] ?? template.workerType}
            </TableCell>
            <TableCell>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant={"outline"}
                    size="sm"
                    className="text-slate-40 hover:text-white"
                  >
                    <Eye className="h-4 w-4" />
                    {TEMPLATE_TABLE_TEXT.viewButton}
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
                    <div className="bg-slate-900 border border-slate-600 rounded-md p-4 max-h-[50vh] overflow-auto min-w-0">
                      <Editor
                        path={`template-${template.id}.ts`}
                        defaultLanguage="typescript"
                        theme="vs-dark"
                        value={template.content}
                        keepCurrentModel={true}
                        height={"420px"}
                        saveViewState={false}
                        options={{
                          ...readOnlyMonacoOptions,
                          hover: { enabled: false },
                          links: false,
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
