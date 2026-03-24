import type { Config } from 'jest';

const config: Config = {
  preset: "ts-jest",
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js'],
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          allowJs: true,
          esModuleInterop: true,
        },
      },
    ],
  },
};

export default config;
