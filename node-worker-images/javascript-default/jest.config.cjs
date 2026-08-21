module.exports = {
  testEnvironment: "node",
  moduleFileExtensions: ["js", "mjs", "cjs", "json"],
  testMatch: ["**/*.spec.js", "**/*.test.js"],
  transform: {
    "^.+\\.[cm]?js$": [
      "babel-jest",
      {
        configFile: "./babel.config.cjs",
      },
    ],
  },
};
