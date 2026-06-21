import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleFileExtensions: ["ts", "js", "json"],
  testMatch: ["**/*.spec.ts", "**/*.test.ts"],
  transform: {
    "^.+\\.[tj]s$": [
      "ts-jest",
      {
        diagnostics: false,
        tsconfig: {
          module: "commonjs",
          esModuleInterop: true,
          allowJs: true,
          checkJs: false,
          strict: false,
          noImplicitAny: false,
          moduleDetection: "force",
        },
      },
    ],
  },
  // Transpile ESM-only TeraORM packages so Jest can execute them in this CJS runtime.
  transformIgnorePatterns: [
    "/node_modules/(?!(teraorm|@teraorm/core|@teraorm/bigquery)/)",
  ],
};

export default config;
