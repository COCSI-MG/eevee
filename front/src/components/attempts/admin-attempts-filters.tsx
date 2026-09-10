"use client";

import {
  ADMIN_ATTEMPTS_ALL_ASSIGNMENTS_VALUE,
  ADMIN_ATTEMPTS_ALL_CLASSES_VALUE,
  ADMIN_ATTEMPTS_TEXT,
} from "@/app/admin/attempts/constants";
import {
  AdminAttemptAssignmentOption,
  AdminAttemptClassOption,
} from "@/app/interface/scheduler-api/admin-attempt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCcw } from "lucide-react";

interface AdminAttemptsFiltersProps {
  classes: AdminAttemptClassOption[];
  assignments: AdminAttemptAssignmentOption[];
  selectedClassId: string;
  selectedAssignmentId: string;
  userSearch: string;
  isAssignmentsFetching: boolean;
  isAttemptsFetching: boolean;
  showRefreshingIndicator: boolean;
  onClassChange: (value: string) => void;
  onAssignmentChange: (value: string) => void;
  onUserSearchChange: (value: string) => void;
  onRefresh: () => void;
}

export default function AdminAttemptsFilters({
  classes,
  assignments,
  selectedClassId,
  selectedAssignmentId,
  userSearch,
  isAssignmentsFetching,
  isAttemptsFetching,
  showRefreshingIndicator,
  onClassChange,
  onAssignmentChange,
  onUserSearchChange,
  onRefresh,
}: AdminAttemptsFiltersProps) {

  const selectedClass = classes.find((classOption) => classOption.id === Number(selectedClassId));

  const selectedAssignment = assignments.find((assignment) => assignment.id === Number(selectedAssignmentId));

  const hasAttemptFilter = Boolean(selectedClassId || selectedAssignmentId);

  return (
    <section className="rounded-2xl border border-border bg-gradient-to-r from-background to-card/80 p-4 md:p-6">
      <div className="grid gap-4 md:grid-cols-[1fr_1.2fr_1fr_auto] md:items-end">
        <div className="space-y-2">

          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {ADMIN_ATTEMPTS_TEXT.filters.classLabel}
          </p>

          <Select
            value={selectedClassId || ADMIN_ATTEMPTS_ALL_CLASSES_VALUE}
            onValueChange={onClassChange}
          >
            <SelectTrigger className="border-border bg-background text-foreground">
              <SelectValue
                placeholder={ADMIN_ATTEMPTS_TEXT.filters.allClasses}
              />
            </SelectTrigger>

            <SelectContent>
              <SelectItem
                value={ADMIN_ATTEMPTS_ALL_CLASSES_VALUE}
              >
                {ADMIN_ATTEMPTS_TEXT.filters.allClasses}
              </SelectItem>

              {classes.map((classOption) => (
                <SelectItem
                  key={classOption.id}
                  value={String(classOption.id)}
                >
                  {classOption.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {ADMIN_ATTEMPTS_TEXT.filters.assignmentLabel}
          </p>
          <Select
            value={selectedAssignmentId || ADMIN_ATTEMPTS_ALL_ASSIGNMENTS_VALUE}
            onValueChange={onAssignmentChange}
            disabled={isAssignmentsFetching}
          >
            <SelectTrigger className="border-border bg-background text-foreground">
              <SelectValue
                placeholder={ADMIN_ATTEMPTS_TEXT.filters.allAssignments}
              />
            </SelectTrigger>

            <SelectContent>
              <SelectItem
                value={ADMIN_ATTEMPTS_ALL_ASSIGNMENTS_VALUE}
              >
                {ADMIN_ATTEMPTS_TEXT.filters.allAssignments}
              </SelectItem>

              {assignments.map((assignment) => (
                <SelectItem key={assignment.id} value={String(assignment.id)}>
                  {assignment.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {ADMIN_ATTEMPTS_TEXT.filters.userLabel}
          </p>
          <Input
            value={userSearch}
            onChange={(event) => onUserSearchChange(event.target.value)}
            placeholder={ADMIN_ATTEMPTS_TEXT.filters.userPlaceholder}
            className="border-border bg-background text-foreground placeholder:text-muted-foreground"
            disabled={!hasAttemptFilter}
          />
        </div>

        <Button
          variant="outline"
          className="border-border bg-background text-foreground hover:bg-card"
          onClick={onRefresh}
          disabled={!hasAttemptFilter || isAttemptsFetching}
        >
          <RefreshCcw
            className={`mr-2 h-4 w-4 ${isAttemptsFetching ? "animate-spin" : ""}`}
          />
          {ADMIN_ATTEMPTS_TEXT.actions.refresh}
        </Button>
      </div>

      {(selectedClass || selectedAssignment) && (
        <p className="mt-3 text-xs text-muted-foreground">
          {selectedClass && (
            <>
              {ADMIN_ATTEMPTS_TEXT.selection.classPrefix}{" "}

              <span className="text-foreground">{selectedClass.name}</span>
            </>
          )}
          {selectedClass && selectedAssignment && (
            <span>{ADMIN_ATTEMPTS_TEXT.selection.separator}</span>
          )}
          {selectedAssignment && (
            <>
              {ADMIN_ATTEMPTS_TEXT.selection.assignmentPrefix}{" "}

              <span className="text-foreground">
                {selectedAssignment.title}
              </span>
            </>
          )}
        </p>
      )}

      {showRefreshingIndicator && (
        <p className="mt-2 text-xs text-muted-foreground">
          {ADMIN_ATTEMPTS_TEXT.status.refreshing}
        </p>
      )}
    </section>
  );
}
