"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { AssignmentService } from "@/app/integration/scheduler-api/assignment";
import { AttemptAdminService } from "@/app/integration/scheduler-api/attempt";
import { ExamService } from "@/app/integration/scheduler-api/exam";
import { usePaginatedSearch } from "@/hooks/use-paginated-search";
import { usePaginatedExamStudents } from "@/hooks/use-paginated-exam-students";
import { AssignmentSummary } from "@/app/interface/scheduler-api/exam";
import { ExamStudentGrades } from "@/app/interface/scheduler-api/exam-student-grades";
import { Assignment } from "@/app/interface/scheduler-api/assignment";
import { toast } from "@/hooks/use-toast";

interface UseExamDetailsDataParams {
  examId: number;
  classId: number;
}

export function useExamDetailsData({ examId, classId }: UseExamDetailsDataParams) {
  const queryClient = useQueryClient();

  const studentsPagination = usePaginatedSearch();
  const {
    page: studentsPage,
    search: studentsSearch,
    debouncedSearch: debouncedStudentsSearch,
    setPage: setStudentsPage,
    setSearch: setStudentsSearch,
  } = studentsPagination;

  const {
    data: studentsData,
    isFetching: isStudentsFetching,
    isError: isStudentsError,
    error: studentsError,
    refetch: refetchStudents,
  } = usePaginatedExamStudents({
    examId,
    page: studentsPage,
    search: debouncedStudentsSearch,
  });

  const [selectedStudent, setSelectedStudent] = useState<ExamStudentGrades | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<number | null>(null);

  const handleViewStudentDetails = (student: ExamStudentGrades) => {
    setSelectedStudent(student);
    setIsDetailsOpen(true);
    setExpandedAssignmentId(null);
  };

  const handleToggleExpandAssignment = (assignmentId: number) => {
    setExpandedAssignmentId((current) => (current === assignmentId ? null : assignmentId));
  };

  const [retryingAssignmentId, setRetryingAssignmentId] = useState<number | null>(null);

  const { mutateAsync: retryAttempt } = useMutation({
    mutationFn: (attemptId: number) => AttemptAdminService.retryAttempt(attemptId),
    onMutate: (attemptId) => {
      setRetryingAssignmentId(attemptId);
    },
    onSuccess: () => {
      toast({
        title: "Reexecução enviada",
        description: "A tentativa foi enviada para a fila de execução.",
      });
      void refetchStudents();
    },
    onError: (err: unknown) => {
      const description =
        err instanceof Error ? err.message : "Não foi possível reexecutar a tentativa.";
      toast({
        title: "Erro ao reexecutar",
        description,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setRetryingAssignmentId(null);
    },
  });

  const handleRetry = (attemptId: number) => {
    void retryAttempt(attemptId);
  };

  const { mutateAsync: deleteAssignment } = useMutation({
    mutationFn: AssignmentService.DeleteAssignment,
    onSuccess: () => {
      toast({
        title: "Atividade excluída",
        description: "A atividade foi removida com sucesso.",
        duration: 4000,
      });
      queryClient.invalidateQueries({
        queryKey: ["exam", examId],
      });
    },
    onError: (err: AxiosError) => {
      const res = err.response?.data as { message: string };
      toast({
        title: "Não foi possível excluir a atividade",
        description: res?.message || "Tente novamente mais tarde.",
        variant: "destructive",
        duration: 5000,
      });
      throw err;
    },
  });

  const handleDeleteAssignment = (assignment: AssignmentSummary) => {
    void deleteAssignment(assignment.id);
  };

  const { mutateAsync: unlinkAssignmentMutation } = useMutation({
    mutationFn: ({
      examId,
      assignmentId,
    }: {
      examId: number;
      assignmentId: number;
    }) => ExamService.unlinkAssignment(examId, assignmentId),
    onSuccess: () => {
      toast({
        title: "Atividade desvinculada",
        description: "A atividade foi removida desta prova.",
        duration: 4000,
      });
      queryClient.invalidateQueries({ queryKey: ["exam", examId] });
    },
    onError: (err: AxiosError) => {
      const res = err.response?.data as { message: string };
      toast({
        title: "Não foi possível desvincular a atividade",
        description: res?.message || "Tente novamente mais tarde.",
        variant: "destructive",
        duration: 5000,
      });
      throw err;
    },
  });

  const handleUnlinkAssignment = (assignment: AssignmentSummary) => {
    void unlinkAssignmentMutation({
      examId,
      assignmentId: assignment.id,
    });
  };

  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [linkPendingId, setLinkPendingId] = useState<number | null>(null);
  const [scoresByAssignmentId, setScoresByAssignmentId] = useState<
    Record<number, string>
  >({});
  const [linkError, setLinkError] = useState<string | null>(null);

  const [editingAssignment, setEditingAssignment] = useState<AssignmentSummary | null>(null);
  const [editScoreValue, setEditScoreValue] = useState("");
  const [editScoreError, setEditScoreError] = useState<string | null>(null);

  const { mutateAsync: updateScoreMutation, isPending: isUpdatingScore } =
    useMutation({
      mutationFn: ({
        examId,
        assignmentId,
        score,
      }: {
        examId: number;
        assignmentId: number;
        score: number;
      }) => ExamService.updateAssignmentScore(examId, assignmentId, score),
      onSuccess: () => {
        toast({
          title: "Pontuação atualizada",
          description: "A pontuação da atividade foi alterada com sucesso.",
          duration: 4000,
        });
        queryClient.invalidateQueries({ queryKey: ["exam", examId] });
        setEditingAssignment(null);
        setEditScoreValue("");
        setEditScoreError(null);
      },
      onError: (err: AxiosError) => {
        const res = err.response?.data as { message: string };
        const msg = res?.message || "Tente novamente mais tarde.";
        setEditScoreError(msg);
        toast({
          title: "Não foi possível atualizar a pontuação",
          description: msg,
          variant: "destructive",
          duration: 5000,
        });
      },
    });

  const {
    data: linkableAssignments,
    isFetching: isLinkableFetching,
    isError: isLinkableError,
    error: linkableError,
    refetch: refetchLinkable,
  } = useQuery<Assignment[]>({
    queryKey: ["linkable-assignments", classId],
    queryFn: () => AssignmentService.getLinkableByClassId(classId),
    enabled: isLinkOpen && Number.isFinite(classId),
    refetchOnWindowFocus: false,
  });

  const { mutateAsync: linkAssignmentMutation } = useMutation({
    mutationFn: ({
      examId,
      assignmentId,
      score,
    }: {
      examId: number;
      assignmentId: number;
      score: number;
    }) => ExamService.linkAssignment(examId, assignmentId, score),
    onSuccess: () => {
      toast({
        title: "Atividade vinculada",
        description: "A atividade foi vinculada à prova com sucesso.",
        duration: 4000,
      });
      queryClient.invalidateQueries({ queryKey: ["exam", examId] });
      queryClient.invalidateQueries({
        queryKey: ["linkable-assignments", classId],
      });
      setIsLinkOpen(false);
      setLinkPendingId(null);
    },
    onError: (err: AxiosError) => {
      const res = err.response?.data as { message: string };
      const msg = res?.message || "Tente novamente mais tarde.";
      setLinkError(msg);
      toast({
        title: "Não foi possível vincular a atividade",
        description: msg,
        variant: "destructive",
        duration: 5000,
      });
      setLinkPendingId(null);
      void refetchLinkable();
    },
  });

  const isValidScore = (raw: string | undefined) => {
    if (!raw || raw.trim() === "") return false;
    const num = Number(raw);
    return Number.isFinite(num) && num > 0;
  };

  const handleEditScoreRequest = (assignment: AssignmentSummary) => {
    setEditScoreValue(String(Number(assignment.score).toFixed(2)));
    setEditScoreError(null);
    setEditingAssignment(assignment);
  };

  const handleSaveScore = () => {
    if (!editingAssignment) return;
    const raw = editScoreValue.trim();
    if (!isValidScore(raw)) {
      setEditScoreError("A pontuação deve ser um número positivo.");
      return;
    }
    setEditScoreError(null);
    void updateScoreMutation({
      examId,
      assignmentId: editingAssignment.id,
      score: Number(raw),
    });
  };

  const handleLinkAssignment = (assignment: Assignment) => {
    const raw = scoresByAssignmentId[assignment.id];
    if (!isValidScore(raw)) return;
    setLinkError(null);
    setLinkPendingId(assignment.id);
    void linkAssignmentMutation({
      examId,
      assignmentId: assignment.id,
      score: Number(raw),
    });
  };

  const linkableErrorMessage = isLinkableError
    ? linkableError instanceof AxiosError
      ? (
          (linkableError.response?.data as { message?: string })?.message ??
          "Erro ao buscar atividades disponíveis."
        )
      : "Erro ao buscar atividades disponíveis."
    : null;

  return {
    students: {
    data: studentsData,
    isFetching: isStudentsFetching,
    isError: isStudentsError,
      error: studentsError,
      refetch: refetchStudents,
      page: studentsPage,
      search: studentsSearch,
      debouncedSearch: debouncedStudentsSearch,
      setPage: setStudentsPage,
      setSearch: setStudentsSearch,
    },
    retry: {
      retryAttempt: handleRetry,
      retryingAssignmentId,
    },
    details: {
      selectedStudent,
      isDetailsOpen,
      setIsDetailsOpen,
      expandedAssignmentId,
      handleViewStudentDetails,
      handleToggleExpandAssignment,
    },
    activities: {
      deleteAssignment: handleDeleteAssignment,
      unlinkAssignment: handleUnlinkAssignment,
    },
    editScore: {
      editing: editingAssignment,
      setEditing: setEditingAssignment,
      value: editScoreValue,
      setValue: setEditScoreValue,
      error: editScoreError,
      setError: setEditScoreError,
      isUpdating: isUpdatingScore,
      save: handleSaveScore,
      request: handleEditScoreRequest,
    },
    link: {
      open: isLinkOpen,
      setOpen: (open: boolean) => {
        setIsLinkOpen(open);
        if (!open) {
          setLinkPendingId(null);
          setScoresByAssignmentId({});
          setLinkError(null);
        }
      },
      pendingId: linkPendingId,
      scores: scoresByAssignmentId,
      setScore: (assignmentId: number, value: string) => {
        setScoresByAssignmentId((prev) => ({
          ...prev,
          [assignmentId]: value,
        }));
        setLinkError(null);
      },
      error: linkError,
      errorMessage: linkableErrorMessage,
      isLoading: isLinkableFetching,
      items: linkableAssignments,
      link: handleLinkAssignment,
      isValidScore,
    },
  };
}
