"use client";

import { Plus } from "lucide-react";
import { AssignmentSummary } from "@/app/interface/scheduler-api/exam";
import { Assignment } from "@/app/interface/scheduler-api/assignment";
import { ADMIN_LIST_PAGE_SIZE } from "@/app/interface/scheduler-api/pagination";
import ListSearch from "@/components/shared/list-search";
import Pagination from "@/components/shared/pagination";
import ExamAssignmentsTable from "@/components/exam/exam-activities-table";
import SelectFromListModal from "@/components/ui/select-from-list-modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface ExamActivitiesSectionProps {
  examId: number;
  classId: number;
  pagedAssignments: AssignmentSummary[];
  total: number;
  totalPages: number;
  safePage: number;
  search: string;
  setSearch: (value: string) => void;
  debouncedSearch: string;
  emptyMessage: string;
  activitiesData: {
    deleteAssignment: (assignment: AssignmentSummary) => void;
    unlinkAssignment: (assignment: AssignmentSummary) => void;
  };
  editScore: {
    editing: AssignmentSummary | null;
    setEditing: (assignment: AssignmentSummary | null) => void;
    value: string;
    setValue: (value: string) => void;
    error: string | null;
    setError: (error: string | null) => void;
    isUpdating: boolean;
    save: () => void;
    request: (assignment: AssignmentSummary) => void;
  };
  link: {
    open: boolean;
    setOpen: (open: boolean) => void;
    pendingId: number | null;
    scores: Record<number, string>;
    setScore: (assignmentId: number, value: string) => void;
    error: string | null;
    errorMessage: string | null;
    isLoading: boolean;
    items: Assignment[] | undefined;
    link: (assignment: Assignment) => void;
    isValidScore: (raw: string | undefined) => boolean;
  };
  onRefetch: () => void;
}

export default function ExamActivitiesSection({
  examId,
  classId,
  pagedAssignments,
  total,
  totalPages,
  safePage,
  search,
  setSearch,
  debouncedSearch,
  emptyMessage,
  activitiesData,
  editScore,
  link,
  onRefetch,
}: ExamActivitiesSectionProps) {
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Atividades</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => link.setOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Vincular atividade
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <ListSearch
            value={search}
            onChange={setSearch}
            placeholder="Filtrar por título da atividade"
            ariaLabel="Filtrar atividades pelo título"
            className="max-w-md"
          />
          <div className="border rounded-md">
            <ExamAssignmentsTable
              assignments={pagedAssignments}
              emptyMessage={emptyMessage}
              onDelete={activitiesData.deleteAssignment}
              onUnlink={activitiesData.unlinkAssignment}
              onEditScore={editScore.request}
            />
          </div>
          {total > 0 && (
            <Pagination
              page={safePage}
              totalPages={totalPages}
              pageSize={ADMIN_LIST_PAGE_SIZE}
              total={total}
              onPageChange={() => {}}
              itemLabel={{ singular: "atividade", plural: "atividades" }}
            />
          )}
        </CardContent>
      </Card>

      <SelectFromListModal
        open={link.open}
        onOpenChange={link.setOpen}
        title="Vincular atividade"
        description="Selecione uma atividade da turma para vincular a esta prova. Atividades já vinculadas a outras provas não são listadas."
        items={link.items ?? []}
        isLoading={link.isLoading}
        errorMessage={link.errorMessage ?? link.error}
        emptyMessage="Nenhuma atividade disponível para vincular."
        searchPlaceholder="Filtrar por título da atividade"
        searchKeys={(a) => [a.title, a.description ?? ""]}
        getItemId={(a) => a.id}
        renderRow={(a) => (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{a.title}</span>
            {a.description && (
              <span className="text-xs text-muted-foreground line-clamp-2">
                {a.description}
              </span>
            )}
          </div>
        )}
        rowExtras={(a) => (
          <div className="flex items-center gap-1 shrink-0">
            <Input
              type="number"
              min={0.01}
              step={0.01}
              value={link.scores[a.id] ?? ""}
              onChange={(e) => link.setScore(a.id, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="w-20 h-8 text-sm tabular-nums text-right"
            />
            <span className="text-xs text-muted-foreground">pts</span>
          </div>
        )}
        isRowActionDisabled={(a) => !link.isValidScore(link.scores[a.id])}
        actionLabel="Vincular"
        onSelect={link.link}
        actionPendingId={link.pendingId}
      />

      <Dialog
        open={editScore.editing !== null}
        onOpenChange={(o) => {
          if (!o) {
            editScore.setEditing(null);
            editScore.setValue("");
            editScore.setError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar pontuação</DialogTitle>
            <DialogDescription>
              Defina quantos pontos vale a atividade
              &lsquo;{editScore.editing?.title}&rsquo; dentro desta prova.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="score" className="text-right">
                Pontos
              </Label>
              <Input
                id="score"
                type="number"
                min={0.01}
                step={0.01}
                placeholder="pts"
                value={editScore.value}
                onChange={(e) => {
                  editScore.setValue(e.target.value);
                  editScore.setError(null);
                }}
                className="col-span-3 w-28 text-sm tabular-nums text-right"
              />
            </div>
            {editScore.error && (
              <p className="text-sm text-destructive col-span-4 text-right">
                {editScore.error}
              </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={editScore.isUpdating}>
                Cancelar
              </Button>
            </DialogClose>
            <Button
              onClick={editScore.save}
              disabled={editScore.isUpdating || !link.isValidScore(editScore.value)}
            >
              {editScore.isUpdating ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
