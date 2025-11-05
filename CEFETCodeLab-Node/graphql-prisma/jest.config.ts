import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(test|spec).ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  testPathIgnorePatterns: ['/node_modules/', '/examples/'],
  roots: ['<rootDir>'],
  maxWorkers: 1,
  testTimeout: 30000,
};
export default config;