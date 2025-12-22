import { FileNode } from "@/types/shared";
import { WorkerType } from "@/app/interface/scheduler-api/worker";

export const WORKER_FILE_BASE_NODE: Record<WorkerType, FileNode> = {
  [WorkerType.NODE_DEFAULT]: {
    id: "1",
    label: "src",
    isSelectable: true,
    isFile: false,
    children: [
      {
        id: "2",
        label: "index.ts",
        isSelectable: true,
        isFile: true,
        path: "src/index.ts",
      },
    ],
    path: "src",
  },

  [WorkerType.NODE_NESTJS]: {
    id: "1",
    label: "src",
    isSelectable: true,
    isFile: false,
    children: [
      {
        id: "2",
        label: "app.module.ts",
        isSelectable: true,
        isFile: true,
        path: "src/app.module.ts",
      },
      {
        id: "3",
        label: "main.ts",
        isSelectable: true,
        isFile: true,
        path: "src/main.ts",
      },
      {
        id: "4",
        label: "app.controller.ts",
        isSelectable: true,
        isFile: true,
        path: "src/app.controller.ts",
      },
      {
        id: "5",
        label: "app.service.ts",
        isSelectable: true,
        isFile: true,
        path: "src/app.service.ts",
      },
    ],
    path: "src",
  },

  [WorkerType.REACTJS_CYPRESS]: {
    id: "1",
    label: "src",
    isSelectable: true,
    isFile: false,
    children: [
      {
        id: "2",
        label: "App.tsx",
        isSelectable: true,
        isFile: true,
        path: "src/App.tsx",
        content: `import "./App.css";
function App() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Mock Page for Testing</h1>
      <p>Test page</p>
      <input type="text" id="test-input" placeholder="Enter some text" />
      <button id="test-button" onClick={() => alert("Mock button clicked!")}>
        Click Me
      </button>
      <div
        id="message-area"
        style={{ marginTop: "10px", border: "1px solid #ccc", padding: "10px" }}
      >
        Messages will appear here.
      </div>
    </div>
  );
}

export default App;
`,
      },
      {
        id: "3",
        label: "main.tsx",
        isSelectable: true,
        isFile: true,
        path: "src/main.tsx",
        content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`,
      },
    ],
    path: "src",
  },

  [WorkerType.NODE_NEXTJS_CYPRESS]: {
    id: "1",
    label: "src",
    isSelectable: true,
    isFile: false,
    children: [
      {
        id: "2",
        label: "app",
        isSelectable: true,
        isFile: false,
        children: [
          {
            id: "3",
            label: "page.tsx",
            isSelectable: true,
            isFile: true,
            path: "src/app/page.tsx",
          },
        ],
        path: "src/app",
      },
    ],
    path: "src",
  },

  [WorkerType.NODE_GRPCJS]: {
    id: "1",
    label: "src",
    isSelectable: true,
    isFile: false,
    children: [
      {
        id: "2",
        label: "index.ts",
        isSelectable: true,
        isFile: true,
        content: `import * as grpc from '@grpc/grpc-js'`,
        path: "src/index.ts",
      },
    ],
    path: "src",
  },
};