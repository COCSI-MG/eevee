import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import fs from "fs";
import os from "os";
import path from "path";

// PLEASE DONT RENAME THIS FUNCTION, THE TEST MAY FAIL
export function main() {
  const PROTO_SRC = `
    syntax = "proto3";
    package calculator;

    service CalculatorService {
      rpc Add (OperationRequest) returns (OperationResponse);
      rpc Subtract (OperationRequest) returns (OperationResponse);
    }

    message OperationRequest { double a = 1; double b = 2; }
    message OperationResponse { double result = 1; }
  `;

  const protoPath = path.join(os.tmpdir(), `calculator-${Date.now()}.proto`);
  fs.writeFileSync(protoPath, PROTO_SRC, "utf8");

  const packageDef = protoLoader.loadSync(protoPath, {});
  const grpcObj = grpc.loadPackageDefinition(packageDef) as any;
  const calculatorPkg = grpcObj.calculator;

  const server = new grpc.Server();
  server.addService(calculatorPkg.CalculatorService.service, {
    Add: (call: any, callback: any) => {
      const { a, b } = call.request;
      callback(null, { result: a + b });
    },
    Subtract: (call: any, callback: any) => {
      const { a, b } = call.request;
      callback(null, { result: a - b });
    },
  });

  const port = String(process.env.PORT || "50051");

  server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(),
    (err, boundPort) => {
      if (err) {
        console.error("bindAsync error:", err);
        return;
      }
      console.log(`CalculatorService running on port ${boundPort}`);
    }
  );

  return server;
}
