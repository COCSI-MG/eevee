module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleFileExtensions: ["ts", "js"],
  testPathIgnorePatterns: ["/node_modules/", "/examples"],
  maxWorkers: 1,
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        diagnostics: false, 
      },
    ],
  },
};
