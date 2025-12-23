import { FileNode } from "@/types/shared";

export const DEFAULT_FILE_NODE: FileNode = {
  id: "src",
  isFile: false,
  children: [
    {
      id: "App.tsx",
      isFile: true,
      isSelectable: true,
      content: `console.log('Hello, World!');`,
      path: "src/App.tsx",
    },
  ],
  isSelectable: false,
  path: "src",
}