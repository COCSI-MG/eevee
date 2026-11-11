import type { SandboxSetup } from "@codesandbox/sandpack-client";

export type SandboxFiles = SandboxSetup["files"];

export interface PreviewEntry {
  kind: string;
  path: string;
  label: string;
}

interface PrepareEntryResponseInterface { 
  main: string; 
  template: SandboxSetup["template"] 
}

export interface PreviewStrategy {
  dependencies: NonNullable<SandboxSetup["dependencies"]>;
  devDependencies: NonNullable<SandboxSetup["devDependencies"]>;
  getEntries(source: Record<string, string>): PreviewEntry[];
  prepareEntry(entry: PreviewEntry, files: SandboxFiles, blockContextMenu: boolean): PrepareEntryResponseInterface;
}
