module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js'],
  testMatch: ['./**.test.ts'],
  testPathIgnorePatterns: ["/node_modules/", "/examples"],
  maxWorkers: 1,
};
