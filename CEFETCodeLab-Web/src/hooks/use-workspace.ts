import { WorkspaceContext } from "@/app/provider/workspace-provider"
import { useContext } from "react"

const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}

export { useWorkspace };