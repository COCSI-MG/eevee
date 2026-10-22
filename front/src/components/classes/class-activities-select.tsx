"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

export interface SelectableActivity {
  id: number;
  title: string;
}

export interface ActivitySelectLabels {
  label: string;
  allLabel: string;
  searchPlaceholder: string;
  emptyMessage: string;
  selectionSummary: (count: number) => string;
}

const DEFAULT_LABELS: ActivitySelectLabels = {
  label: "Atividades",
  allLabel: "Todas as atividades",
  searchPlaceholder: "Buscar atividade...",
  emptyMessage: "Nenhuma atividade encontrada.",
  selectionSummary: (count) => `${count} atividade(s) selecionada(s)`,
};

interface Props {
  activities: SelectableActivity[];
  selectedIds: number[] | undefined;
  onChange: (ids: number[] | undefined) => void;
  labels?: Partial<ActivitySelectLabels>;
}

export default function ClassActivitiesSelect({
  activities,
  selectedIds,
  onChange,
  labels: labelOverrides
}: Props)
{
  const labelId = useId();
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const allSelected = selectedIds === undefined;

  const toggle = (id: number) => {
    const selected = selectedIds ?? [];

    if (selected.includes(id)) {
      const remaining = selected.filter((activityId) => activityId !== id);

      onChange(remaining.length ? remaining : undefined);

      return;
    }

    onChange([...selected, id]);
  };

  return (
    <div className="space-y-2 w-full max-w-md">
      <label id={labelId} className="text-sm font-medium">
        {labels.label}
      </label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-labelledby={labelId}
            disabled={!activities.length}
            className="w-full justify-between"
          >
            {allSelected
              ? labels.allLabel
              : labels.selectionSummary(selectedIds.length)}

            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="p-0 w-[var(--radix-popover-trigger-width)]"
        >
          <Command>
            <CommandInput placeholder={labels.searchPlaceholder} />
            <CommandList aria-multiselectable="true">
              <CommandEmpty>{labels.emptyMessage}</CommandEmpty>

              <CommandGroup>
                <CommandItem
                  value={labels.allLabel}
                  aria-checked={allSelected}
                  onSelect={() => onChange(undefined)}
                >
                  <Check
                    className={cn("mr-2 h-4 w-4", !allSelected && "opacity-0")}
                  />
                  {labels.allLabel}
                </CommandItem>
                {activities.map((activity) => {
                  const selected = selectedIds?.includes(activity.id) ?? false;
                  return (
                    <CommandItem
                      key={activity.id}
                      value={`${activity.title} ${activity.id}`}
                      aria-checked={selected}
                      onSelect={() => toggle(activity.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          !selected && "opacity-0",
                        )}
                      />

                      <span>{activity.title}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
