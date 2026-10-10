"use client";

import {
  ADMIN_ATTEMPTS_ALL_ASSIGNMENTS_VALUE,
  ADMIN_ATTEMPTS_ALL_CLASSES_VALUE,
  ADMIN_ATTEMPTS_DEFAULT_PAGE_SIZE,
  ADMIN_ATTEMPTS_INITIAL_PAGE,
  ADMIN_ATTEMPTS_LOADING_INDICATOR_DELAY_MS,
  ADMIN_ATTEMPTS_OPEN_LATEST_VALUE,
  ADMIN_ATTEMPTS_QUERY_PARAMS,
  ADMIN_ATTEMPTS_SEARCH_DEBOUNCE_MS,
  ADMIN_ATTEMPTS_TEXT,
} from "@/app/admin/attempts/constants";
import type { AdminUserAttemptSummary } from "@/app/interface/scheduler-api/admin-attempt";
import AdminAttemptsFilters from "@/components/attempts/admin-attempts-filters";
import AdminAttemptsTable from "@/components/attempts/admin-attempts-table";
import AdminUserAttemptsDialog from "@/components/attempts/admin-user-attempts-dialog";
import Loader from "@/components/loader";
import { useAdminAttemptAssignmentOptions } from "@/hooks/use-admin-attempt-assignment-options";
import { useAdminAttempts } from "@/hooks/use-admin-attempts";
import { useClassOptions } from "@/hooks/use-class-options";
import { useDelayedVisibility } from "@/hooks/use-delayed-visibility";
import { usePaginatedSearch } from "@/hooks/use-paginated-search";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

function AdminAttemptsPageContent() {
  const searchParams = useSearchParams();
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [selectedAttemptSummary, setSelectedAttemptSummary] =
    useState<AdminUserAttemptSummary | null>(null);
  const hasAppliedInitialParams = useRef(false);
  const hasAutoOpenedLatest = useRef(false);

  const classId = selectedClassId ? Number(selectedClassId) : undefined;
  const assignmentId = selectedAssignmentId
    ? Number(selectedAssignmentId)
    : undefined;
  const hasAttemptFilter = Boolean(classId || assignmentId);

  const {
    page,
    search: userSearch,
    debouncedSearch: debouncedUserSearch,
    setPage,
    setSearch: setUserSearch,
  } = usePaginatedSearch({
    initialPage: ADMIN_ATTEMPTS_INITIAL_PAGE,
    initialSearch:
      searchParams.get(ADMIN_ATTEMPTS_QUERY_PARAMS.userSearch) ?? "",
    debounceMs: ADMIN_ATTEMPTS_SEARCH_DEBOUNCE_MS,
  });

  const {
    data: classes,
    isLoading: isClassesLoading,
    isError: isClassesError,
  } = useClassOptions();

  const {
    data: assignments,
    isLoading: isAssignmentsLoading,
    isFetching: isAssignmentsFetching,
    isError: isAssignmentsError,
  } = useAdminAttemptAssignmentOptions(classId);

  const {
    data: attemptsResponse,
    isFetching: isAttemptsFetching,
    isError: isAttemptsError,
    refetch,
  } = useAdminAttempts({
    classId,
    assignmentId,
    userSearch: debouncedUserSearch.trim() || undefined,
    page,
    pageSize: ADMIN_ATTEMPTS_DEFAULT_PAGE_SIZE,
  });

  const isInitialAttemptsLoading =
    hasAttemptFilter && isAttemptsFetching && !attemptsResponse;
  const isRefreshingAttempts =
    hasAttemptFilter && isAttemptsFetching && Boolean(attemptsResponse);

  const showInitialLoader = useDelayedVisibility(
    isInitialAttemptsLoading,
    ADMIN_ATTEMPTS_LOADING_INDICATOR_DELAY_MS,
  );
  const showRefreshingIndicator = useDelayedVisibility(
    isRefreshingAttempts,
    ADMIN_ATTEMPTS_LOADING_INDICATOR_DELAY_MS,
  );

  useEffect(() => {
    if (hasAppliedInitialParams.current) {
      return;
    }

    const initialAssignmentId = searchParams.get(
      ADMIN_ATTEMPTS_QUERY_PARAMS.assignmentId,
    );
    const initialClassId = searchParams.get(
      ADMIN_ATTEMPTS_QUERY_PARAMS.classId,
    );

    if (initialClassId) {
      setSelectedClassId(initialClassId);
    }

    if (initialAssignmentId) {
      setSelectedAssignmentId(initialAssignmentId);
    }

    hasAppliedInitialParams.current = true;
  }, [searchParams]);

  useEffect(() => {
    if (!assignmentId || classId || !assignments) {
      return;
    }

    const assignment = assignments.find((option) => option.id === assignmentId);

    if (assignment) {
      setSelectedClassId(String(assignment.classId));
    }
  }, [assignmentId, assignments, classId]);

  useEffect(() => {
    const shouldOpenLatest =
      searchParams.get(ADMIN_ATTEMPTS_QUERY_PARAMS.openLatest) ===
      ADMIN_ATTEMPTS_OPEN_LATEST_VALUE;

    if (!shouldOpenLatest || hasAutoOpenedLatest.current) {
      return;
    }

    const firstAttempt = attemptsResponse?.data[0];
    if (!firstAttempt) {
      return;
    }

    setSelectedAttemptSummary(firstAttempt);
    hasAutoOpenedLatest.current = true;
  }, [attemptsResponse, searchParams]);

  const resetAttemptView = () => {
    setPage(ADMIN_ATTEMPTS_INITIAL_PAGE);
    setSelectedAttemptSummary(null);
  };

  const handleClassChange = (value: string) => {
    setSelectedClassId(value === ADMIN_ATTEMPTS_ALL_CLASSES_VALUE ? "" : value);
    setSelectedAssignmentId("");
    resetAttemptView();
  };

  const handleAssignmentChange = (value: string) => {
    if (value === ADMIN_ATTEMPTS_ALL_ASSIGNMENTS_VALUE) {
      setSelectedAssignmentId("");
      resetAttemptView();
      return;
    }

    setSelectedAssignmentId(value);

    const assignment = assignments?.find(
      (option) => option.id === Number(value),
    );
    if (assignment && assignment.classId !== classId) {
      setSelectedClassId(String(assignment.classId));
    }

    resetAttemptView();
  };

  const handleSearchChange = (value: string) => {
    setUserSearch(value);
    resetAttemptView();
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    setSelectedAttemptSummary(null);
  };

  if (isClassesLoading || (!classId && isAssignmentsLoading)) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {ADMIN_ATTEMPTS_TEXT.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {ADMIN_ATTEMPTS_TEXT.description}
        </p>
      </div>

      <AdminAttemptsFilters
        classes={classes ?? []}
        assignments={assignments ?? []}
        selectedClassId={selectedClassId}
        selectedAssignmentId={selectedAssignmentId}
        userSearch={userSearch}
        isAssignmentsFetching={isAssignmentsFetching}
        isAttemptsFetching={isAttemptsFetching}
        showRefreshingIndicator={showRefreshingIndicator}
        onClassChange={handleClassChange}
        onAssignmentChange={handleAssignmentChange}
        onUserSearchChange={handleSearchChange}
        onRefresh={() => refetch()}
      />

      {(isClassesError || isAssignmentsError) && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {ADMIN_ATTEMPTS_TEXT.status.filterOptionsError}
        </div>
      )}

      {!hasAttemptFilter && (
        <div className="rounded-2xl border border-border bg-background/70 p-8 text-center text-muted-foreground">
          {ADMIN_ATTEMPTS_TEXT.status.initialPrompt}
        </div>
      )}

      {showInitialLoader && <Loader />}

      {hasAttemptFilter && isAttemptsError && !isAttemptsFetching && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {ADMIN_ATTEMPTS_TEXT.status.attemptsError}
        </div>
      )}

      {hasAttemptFilter && attemptsResponse && (
        <AdminAttemptsTable
          attempts={attemptsResponse.data}
          page={attemptsResponse.meta.page}
          pageSize={attemptsResponse.meta.pageSize}
          total={attemptsResponse.meta.total}
          totalPages={attemptsResponse.meta.totalPages}
          onViewAttempts={setSelectedAttemptSummary}
          onPageChange={handlePageChange}
        />
      )}

      <AdminUserAttemptsDialog
        attemptSummary={selectedAttemptSummary}
        open={selectedAttemptSummary !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAttemptSummary(null);
          }
        }}
      />
    </div>
  );
}

export default function AdminAttemptsPage() {
  return (
    <Suspense fallback={<Loader />}>
      <AdminAttemptsPageContent />
    </Suspense>
  );
}
