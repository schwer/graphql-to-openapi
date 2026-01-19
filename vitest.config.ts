import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Replaces moduleFileExtensions (Vitest supports ts/js by default)
    // Replaces transform: Vitest handles TS out of the box
    include: ['**/tests/**/*.ts'], // Replaces testMatch
    exclude: ['**/node_modules/**', '**/dist/**'], // Replaces testPathIgnorePatterns
    environment: 'node', // Replaces testEnvironment
    coverage: {
      provider: 'v8', // Recommended for 2026
      thresholds: {
        // Replaces coverageThreshold
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
  },
});
