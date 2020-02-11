module.exports = {
  globals: {
    "ts-jest": {
      tsConfig: "tsconfig.json"
    }
  },
  moduleFileExtensions: [
    "ts",
    "js"
  ],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest"
  },
  testMatch: [
    "**/tests/**/*.ts"
  ],
  testPathIgnorePatterns: [
    "/dist/"
  ],
  testEnvironment: "node",
  coverageThreshold: {
    global: {
      branches: 83,
      functions: 100,
      lines: 97,
      statements: 97
    }
  },
};
