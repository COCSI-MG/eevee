"use client";

import { AttemptAdminService } from "@/app/integration/scheduler-api/attempt";
import AdminAttemptsTable from "@/components/attempts/admin-attempts-table";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminAssignments } from "@/hooks/use-assignments";
import { useAdminAttempts } from "@/hooks/use-admin-attempts";
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { RefreshCcw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_PAGE_SIZE = 5;

function AdminAttemptsPageContent() {
  const searchParams = useSearchParams();
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");
  const [userSearch, setUserSearch] = useState("");
  const [debouncedUserSearch, setDebouncedUserSearch] = useState("");
  const [page, setPage] = useState(1);
  const [retryingAttemptId, setRetryingAttemptId] = useState<number | null>(null);
  const [expandedAttemptIds, setExpandedAttemptIds] = useState<Set<number>>(new Set());
  const [showInitialLoader, setShowInitialLoader] = useState(false);
  const [showRefreshingIndicator, setShowRefreshingIndicator] = useState(false);
  const hasAppliedInitialParams = useRef(false);
  const hasAutoExpandedLatest = useRef(false);

  const assignmentId = selectedAssignmentId ? Number(selectedAssignmentId) : undefined;

  const {
    data: assignments,
    isFetching: isAssignmentsFetching,
    isError: isAssignmentsError,
  } = useAdminAssignments();

  const {
    data: attemptsResponse,
    isFetching: isAttemptsFetching,
    isError: isAttemptsError,
    refetch,
  } = useAdminAttempts({
    assignmentId,
    userSearch: debouncedUserSearch.trim() ? debouncedUserSearch.trim() : undefined,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const isInitialAttemptsLoading =
    Boolean(selectedAssignmentId) && isAttemptsFetching && !attemptsResponse;
  const isRefreshingAttempts =
    Boolean(selectedAssignmentId) && isAttemptsFetching && Boolean(attemptsResponse);

  const retryMutation = useMutation({
    mutationFn: (attemptId: number) => AttemptAdminService.retryAttempt(attemptId),
    onMutate: (attemptId) => {
      setRetryingAttemptId(attemptId);
    },
    onSuccess: () => {
      toast({
        title: "Reexecução enviada",
        description: "A tentativa foi enviada novamente para fila de execução.",
      });
      refetch();
    },
    onError: (error: unknown) => {
      const description =
        error instanceof Error ? error.message : "Não foi possível reexecutar a tentativa.";

      toast({
        title: "Erro ao reexecutar",
        description,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setRetryingAttemptId(null);
    },
  });

  const selectedAssignment = useMemo(() => {
    return assignments?.find((assignment) => assignment.id === assignmentId);
  }, [assignmentId, assignments]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedUserSearch(userSearch);
    }, 300);

    return () => clearTimeout(timeout);
  }, [userSearch]);

  useEffect(() => {
    if (!isInitialAttemptsLoading) {
      setShowInitialLoader(false);
      return;
    }

    const timeout = setTimeout(() => {
      setShowInitialLoader(true);
    }, 300);

    return () => clearTimeout(timeout);
  }, [isInitialAttemptsLoading]);

  useEffect(() => {
    if (!isRefreshingAttempts) {
      setShowRefreshingIndicator(false);
      return;
    }

    const timeout = setTimeout(() => {
      setShowRefreshingIndicator(true);
    }, 300);

    return () => clearTimeout(timeout);
  }, [isRefreshingAttempts]);

  useEffect(() => {
    if (hasAppliedInitialParams.current) {
      return;
    }

    const initialAssignmentId = searchParams.get("assignmentId");
    const initialUserSearch = searchParams.get("userSearch");

    if (initialAssignmentId) {
      setSelectedAssignmentId(initialAssignmentId);
    }

    if (initialUserSearch) {
      setUserSearch(initialUserSearch);
      setDebouncedUserSearch(initialUserSearch);
    }

    hasAppliedInitialParams.current = true;
  }, [searchParams]);

  useEffect(() => {
    const shouldOpenLatest = searchParams.get("openLatest") === "1";
    if (!shouldOpenLatest || hasAutoExpandedLatest.current) {
      return;
    }

    const firstAttempt = attemptsResponse?.data?.[0];
    if (!firstAttempt) {
      return;
    }

    setExpandedAttemptIds(new Set([firstAttempt.id]));
    hasAutoExpandedLatest.current = true;
  }, [attemptsResponse, searchParams]);

  const handleAssignmentChange = (value: string) => {
    setSelectedAssignmentId(value);
    setPage(1);
    setExpandedAttemptIds(new Set());
  };

  const handleSearchChange = (value: string) => {
    setUserSearch(value);
    setPage(1);
  };

  const handleToggleExpand = (attemptId: number) => {
    setExpandedAttemptIds((current) => {
      const next = new Set(current);
      if (next.has(attemptId)) {
        next.delete(attemptId);
      } else {
        next.add(attemptId);
      }
      return next;
    });
  };

  if (isAssignmentsFetching) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">Tentativas de testes</h1>
        <p className="mt-2 text-sm text-slate-400">
          Selecione uma atividade para listar as tentativas, analisar detalhes e reexecutar testes.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-800/80 p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-[1.2fr_1fr_auto] md:items-end">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Filtrar por atividade
            </p>
            <Select value={selectedAssignmentId} onValueChange={handleAssignmentChange}>
              <SelectTrigger className="border-slate-700 bg-slate-950 text-slate-100">
                <SelectValue placeholder="Selecione uma atividade" />
              </SelectTrigger>
              <SelectContent>
                {(assignments ?? []).map((assignment) => (
                  <SelectItem key={assignment.id} value={String(assignment.id)}>
                    {assignment.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Buscar usuário
            </p>
            <Input
              value={userSearch}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Buscar por e-mail ou ID"
              className="border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500"
              disabled={!selectedAssignmentId}
            />
          </div>

          <Button
            variant="outline"
            className="border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-800"
            onClick={() => refetch()}
            disabled={!selectedAssignmentId || isAttemptsFetching}
          >
            <RefreshCcw className={`mr-2 h-4 w-4 ${isAttemptsFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        {selectedAssignment && (
          <p className="mt-3 text-xs text-slate-400">
            Atividade selecionada: <span className="text-slate-200">{selectedAssignment.title}</span>
          </p>
        )}

        {showRefreshingIndicator && (
          <p className="mt-2 text-xs text-slate-400">Atualizando tentativas...</p>
        )}
      </section>

      {isAssignmentsError && (
        <div className="rounded-md border border-red-800 bg-red-950/40 p-4 text-sm text-red-200">
          Não foi possível carregar atividades para o filtro.
        </div>
      )}

      {!selectedAssignmentId && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center text-slate-400">
          Selecione uma atividade para carregar as tentativas.
        </div>
      )}

      {showInitialLoader && <Loader />}

      {selectedAssignmentId && isAttemptsError && !isAttemptsFetching && (
        <div className="rounded-md border border-red-800 bg-red-950/40 p-4 text-sm text-red-200">
          Não foi possível carregar as tentativas para esta atividade.
        </div>
      )}

      {selectedAssignmentId && attemptsResponse && (
        <AdminAttemptsTable
          attempts={attemptsResponse.data}
          page={attemptsResponse.meta.page}
          pageSize={attemptsResponse.meta.pageSize}
          total={attemptsResponse.meta.total}
          totalPages={attemptsResponse.meta.totalPages}
          expandedAttemptIds={expandedAttemptIds}
          retryingAttemptId={retryingAttemptId}
          onToggleExpand={handleToggleExpand}
          onRetry={(attemptId) => retryMutation.mutate(attemptId)}
          onPageChange={(nextPage) => {
            setPage(nextPage);
            setExpandedAttemptIds(new Set());
          }}
        />
      )}
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
