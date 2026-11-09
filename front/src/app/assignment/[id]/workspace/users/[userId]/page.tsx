"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AttemptAdminService } from "@/app/integration/platform-api/attempt";
import { UserRole } from "@/app/interface/platform-api/user";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/hooks/use-auth-context";
import { createZip } from "@/utils/create-zip";
import WorkspaceReadonlyExplorer from "../../_components/workspace-readonly-explorer";
import WorkspaceShell from "../../_components/workspace-shell";
import { useWorkspaceFileEditor } from "../../_hooks/use-workspace-file-editor";
import { WorkspaceProvider, useWorkspaceContext } from "../../_providers/workspace-provider";
import { findNodeByPath, treeFromStorageFiles } from "../../_utils/workspace-tree.utils";
import { getFileLanguage } from "../../_utils/workspace.utils";

function SubmittedFiles() {
  const { fileTreeData, selectedItem, selectItem } = useWorkspaceContext();
  const { activeFile, handleFileSelect } = useWorkspaceFileEditor({ selectedItem, selectItem });
  const [isSplitView, setIsSplitView] = useState(false);
  const [secondaryPath, setSecondaryPath] = useState<string | null>(null);
  const secondaryNode = secondaryPath ? findNodeByPath(fileTreeData, secondaryPath) : null;
  const secondaryFile = secondaryNode?.isFile
    ? {
        name: secondaryNode.id,
        path: secondaryNode.path,
        language: getFileLanguage(secondaryNode.id),
        value: secondaryNode.content ?? "",
      }
    : null;
  return (
    <WorkspaceShell
      explorer={
        <WorkspaceReadonlyExplorer
          treeData={fileTreeData}
          selectedItem={selectedItem}
          onFileSelect={handleFileSelect}
          onSelectItem={selectItem}
          onOpenInSecondary={(node) => {
            setSecondaryPath(node.path);
            setIsSplitView(true);
          }}
        />
      }
      activeFile={activeFile}
      secondaryFile={secondaryFile}
      isSplitView={isSplitView}
      onSplitViewChange={setIsSplitView}
      onEditorChange={() => undefined}
      onSecondaryEditorChange={() => undefined}
      editorActionGuardMode="exempt"
      editorReadOnly
    />
  );
}

export default function SubmittedWorkPage() {
  const { id, userId: userParam } = useParams<{ id: string; userId: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const { user } = useAuthContext();
  const assignmentId = Number(id);
  const userId = Number(userParam);
  const attemptId = Number(search.get("attemptId"));
  const canView = user?.role === UserRole.TEACHER || user?.role === UserRole.ADMIN;
  const validIds = [assignmentId, userId, attemptId].every(
    (value) => Number.isSafeInteger(value) && value > 0,
  );
  const { data, isPending, error } = useQuery({
    queryKey: ["adminSubmittedWork", user?.userId, user?.role, assignmentId, userId, attemptId],
    queryFn: () => AttemptAdminService.getSubmittedWork(assignmentId, userId, attemptId),
    enabled: canView && validIds,
    refetchOnWindowFocus: false,
  });
  const tree = useMemo(() => data ? treeFromStorageFiles(data.files) : null, [data]);

  if (!canView) {
    return <p className="p-8 text-destructive">Apenas professores e administradores podem visualizar este código.</p>;
  }
  if (validIds && isPending) return <Loader />;
  if (!data || !tree) {
    return (
      <div className="space-y-4 p-8">
        <p className="text-destructive">
          {error?.message ?? "Não foi possível carregar o código enviado."}
        </p>
        <Button variant="outline" onClick={() => router.back()}>Voltar</Button>
      </div>
    );
  }

  const download = () => {
    const url = URL.createObjectURL(createZip(data.files));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `assignment-${assignmentId}-user-${userId}-attempt-${attemptId}-code.zip`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <div className="flex h-screen min-h-0 flex-col text-foreground">
      <header className="flex items-center gap-4 border-b border-border px-4 py-3">
        <Button variant="outline" onClick={() => router.back()}>Voltar</Button>
        <div className="mr-auto">
          <h1 className="font-semibold">{data.assignment.title}</h1>
          <p className="text-sm text-muted-foreground">{data.user.name} · Tentativa #{data.attempt}</p>
        </div>
        <Button variant="outline" onClick={download}>Baixar código</Button>
      </header>
      <WorkspaceProvider
        key={`${assignmentId}:${userId}:${attemptId}`}
        initialFileTree={tree}
        enableSecurityGuards={false}
      >
        <SubmittedFiles />
      </WorkspaceProvider>
    </div>
  );
}
