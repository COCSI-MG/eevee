"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  itemLabel?: { singular: string; plural: string };
  className?: string;
}

export default function AdminPagination({
  page,
  totalPages,
  pageSize,
  total,
  onPageChange,
  itemLabel = { singular: "item", plural: "itens" },
  className,
}: AdminPaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const startIndex = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total);
  const label = total === 1 ? itemLabel.singular : itemLabel.plural;

  return (
    <div
      className={cn(
        "mt-4 flex flex-wrap items-center justify-between gap-3",
        className,
      )}
    >
      <p className="text-xs text-muted-foreground">
        Mostrando {startIndex}-{endIndex} de {total} {label}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          aria-label="Página anterior"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="rounded-md border px-3 py-1 text-sm">
          {page} / {safeTotalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          aria-label="Próxima página"
          disabled={page >= safeTotalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
