
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    setupFiles: [
        "fake-indexeddb/auto"
    ],
    transform: {
        "^.+\\.tsx?$": ['ts-jest', {
            tsconfig: 'tsconfig.json',
        }]
    }
}