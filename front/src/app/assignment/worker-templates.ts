import { FileNode } from "@/types/shared";

export const DEFAULT_FILE_NODE: FileNode = {
  id: "src",
  label: "src",
  isFile: false,
  children: [
    {
      id: "index.ts",
      label: "index.ts",
      isFile: true,
      isSelectable: true,
      content: `console.log('Hello, World!');`,
      path: "src/index.ts",
    },
  ],
  isSelectable: false,
  path: "src",
}