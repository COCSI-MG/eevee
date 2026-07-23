"use client";

import { useEffect, useMemo } from "react";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ListSearch from "@/components/shared/list-search";
import Loader from "@/components/loader";
import { usePaginatedSearch } from "@/hooks/use-paginated-search";

export interface SelectFromListModalProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  items: T[];
  isLoading: boolean;
  errorMessage?: string | null;
  emptyMessage?: string;
  searchPlaceholder: string;
  searchKeys: (item: T) => string[];
  getItemId: (item: T) => string | number;
  renderRow: (item: T) => React.ReactNode;
  actionLabel: string;
  onSelect: (item: T) => void;
  actionPendingId?: string | number | null;
}

export default function SelectFromListModal<T>({
  open,
  onOpenChange,
  title,
  description,
  items,
  isLoading,
  errorMessage,
  emptyMessage = "Nenhum item disponível.",
  searchPlaceholder,
  searchKeys,
  getItemId,
  renderRow,
  actionLabel,
  onSelect,
  actionPendingId,
}: SelectFromListModalProps<T>) {
  const { search, debouncedSearch, setSearch } = usePaginatedSearch();

  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open, setSearch]);

  const filteredItems = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      searchKeys(item).some(
        (key) => key && key.toLowerCase().includes(q),
      ),
    );
  }, [items, debouncedSearch, searchKeys]);

  const hasAnyPending = actionPendingId != null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4">
          <ListSearch
            value={search}
            onChange={setSearch}
            placeholder={searchPlaceholder}
            ariaLabel={searchPlaceholder}
          />

          {errorMessage && (
            <div className="rounded-lg border border-red-800 bg-red-950/20 p-4">
              <p className="text-sm text-red-200/80">{errorMessage}</p>
            </div>
          )}

          {isLoading && items.length === 0 && (
            <Loader fullScreen={false} />
          )}

          {!isLoading && filteredItems.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              {emptyMessage}
            </p>
          )}

          {filteredItems.length > 0 && (
            <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
              {filteredItems.map((item) => {
                const id = getItemId(item);
                const isPending = actionPendingId === id;

                return (
                  <div
                    key={id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <div className="flex-1 min-w-0">{renderRow(item)}</div>
                    <Button
                      size="sm"
                      disabled={hasAnyPending}
                      onClick={() => onSelect(item)}
                    >
                      {isPending && (
                        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {actionLabel}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
