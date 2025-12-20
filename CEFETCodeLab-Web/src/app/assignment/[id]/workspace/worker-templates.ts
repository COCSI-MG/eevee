import { FileNode } from "@/types/shared";
import { WorkerType } from "@/app/interface/scheduler-api/worker";

export const WORKER_FILE_TEMPLATES: Record<WorkerType, FileNode> = {
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

  [WorkerType.REACT_CYPRESS]: {
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

  [WorkerType.NEXTJS_CYPRESS]: {
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
};

export const WORKER_FILE_CONTENTS: Record<string, string> = {
  // React + Vite
  "src/App.tsx": `import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <h1>Hello CodeLab!</h1>
      <button onClick={() => setCount((count) => count + 1)}>
        count is {count}
      </button>
    </div>
  )
}

export default App
`,

  "src/main.tsx": `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`,

  "src/components/Button.tsx": `interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

export default function Button({ children, onClick }: ButtonProps) {
  return (
    <button 
      onClick={onClick}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      {children}
    </button>
  );
}
`,

  "index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CodeLab Assignment</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,

  // Next.js
  "app/page.tsx": `export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Hello CodeLab!</h1>
      <p className="mt-4 text-lg">Start editing to see changes.</p>
    </main>
  )
}
`,

  "app/layout.tsx": `export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
`,

  "components/Button.tsx": `interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

export default function Button({ children, onClick }: ButtonProps) {
  return (
    <button 
      onClick={onClick}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      {children}
    </button>
  );
}
`,

  // NestJS
  "src/main.ts": `import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
`,

  "src/app.module.ts": `import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
`,

  "src/app.controller.ts": `import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
`,

  "src/app.service.ts": `import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello CodeLab!';
  }
}
`,

  // Node.js Default
  "src/index.js": `function main() {
  console.log('Hello CodeLab!');
}

main();

module.exports = { main };
`,

  "src/utils.js": `function sum(a, b) {
  return a + b;
}

function multiply(a, b) {
  return a * b;
}

module.exports = { sum, multiply };
`,

  // React + Express
  "frontend/src/App.tsx": `import { useState, useEffect } from 'react'

function App() {
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/hello')
      .then(res => res.json())
      .then(data => setMessage(data.message))
  }, [])

  return (
    <div className="App">
      <h1>{message || 'Loading...'}</h1>
    </div>
  )
}

export default App
`,

  "frontend/src/main.tsx": `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`,

  "backend/src/index.ts": `import express from 'express';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use('/api', routes);

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`,

  "backend/src/routes.ts": `import { Router } from 'express';

const router = Router();

router.get('/hello', (req, res) => {
  res.json({ message: 'Hello from Express!' });
});

export default router;
`,
};
