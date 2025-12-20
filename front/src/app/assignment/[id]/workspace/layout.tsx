import { WorkspaceProvider } from "@/components/workspace/workspace-provider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <div className="h-screen text-foreground flex flex-col">{children}</div>
    </WorkspaceProvider>
  );
}
