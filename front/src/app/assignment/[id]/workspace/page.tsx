"use client";

import { getFileTree } from "@/app/integration/filestash";
import FileSaverService from "@/app/integration/scheduler-api/file-saver";
import { SchedulingService } from "@/app/integration/scheduler-api/scheduling";
import { Assignment } from "@/app/interface/scheduler-api/assignment";
import { Route } from "@/app/routes";
import WorkspaceHeader from "@/components/workspace/header";
import Workspace from "@/components/workspace/workspace";
import WorkspaceAgreement from "@/components/workspace/workspace-agreement";
import { WorkspaceLoading } from "@/components/workspace/workspace-loading";
import { useWorkspaceContext } from "@/components/workspace/workspace-provider";
import { WorkspaceSuspension } from "@/components/workspace/workspace-suspension";
import { useFetchAssignment } from "@/hooks/use-assignments";
import { useAuthContext } from "@/hooks/use-auth-context";
import { useFetchFileContent } from "@/hooks/use-filestash";
import { toast } from "@/hooks/use-toast";
import { FileNode } from "@/types/shared";
import { useMutation } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { SchedulingResponse } from "@/app/interface/scheduler-api/scheduling";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Page() {
  const { id } = useParams();
  const { back, push } = useRouter();
  const { user } = useAuthContext();
  const { selectedItem } = useWorkspaceContext();
  const { mutateAsync: fetchFileContent } = useFetchFileContent();

  const { data: assignmentData, isLoading: isLoadingAssignment } =
    useFetchAssignment(Number(id));

  // Estado para controlar se o usuário aceitou o acordo
  const [hasAcceptedAgreement, setHasAcceptedAgreement] =
    useState<boolean>(false);
  const [lastRunResult, setLastRunResult] = useState<SchedulingResponse | null>(
    null,
  );

  const buildSchedulingPayload = async () => {
    if (!assignmentData?.id || !user?.id || !selectedItem.path) {
      return Promise.reject("Missing required data");
    }

    const flattenFileTreeToSchedulingFiles = (
      node: FileNode,
      acc: Record<string, string> = {},
    ): Record<string, string> => {
      if (node.isFile) {
        acc[node.path] = node.content ?? "";
        return acc;
      }

      if (node.children?.length) {
        node.children.forEach((child) => {
          flattenFileTreeToSchedulingFiles(child, acc);
        });
      }

      return acc;
    };

    const fileTree = await getFileTree(assignmentData.id, user.id);
    if (!fileTree) {
      return Promise.reject("File tree not found");
    }

    const schedulingFiles = flattenFileTreeToSchedulingFiles(fileTree);

    return {
      assignmentId: assignmentData.id,
      applicationFileContent: undefined,
      files: schedulingFiles,
    };
  };

  const { mutate: runAssignment, isPending: isRunningSync } = useMutation({
    mutationKey: ["run-assignment-sync"],
    mutationFn: async () => {
      const payload = await buildSchedulingPayload();
      return SchedulingService.createScheduling(payload);
    },
    onError: (error) => {
      console.error("Error running assignment", error);
      toast({
        title: "Ocorreu um erro ao executar os testes",
        variant: "destructive",
      });
    },
    onSuccess: (data) => {
      setLastRunResult(data);
      toast({
        title: "Execucao concluida",
        description: "O resultado do run foi atualizado no workspace.",
        variant: "default",
      });
    },
  });

  const { mutate: submitAssignment, isPending: isSubmittingCorrection } =
    useMutation({
    mutationKey: ["submit-assignment"],
    mutationFn: async () => {
      const payload = await buildSchedulingPayload();
      return SchedulingService.createSchedulingInBackground(payload);
    },
    onError: (error) => {
      console.error("Error submiting assignment", error);
      toast({
        title: "Ocorreu um erro ao submeter sua tarefa",
        variant: "destructive",
      });
    },
    onSuccess: (data) => {
      console.log(data);

      toast({
        title: "Seu trabalho foi recebido com sucesso e está sendo processado",
        variant: "default",
        duration: 5000,
      });

      if (user?.isAdmin) {
        const params = new URLSearchParams({
          assignmentId: String(assignmentData?.id ?? ""),
          userSearch: user.email,
          openLatest: "1",
        });

        push(`${Route.AdminAttempts}?${params.toString()}`);
      } else {
        back();
      }
    },
  });

  const { mutate: saveFileInServer, isPending: isSaving } = useMutation({
    mutationKey: ["save-file-in-saver"],
    mutationFn: async () => {
      if (!assignmentData?.id || !user?.id || !selectedItem.path) {
        return Promise.reject("Missing required data");
      }

      const fileContent = await fetchFileContent({
        assignmentId: assignmentData.id,
        userId: user.id,
        filePath: selectedItem.path,
      });

      if (fileContent == null) {
        return Promise.reject("File content is empty");
      }

      const file = new File([fileContent], selectedItem.id, {
        type: "text/plain",
      });
      return FileSaverService.uploadFileToServer(file, Number(id));
    },
  });

  const isUserSuspended = (assignmentData: Assignment) => {
    return assignmentData?.suspensions?.some(
      (suspension) => suspension.userId === user?.id,
    );
  };

  const handleAcceptAgreement = () => {
    setHasAcceptedAgreement(true);
  };

  // Loading state
  if (isLoadingAssignment && !assignmentData) {
    return <WorkspaceLoading />;
  }

  // Suspension check
  if (assignmentData && isUserSuspended(assignmentData)) {
    return <WorkspaceSuspension />;
  }

  // Agreement check - APENAS para não-admins que ainda não aceitaram
  if (user && !user.isAdmin && assignmentData && !hasAcceptedAgreement) {
    return (
      <WorkspaceAgreement
        title={assignmentData.title}
        onAccept={handleAcceptAgreement}
        assignmentId={assignmentData.id}
      />
    );
  }

  // Workspace principal (após aceitar ou se for admin)
  return (
    <>
      <WorkspaceHeader
        assignment={{
          title: assignmentData ? assignmentData.title : "",
          description: assignmentData ? assignmentData.description : "",
        }}
        onRunClick={() => runAssignment()}
        onSubmitClick={() => submitAssignment()}
        onSaveClick={() => saveFileInServer()}
        isRunningSync={isRunningSync}
        isSubmittingCorrection={isSubmittingCorrection}
        isSaving={isSaving}
      />

      {lastRunResult && (
        <div className="border-b border-slate-700 bg-slate-950/60 px-4 py-3">
          <Card className="border-slate-700 bg-slate-900 text-slate-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base">Last run result</CardTitle>
                <Badge
                  className={
                    lastRunResult.isAcceptable
                      ? "bg-green-600 text-white"
                      : "bg-red-600 text-white"
                  }
                >
                  {lastRunResult.isAcceptable ? "Accepted" : "Failed"}
                </Badge>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setLastRunResult(null)}
              >
                Fechar preview
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 text-sm md:grid-cols-3">
                <p>Score: {lastRunResult.score}</p>
                <p>Passes: {lastRunResult.passes}</p>
                <p>Fails: {lastRunResult.fails}</p>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-slate-200">Report</p>
                <pre className="max-h-64 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-slate-300 whitespace-pre-wrap">
                  {lastRunResult.report || "No report returned."}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {assignmentData && user && (
        <Workspace assignment={assignmentData} user={user} />
      )}
    </>
  );
}
