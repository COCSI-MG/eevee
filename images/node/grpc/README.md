# gRPC Worker

Worker for executing gRPC exercises in Node.js/TypeScript.

## How It Works

The student must implement a complete gRPC server in the `server.ts` file. The `main()` function should:
1. Define the `.proto` schema inline
2. Load the schema and create a gRPC server
3. Implement the service methods
4. Bind the server to `process.env.PORT` (or a default port)
5. Return the server instance

## Exercise Structure

### Files Required

You need to provide both files in the home directory:
- **`server.ts`** - Student's implementation
- **`validation.test.ts`** - Teacher's tests

### server.ts Implementation

The student must export a `main()` function that returns a gRPC server:

```typescript
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import fs from "fs";
import os from "os";
import path from "path";

export function main() {
  // 1. Define the .proto inline
  const PROTO_SRC = `
    syntax = "proto3";
    package calculator;

    service CalculatorService {
      rpc Add (OperationRequest) returns (OperationResponse);
    }

    message OperationRequest { double a = 1; double b = 2; }
    message OperationResponse { double result = 1; }
  `;

  // 2. Write to temp file and load
  const protoPath = path.join(os.tmpdir(), `service-${Date.now()}.proto`);
  fs.writeFileSync(protoPath, PROTO_SRC, "utf8");

  const packageDef = protoLoader.loadSync(protoPath, {});
  const grpcObj = grpc.loadPackageDefinition(packageDef) as any;
  const servicePkg = grpcObj.calculator;

  // 3. Create server and implement methods
  const server = new grpc.Server();
  server.addService(servicePkg.CalculatorService.service, {
    Add: (call: any, callback: any) => {
      const { a, b } = call.request;
      callback(null, { result: a + b });
    },
  });

  // 4. Bind to port
  const port = String(process.env.PORT || "50051");
  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (err, boundPort) => {
      if (err) {
        console.error("bindAsync error:", err);
        return;
      }
      console.log(`Service running on port ${boundPort}`);
    }
  );

  // 5. Return server instance
  return server;
}
```

## Running the Application

```bash
# Install dependencies
npm install

# Run tests directly
npm test

# Run the complete trigger (as in Kubernetes)
npm start
```

## Expected Output

When running `npm start`, you should see:

```bash
> ts-node ./trigger.ts

Checking dependencies...
server.ts exists.
At least one test file found.
Dependencies checked!
Running tests...
stdout:
> jest

PASS ./validation.test.ts
  CalculatorService
    ✓ adds correctly (50 ms)
    ✓ subtracts correctly (10 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total

Tests run!
```

## File Structure

```
grpc/
├── server.ts               # Student implementation (mounted by Kubernetes)
├── validation.test.ts      # Teacher's tests (mounted by Kubernetes)
├── trigger.ts              # Test executor (in Docker image)
├── package.json            # Dependencies (in Docker image)
└── examples/               # Reference examples
    └── calculator-exercise/
        ├── server.ts
        └── validation.test.ts
```

## Important Notes

1. **ALWAYS** use `process.env.PORT` for the server port
2. The `main()` function **MUST** return the server instance
3. Define the `.proto` schema inline within `server.ts`
4. Tests will create their own client to validate your implementation

## Deployment

The Docker image is built with:
- Project configurations (`package.json`, `tsconfig.json`, etc.)
- Test infrastructure (`trigger.ts`)
- Installed dependencies

The student's `server.ts` and teacher's `validation.test.ts` files are mounted via volume by Kubernetes at runtime.

