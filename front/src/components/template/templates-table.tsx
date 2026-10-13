"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Route } from "@/app/routes";
import TableActions from "../table/table-actions";
import React from "react";
import { PaginatedTemplate } from "@/app/interface/scheduler-api/template";
import {
  TEMPLATE_TABLE_TEXT,
  WorkerTypeLabelMap,
} from "@/app/admin/templates/constants";

interface TemplatesTableProps {
  templates: PaginatedTemplate[] | undefined;
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
              {TEMPLATE_TABLE_TEXT.actionsHeader}
            </div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {list.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
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
