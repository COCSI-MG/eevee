import Workspace from "@/components/workspace/workspace";
import { WorkspaceProvider } from "@/components/workspace/worskpace-provider";
import { SelectedItem } from "@/types/shared";

export default function Page() {
  const initialSelectedItem: SelectedItem = {
    id: "2",
    name: "index.js",
    type: "file",
    path: "src/index.js",
  };

  return (
    <WorkspaceProvider initialSelectedItem={initialSelectedItem}>
      <Workspace />
    </WorkspaceProvider>
  );
}
