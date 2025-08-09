import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [
      './test/setup.ts',
      'dotenv/config',
      './test/setup/vitest-hooks.ts', // Enable telemetry hooks for New Relic monitoring
    ],
    include: ['test/**/*.test.ts', 'test/**/*.spec.ts'],
    exclude: ['node_modules/', 'dist/'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['node_modules/', 'dist/', 'test/', '*.config.ts', '**/*.eval.ts', 'src/**/*.d.ts'],
      thresholds: {
        lines: 90,
        statements: 90,
        functions: 90,
        branches: 70,
        perFile: true,
      },
    },
    // Test timeout for OpenTelemetry operations
    testTimeout: 10000,
    hookTimeout: 5000,
  },
});
