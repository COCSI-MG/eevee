"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpenCheck,
  FolderOpen,
  Loader2,
  Play,
  Save,
} from "lucide-react";
import WorkspaceExplorer from "@/app/assignment/[id]/workspace/_components/workspace-explorer";
import WorkspaceCodeEditor from "@/app/assignment/[id]/workspace/_components/workspace-code-editor";
import WorkspaceQuestionPanel from "@/app/assignment/[id]/workspace/_components/workspace-question-panel";
import {
  WorkspaceProvider,
  useWorkspaceContext,
} from "@/app/assignment/[id]/workspace/_providers/workspace-provider";
import { createInitialWorkspaceTree } from "@/app/assignment/[id]/workspace/_utils/workspace.utils";
import { useWorkspaceFileEditor } from "@/app/assignment/[id]/workspace/_hooks/use-workspace-file-editor";
import { AnswerKeyService } from "@/app/integration/scheduler-api/answer-key";
import { useFetchAssignment } from "@/hooks/use-assignments";
import { useAuthContext } from "@/hooks/use-auth-context";
import { useToast } from "@/hooks/use-toast";
import {
  AnswerKey,
  Assignment,
} from "@/app/interface/scheduler-api/assignment";
import { FileNode } from "@/types/shared";
import Loader from "@/components/loader";
import QueryErrorState from "@/components/shared/query-error-state";
import { Button } from "@/components/ui/button";
import { useWorskpaceResizing } from "@/hooks/use-workspace-resizing";
import { useAnswerKeyTest } from "@/hooks/use-answer-key-test";
import { EDITOR_ACTION_GUARD_MODE } from "@/constants/editor-action-guard";
import { AnswerKeyTestDialog } from "../_components/modals/answer-key-test-dialog";

function isFileNodeTree(value: unknown): value is FileNode {
  if (!value || typeof value !== "object") return false;

  const node = value as Partial<FileNode>;

  return (
    typeof node.id === "string" &&
    typeof node.path === "string" &&
    typeof node.isSelectable === "boolean"
  );
}

interface AnswerKeyEditorProps {
  assignmentId: number;
  isAdmin: boolean;
  assignment: Assignment;
  answerKey?: AnswerKey;
}

function AnswerKeyEditor({
  assignmentId,
  isAdmin,
  assignment,
  answerKey,
}: AnswerKeyEditorProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { explorerWidth, startResize } = useWorskpaceResizing();
  const [showExplorer, setShowExplorer] = React.useState(false);
  const [testDialogOpen, setTestDialogOpen] = React.useState(false);
  const { fileTreeData, selectedItem, selectItem, replaceFileTree } =
    useWorkspaceContext();
  const { activeFile, handleEditorChange, handleFileSelect } =
    useWorkspaceFileEditor({ selectedItem, selectItem });
  const answerKeyTest = useAnswerKeyTest();

  const handleRun = () => {
    answerKeyTest.reset();
    setTestDialogOpen(true);
    answerKeyTest.mutate({ assignment, fileTree: fileTreeData });
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      answerKey
        ? AnswerKeyService.UpdateAnswerKey(assignmentId, fileTreeData)
        : AnswerKeyService.CreateAnswerKey(assignmentId, fileTreeData),
    onSuccess: async () => {
      toast({
        title: answerKey ? "Gabarito atualizado" : "Gabarito criado",
        description: "A solução de referência foi salva com sucesso.",
      });

      await queryClient.invalidateQueries({
        queryKey: ["answer-key", assignmentId],
      });

      await queryClient.invalidateQueries({
        queryKey: ["assignment", assignmentId],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Não foi possível salvar o gabarito",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTreeChange = React.useCallback(
    (tree: FileNode) => replaceFileTree(tree),
    [replaceFileTree],
  );

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="flex min-h-16 items-center justify-between gap-4 border-b border-border px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => router.back()}
            aria-label="Voltar ao workspace"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <BookOpenCheck className="h-4 w-4 shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                Gabarito
              </span>
            </div>
            <h1 className="truncate text-sm font-semibold text-foreground sm:text-base">
              {assignment.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground sm:hidden"
            onClick={() => setShowExplorer((current) => !current)}
            aria-label="Mostrar arquivos do gabarito"
          >
            <FolderOpen className="h-5 w-5" />
          </Button>
          {isAdmin && (
            <Button
              onClick={handleRun}
              disabled={answerKeyTest.isPending || saveMutation.isPending}
              className="shrink-0 bg-success text-success-foreground hover:bg-success/90"
            >
              {answerKeyTest.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {answerKeyTest.isPending ? "Executando..." : "Executar"}
            </Button>
          )}
          {isAdmin && (
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="shrink-0 text-primary-foreground"
            >
              <Save className="mr-2 h-4 w-4" />
              {saveMutation.isPending ? "Salvando..." : "Salvar gabarito"}
            </Button>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside
          className={`${showExplorer ? "flex" : "hidden"} relative shrink-0 border-r border-border bg-background sm:flex`}
          style={{ width: explorerWidth }}
        >
          <WorkspaceExplorer
            onFileSelect={handleFileSelect}
            onTreeChange={handleTreeChange}
            readOnly={!isAdmin}
          />
          <div
            role="separator"
            aria-label="Redimensionar explorador"
            aria-orientation="vertical"
            className="absolute right-0 top-0 h-full w-1 cursor-ew-resize bg-transparent hover:bg-primary/40"
            onMouseDown={(event) => startResize("explorer", event)}
          />
        </aside>
        <section className="flex min-w-0 flex-1 flex-col">
          <WorkspaceQuestionPanel
            title="Solução de referência"
            description={assignment.description}
          />
          <div className="min-h-0 flex-1">
            <WorkspaceCodeEditor
              file={activeFile}
              onEditorChange={handleEditorChange}
              actionGuardMode={EDITOR_ACTION_GUARD_MODE.EXEMPT}
              readOnly={!isAdmin}
            />
          </div>
        </section>
      </div>

      <AnswerKeyTestDialog
        open={testDialogOpen}
        onOpenChange={setTestDialogOpen}
        isPending={answerKeyTest.isPending}
        data={answerKeyTest.data}
        error={answerKeyTest.error}
      />
    </div>
  );
}

export default function AnswerKeyPage() {
  const { id } = useParams();
  const { user } = useAuthContext();
  const assignmentId = Number(id);
  const isAdmin = Boolean(user?.isAdmin);
  const router = useRouter();

  const {
    data: assignment,
    isLoading: isLoadingAssignment,
    isError: isAssignmentError,
    refetch: refetchAssignment,
  } = useFetchAssignment(assignmentId);

  const answerKeyQuery = useQuery({
    queryKey: ["answer-key", assignmentId],
    queryFn: () => AnswerKeyService.GetAnswerKey(assignmentId),
    enabled: Number.isFinite(assignmentId) && Boolean(assignment),
    retry: false,
  });

  React.useEffect(() => {
    if (
      !isAdmin &&
      assignment &&
      (!assignment.answerKeyVisible || answerKeyQuery.isError)
    )
      router.replace("/classes");
  }, [answerKeyQuery.isError, assignment, isAdmin, router]);

  if (!user || isLoadingAssignment || (assignment && answerKeyQuery.isLoading))
    return <Loader />;

  if (!assignment || isAssignmentError) {
    return (
      <div className="p-6">
        <QueryErrorState
          title="Não foi possível carregar a atividade"
          description="A atividade necessária para abrir o gabarito não foi encontrada."
          onRetry={() => void refetchAssignment()}
          retryLabel="Tentar novamente"
          isRetrying={isLoadingAssignment}
        />
      </div>
    );
  }

  if (!isAdmin && (!assignment.answerKeyVisible || answerKeyQuery.isError)) {
    return null;
  }

  const persistedTree = isFileNodeTree(answerKeyQuery.data?.content)
    ? answerKeyQuery.data.content
    : undefined;

  const initialTree = persistedTree ?? createInitialWorkspaceTree(assignment);

  return (
    <WorkspaceProvider
      key={answerKeyQuery.data?.id ?? "new-answer-key"}
      initialFileTree={initialTree}
      enableSecurityGuards={false}
    >
      <AnswerKeyEditor
        assignmentId={assignmentId}
        isAdmin={isAdmin}
        assignment={assignment}
        answerKey={answerKeyQuery.data}
      />
    </WorkspaceProvider>
  );
}
