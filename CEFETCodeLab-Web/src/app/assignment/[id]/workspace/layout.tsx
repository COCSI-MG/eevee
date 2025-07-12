import { WorkspaceProvider } from "@/app/provider/workspace-provider";

export default function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <WorkspaceProvider>
      <div className="flex flex-col h-screen bg-slate-900 text-white">
        {children}
      </div>
    </WorkspaceProvider>
  );
}
