import { registerWorkspaceRuntime } from "./runtime";
import { applyPythonIntellisense, disposePythonIntellisense } from "../python/pyodide-client";
import { applyLanguageDefaults } from "../intellisense/compiler";
import { WorkerType } from "@/app/interface/scheduler-api/worker";
import type { FileNode } from "@/types/shared";

jest.mock("../python/pyodide-client", () => ({ applyPythonIntellisense: jest.fn(), disposePythonIntellisense: jest.fn() }));
jest.mock("../intellisense/compiler", () => ({ applyLanguageDefaults: jest.fn() }));
jest.mock("../intellisense/type-packs", () => ({ applyTypePack: jest.fn(), clearTypePacks: jest.fn() }));
jest.mock("./models", () => ({
  syncWorkspaceModels: jest.fn(), disposeWorkspaceModels: jest.fn(), workspaceModelPath: (path: string) => `file:///${path}`,
}));

it("isolates Python, refreshes files for the same worker type, and cleans up the last registration", () => {
  const parse = (path: string) => ({ toString: () => encodeURI(path) });
  const model = { uri: parse("file:///funções básicas.py") };
  const other = { uri: parse("file:///unrelated.py") };
  const monaco = {
    Uri: { parse },
    editor: { getModels: () => [model, other] },
    languages: { registerCompletionItemProvider: () => ({ dispose: jest.fn() }) },
  } as unknown as typeof import("monaco-editor");
  const tree: FileNode = { id: "file", path: "funções básicas.py", isSelectable: true, isFile: true, content: "print(1)" };
  const config = { tree, activePath: tree.path, workerType: WorkerType.NODE_DEFAULT };
  const first = registerWorkspaceRuntime(monaco, config);
  expect(applyPythonIntellisense).not.toHaveBeenCalled();
  expect(applyLanguageDefaults).toHaveBeenCalledWith(monaco, WorkerType.NODE_DEFAULT);
  first.update({ ...config, workerType: WorkerType.PYTHON_DEFAULT });
  expect(applyPythonIntellisense).toHaveBeenLastCalledWith(monaco, [model]);
  first.update({ ...config, workerType: WorkerType.PYTHON_DEFAULT });
  expect(applyPythonIntellisense).toHaveBeenCalledTimes(2);
  const second = registerWorkspaceRuntime(monaco, { ...config, workerType: WorkerType.PYTHON_DEFAULT });
  jest.mocked(disposePythonIntellisense).mockClear();
  first.dispose();
  expect(disposePythonIntellisense).not.toHaveBeenCalled();
  second.dispose();
  expect(disposePythonIntellisense).toHaveBeenCalledTimes(1);
});
