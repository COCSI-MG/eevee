"use client";

import React from "react";
import { AssignmentService } from "@/app/integration/scheduler-api/assignment";
import { Assignment } from "@/app/interface/scheduler-api/assignment";
import { AuthSession } from "@/app/interface/scheduler-api/auth";
import ConfirmationAlertDialog from "@/components/shared/confirmation-alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSaveFileTree } from "@/hooks/use-filestash";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useWorkspaceContext } from "../_providers/workspace-provider";
import {
  createImportedWorkspaceTree,
  findFirstFile,
} from "../_utils/workspace.utils";
import {
  getWorkspaceImportConfirmationMessages,
  WORKSPACE_IMPORT_TEXT,
} from "./workspace-import-control.constants";

interface WorkspaceImportControlProps {
  assignment: Assignment;
  user: AuthSession;
  isWorkspaceInitialized: boolean;
}

export default function WorkspaceImportControl({
  assignment,
  user,
  isWorkspaceInitialized,
}: WorkspaceImportControlProps) {

  const { fileTreeData, replaceFileTree, selectItem, clearSelection } = useWorkspaceContext();
  const { mutateAsync: saveFileTreeAsync } = useSaveFileTree();

  const [selectedSourceId, setSelectedSourceId] = React.useState("");
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

  const isVisible = Boolean(assignment.allowProjectImport && !user.isAdmin)

  const {
    data: sources = [],
    isLoading: isLoadingSources,
    isError: isSourcesError,
    refetch: refetchSources,
  } = useQuery({
    queryKey: ["assignment-import-sources", assignment.id, user.userId],
    queryFn: () => AssignmentService.GetImportSources(assignment.id),
    enabled: isVisible,
    refetchOnWindowFocus: false
  });

  const selectedSource = sources.find((source) => source.id === Number(selectedSourceId))

  const { mutate: importProject, isPending: isImporting } = useMutation({
    mutationKey: ["import-assignment-project", assignment.id],
    mutationFn: async () => {
      if (!selectedSource) throw new Error(WORKSPACE_IMPORT_TEXT.missingSourceError)

      const submittedProject = await AssignmentService.GetImportSource(assignment.id, selectedSource.id);

      const importedTree = createImportedWorkspaceTree(submittedProject.files, fileTreeData, assignment);

      await saveFileTreeAsync({
        assignmentId: assignment.id,
        userId: user.userId,
        fileTree: importedTree
      });

      replaceFileTree(importedTree);
      const firstFile = findFirstFile(importedTree)

      if (firstFile) {
        selectItem({
          id: firstFile.id,
          type: "file",
          path: firstFile.path
        })
      } else {
        clearSelection()
      }

      return submittedProject;
    },
    onSuccess: () => {
      setIsConfirmOpen(false);
      toast({
        title: WORKSPACE_IMPORT_TEXT.successToastTitle,
        description: WORKSPACE_IMPORT_TEXT.successToastDescription,
        duration: 7000
      });
    },
    onError: (error) => {
      console.error("Error importing workspace:", error);
      toast({
        title: WORKSPACE_IMPORT_TEXT.errorToastTitle,
        description: error instanceof Error ? error.message : WORKSPACE_IMPORT_TEXT.errorToastFallbackDescription,
        variant: "destructive"
      });
    },
  });

  if (!isVisible) return null;

  const controlsDisabled =
    !isWorkspaceInitialized || isLoadingSources || isImporting;

  return (
    <div className="shrink-0 space-y-2 border-b border-border p-3">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {WORKSPACE_IMPORT_TEXT.sectionTitle}
      </p>

      {isSourcesError ? (
        <div className="space-y-2">
          <p className="text-xs text-destructive">
            {WORKSPACE_IMPORT_TEXT.sourcesError}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => refetchSources()}
          >
            {WORKSPACE_IMPORT_TEXT.retryButton}
          </Button>
        </div>
      ) : (

        <>
          <Select
            value={selectedSourceId}
            onValueChange={setSelectedSourceId}
            disabled={controlsDisabled || sources.length === 0}
          >
            <SelectTrigger
              aria-label={WORKSPACE_IMPORT_TEXT.sourceSelectAriaLabel}
            >
              <SelectValue
                placeholder={
                  isLoadingSources
                    ? WORKSPACE_IMPORT_TEXT.loadingPlaceholder
                    : sources.length === 0
                      ? WORKSPACE_IMPORT_TEXT.emptyPlaceholder
                      : WORKSPACE_IMPORT_TEXT.selectPlaceholder
                }
              />
            </SelectTrigger>
            <SelectContent>

              {sources.map((source) => (
                <SelectItem key={source.id} value={String(source.id)}>
                  {source.title}
                </SelectItem>
              ))}

            </SelectContent>
          </Select>

          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full"
            disabled={controlsDisabled || !selectedSource}
            onClick={() => setIsConfirmOpen(true)}
          >
            <Download className="mr-1 h-4 w-4" />
            {WORKSPACE_IMPORT_TEXT.importButton}
          </Button>
        </>
      )}

      <ConfirmationAlertDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={WORKSPACE_IMPORT_TEXT.dialogTitle}
        messages={getWorkspaceImportConfirmationMessages(selectedSource?.title)}
        confirmLabel={WORKSPACE_IMPORT_TEXT.dialogConfirmLabel}
        pendingLabel={WORKSPACE_IMPORT_TEXT.dialogPendingLabel}
        isPending={isImporting}
        onConfirm={() => importProject()}
      />
    </div>
  );
}
