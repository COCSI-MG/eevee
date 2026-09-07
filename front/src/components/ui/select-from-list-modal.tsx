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
import { normalizeString } from "@/utils/string";

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
  rowExtras?: (item: T) => React.ReactNode;
  isRowActionDisabled?: (item: T) => boolean;
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
  rowExtras,
  isRowActionDisabled,
}: SelectFromListModalProps<T>) {
  const { search, debouncedSearch, setSearch } = usePaginatedSearch();

  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open, setSearch]);

  const filteredItems = useMemo(() => {
    const q = normalizeString(debouncedSearch);
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
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{errorMessage}</p>
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

                const isDisabled =
                  hasAnyPending || (isRowActionDisabled?.(item) ?? false);

                return (
                  <div
                    key={id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <div className="flex-1 min-w-0">{renderRow(item)}</div>
                    {rowExtras && <div className="shrink-0">{rowExtras(item)}</div>}
                    <Button
                      size="sm"
                      disabled={isDisabled}
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
