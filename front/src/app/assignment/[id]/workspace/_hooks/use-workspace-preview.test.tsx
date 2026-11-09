import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { onlineManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getFileTree } from "@/app/integration/filestash";
import { SchedulingService } from "@/app/integration/platform-api/scheduling";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { WorkspaceRunPreviewDialog } from "../_components/modals/workspace-run-preview-dialog";
import { runWorkspacePreflight } from "../_utils/workspace-preflight.utils";
import { createWorkspaceStorageKey } from "../_utils/workspace-scheduling.utils";
import { useWorkspacePreview } from "./use-workspace-preview";

jest.mock("@/app/integration/filestash", () => ({ getFileTree: jest.fn() }));
jest.mock("@/app/integration/platform-api/scheduling", () => ({
  SchedulingService: {
    createPreviewRun: jest.fn(),
    getPreviewRun: jest.fn(),
    cancelPreviewRun: jest.fn(),
  },
}));
jest.mock("../_utils/workspace-preflight.utils", () => ({ runWorkspacePreflight: jest.fn() }));
jest.mock("@/hooks/use-scheduling-realtime", () => ({ useSchedulingRealtimeEvent: jest.fn() }));
jest.mock("@/hooks/use-toast", () => ({ toast: jest.fn() }));

const run = { id: 5, assignmentId: 7, status: "running" as const, createdAt: "", updatedAt: "" };
const storageKey = createWorkspaceStorageKey("preview-run", 3, run.assignmentId);
const queryKey = ["preview-run", run.id];

function PreviewHarness({ showConflict = false }: { showConflict?: boolean }) {
  const preview = useWorkspacePreview({ assignmentId: run.assignmentId, userId: 3 });
  return (
    <>
      <button type="button" onClick={() => preview.runPreview()} disabled={preview.previewLoading}>
        Executar
      </button>
      <WorkspaceRunPreviewDialog
        open={preview.previewOpen}
        loading={preview.previewLoading}
        cancelling={preview.isCancellingPreviewRun}
        cancelled={preview.showCancelledFeedback}
        result={preview.previewResult}
        error={preview.previewError}
        onClose={preview.closePreview}
      />
      {showConflict && (
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogTitle>Versões diferentes do código</AlertDialogTitle>
            <AlertDialogDescription>Selecione a versão.</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}

let queryClient: QueryClient;

function workspace(showConflict = false) {
  return (
    <QueryClientProvider client={queryClient}>
      <PreviewHarness showConflict={showConflict} />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
  queryClient = new QueryClient();
  jest.mocked(getFileTree).mockResolvedValue({ id: "root", isSelectable: false, path: "", children: [] });
  jest.mocked(runWorkspacePreflight).mockResolvedValue({ ok: true });
  jest.mocked(SchedulingService.createPreviewRun).mockResolvedValue(run);
  jest.mocked(SchedulingService.getPreviewRun).mockResolvedValue(run);
});

afterEach(() => {
  cleanup();
  queryClient.clear();
  onlineManager.setOnline(true);
  window.localStorage.clear();
  document.body.style.pointerEvents = "";
  jest.restoreAllMocks();
});

it("unlocks the editor when creating the preview fails after opening the dialog", async () => {
  let rejectRequest!: (error: Error) => void;
  jest.mocked(SchedulingService.createPreviewRun).mockReturnValueOnce(
    new Promise((_, reject) => { rejectRequest = reject; }),
  );
  render(workspace());

  fireEvent.click(screen.getByRole("button", { name: "Executar" }));
  await screen.findByRole("dialog");
  expect(document.body.style.pointerEvents).toBe("none");
  await act(async () => rejectRequest(new Error("Storage unavailable")));

  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(document.body.style.pointerEvents).not.toBe("none");
  expect(screen.getByRole("button", { name: "Executar" })).toBeEnabled();
  expect(toast).toHaveBeenCalledWith(expect.objectContaining({ description: "Storage unavailable" }));
});

it("returns to the editor after failed cancellation and continues tracking the active run", async () => {
  jest.mocked(SchedulingService.cancelPreviewRun).mockRejectedValueOnce(new Error("Network unavailable"));
  render(workspace());

  fireEvent.click(screen.getByRole("button", { name: "Executar" }));
  await waitFor(() => expect(queryClient.getQueryData(queryKey)).toEqual(run));
  act(() => onlineManager.setOnline(false));
  fireEvent.click(screen.getByRole("button", { name: "Cancelar execução" }));

  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(document.body.style.pointerEvents).not.toBe("none");
  expect(window.localStorage.getItem(storageKey)).toBe(String(run.id));
  await act(async () => {
    queryClient.setQueryData(queryKey, { ...run, updatedAt: "later" });
  });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Executar" })).toBeDisabled();

  await act(async () => {
    queryClient.setQueryData(queryKey, { ...run, status: "failed" });
  });
  await waitFor(() => expect(screen.getByRole("button", { name: "Executar" })).toBeEnabled());
  expect(window.localStorage.getItem(storageKey)).toBeNull();
});

it("unlocks clicks when the preview request fails underneath a conflict dialog", async () => {
  let rejectRequest!: (error: Error) => void;
  jest.mocked(SchedulingService.getPreviewRun).mockReturnValueOnce(
    new Promise((_, reject) => { rejectRequest = reject; }),
  );
  const view = render(workspace());
  fireEvent.click(screen.getByRole("button", { name: "Executar" }));
  await screen.findByRole("dialog");
  await waitFor(() => expect(SchedulingService.getPreviewRun).toHaveBeenCalledWith(run.id));

  view.rerender(workspace(true));
  await screen.findByRole("alertdialog");
  await act(async () => rejectRequest(new Error("Preview request failed")));
  await waitFor(() => expect(screen.queryByText("Pré-visualização da execução")).not.toBeInTheDocument());
  expect(screen.getByRole("alertdialog")).toBeInTheDocument();

  view.rerender(workspace());
  expect(document.body.style.pointerEvents).not.toBe("none");
});
