import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import fs from "fs";
import os from "os";
import path from "path";
import { main } from "./server";

jest.setTimeout(20000);

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

function createClient(address: string) {
  const protoPath = path.join(os.tmpdir(), `calculator-test-${Date.now()}.proto`);
  fs.writeFileSync(protoPath, PROTO_SRC, "utf8");

  const def = protoLoader.loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  const calculator = (grpc.loadPackageDefinition(def) as any).calculator;
  const client = new calculator.CalculatorService(address, grpc.credentials.createInsecure());
  return client;
}

describe("CalculatorService - Phase 1 (expected failure when wrong port)", () => {
  let server: grpc.Server | undefined;
  let client: any | undefined;

  const WRONG_PORT = "50055";

  beforeAll(() => {
    server = main();
    client = createClient(`localhost:${WRONG_PORT}`);
  });

  afterAll((done) => {
    if (client) client.close();
    if (server) server.tryShutdown(() => done());
    else done();
  });

  it("should NOT connect/call when server is not on process.env.PORT", (done) => {
    client.Add({ a: 1, b: 2 }, (err: any, res: any) => {
      expect(err).toBeTruthy();
      const okCodes = [grpc.status.UNAVAILABLE, grpc.status.DEADLINE_EXCEEDED];
      if (typeof err?.code === "number") {
        expect(okCodes).toContain(err.code);
      }
      expect(res).toBeUndefined();
      done();
    });
  });
});

describe("CalculatorService - Phase 2 (success when using process.env.PORT)", () => {
  let server: grpc.Server | undefined;
  let client: any | undefined;

  const TEST_PORT = "50055";

  beforeAll((done) => {
    process.env.PORT = TEST_PORT;

    server = main();

    client = createClient(`localhost:${TEST_PORT}`);

    const deadline = Date.now() + 8000;
    client.waitForReady(deadline, (err: any) => {
        if (err) return done(err);
        expect(err).toBeFalsy();
        done();
      });
  });

  afterAll((done) => {
    if (client) client.close();
    if (server) server.tryShutdown(() => done());
    else done();
  });

  it("adds correctly", (done) => {
    client.Add({ a: 2, b: 3 }, (err: any, res: any) => {
      expect(err).toBeNull();
      expect(res.result).toBe(5);
      done();
    });
  });

  it("subtracts correctly", (done) => {
    client.Subtract({ a: 10, b: 3 }, (err: any, res: any) => {
      expect(err).toBeNull();
      expect(res.result).toBe(7);
      done();
    });
  });

  it("adds decimals", (done) => {
    client.Add({ a: 2.5, b: 3.7 }, (err: any, res: any) => {
      expect(err).toBeNull();
      expect(res.result).toBeCloseTo(6.2, 6);
      done();
    });
  });
});
