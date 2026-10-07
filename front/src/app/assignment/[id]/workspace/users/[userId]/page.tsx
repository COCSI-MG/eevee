"use client";

import WorkspaceHeader from "@/app/assignment/[id]/workspace/_components/workspace-header";
import WorkspaceReadonlyExplorer from "@/app/assignment/[id]/workspace/_components/workspace-readonly-explorer";
import WorkspaceShell from "@/app/assignment/[id]/workspace/_components/workspace-shell";
import { createImportedWorkspaceTree } from "@/app/assignment/[id]/workspace/_utils/workspace.utils";
import { findNodeByPath } from "@/app/assignment/[id]/workspace/_utils/workspace-tree.utils";
import { useWorkspaceContext } from "@/app/assignment/[id]/workspace/_providers/workspace-provider";
import { AttemptAdminService } from "@/app/integration/scheduler-api/attempt";
import { Assignment } from "@/app/interface/scheduler-api/assignment";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/hooks/use-auth-context";
import { FileNode } from "@/types/shared";
import { createZip } from "@/utils/create-zip";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function SubmittedWorkPage() {
  const params = useParams<{ id: string; userId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthContext();
  const { replaceFileTree, selectItem, selectedItem, fileTreeData } = useWorkspaceContext();
  const assignmentId = Number(params.id);
  const userId = Number(params.userId);
  const attemptId = Number(searchParams.get("attemptId"));
  const enabled = Boolean(user?.isAdmin && assignmentId > 0 && userId > 0 && attemptId > 0);
  const [secondaryPath, setSecondaryPath] = useState<string | null>(null);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["adminSubmittedWork", assignmentId, userId, attemptId],
    queryFn: () => AttemptAdminService.getSubmittedWork(assignmentId, userId, attemptId),
    enabled,
    refetchOnWindowFocus: false
  });

  const assignment = useMemo(() => {
    if (!data) return null;
    return {
      id: data.assignment.id,
      classId: 0,
      title: data.assignment.title,
      description: data.assignment.description,
      maxAttempts: 0,
      workerType: data.assignment.workerType,
      workerDefinition: { files: null, startCommands: [], testCommands: [], dependencies: [] },
      assignmentAttempts: [],
      assignmentTemplates: [],
      assignmentParams: [],
      answerKeyVisible: false
    } as unknown as Assignment;
  }, [data]);

  const fileTree = useMemo(() => {
    if (!data || !assignment) return null;

    const emptyTree: FileNode = {
      id: "src",
      path: "src",
      isFile: false,
      isSelectable: false,
      children: []
    };

    return createImportedWorkspaceTree(data.files, emptyTree, assignment);
  }, [assignment, data]);

  useEffect(() => {
    if (!fileTree) return;

    replaceFileTree(fileTree);

    const firstFile = findFirstFile(fileTree);

    if (firstFile) selectItem({ id: firstFile.id, type: "file", path: firstFile.path });
  }, [fileTree, replaceFileTree, selectItem]);

  const activeFile = useMemo(() => {
    const node = findNodeByPath(fileTreeData, selectedItem.path);

    if (!node?.isFile) return null;

    return {
      name: node.id,
      path: node.path,
      language: node.id.split(".").pop() || "",
      value: node.content || ""
    };
  }, [fileTreeData, selectedItem.path]);

  const secondaryFile = useMemo(() => {
    if (!secondaryPath) return null;

    const node = findNodeByPath(fileTreeData, secondaryPath);

    if (!node?.isFile) return null;

    return {
      name: node.id,
      path: node.path,
      language: node.id.split(".").pop() || "",
      value: node.content || ""
    };
  }, [fileTreeData, secondaryPath]);

  const handleDownload = () => {
    if (!data) return;
    const url = URL.createObjectURL(createZip(data.files));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `assignment-${assignmentId}-user-${userId}-attempt-${attemptId}-code.zip`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (!user?.isAdmin) {
    return <div className="p-8 text-destructive">Apenas administradores podem visualizar este código.</div>;
  }

  if (isPending) return <Loader />;

  if (isError || !data || !assignment) {
    return (
      <div className="space-y-4 p-8">
        <p className="text-destructive">{error instanceof Error ? error.message : "Não foi possível carregar o código enviado."}</p>
        <Button variant="outline" onClick={() => router.back()}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen min-h-0 flex-col text-foreground">
      <WorkspaceHeader
        assignment={assignment}
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownload}
          >
            Baixar código
          </Button>
        }
      />
      <WorkspaceShell
        explorer={
          <WorkspaceReadonlyExplorer
            treeData={fileTreeData}
            selectedItem={selectedItem}
            onFileSelect={(node) => selectItem({ id: node.id, type: "file", path: node.path })}
            onSelectItem={selectItem}
            onOpenInSecondary={(node) => setSecondaryPath(node.path)}
          />
        }
        activeFile={activeFile}
        secondaryFile={secondaryFile}
        onEditorChange={() => undefined}
        onSecondaryEditorChange={() => undefined}
        editorActionGuardMode="exempt"
        editorReadOnly
      />
    </div>
  );
}

function findFirstFile(node: FileNode): FileNode | null {
  if (node.isFile) return node;

  for (const child of node.children ?? []) {
    const file = findFirstFile(child);

    if (file) return file;
  }

  return null;
}
