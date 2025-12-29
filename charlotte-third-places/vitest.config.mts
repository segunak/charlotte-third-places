import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./__tests__/setup.tsx'],
    include: ['__tests__/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['lib/**/*.ts', 'lib/**/*.tsx', 'components/**/*.tsx'],
      exclude: [
        'node_modules/',
        '.next/',
        'e2e/',
        '**/*.d.ts',
        'lib/ai/airtable-generated-data.ts',
      ],
      thresholds: {
        // Current coverage levels after initial test implementation
        // Target: 80% for all metrics (increase gradually as more tests are added)
        statements: 7,
        branches: 6,
        functions: 5,
        lines: 6,
      },
    },
  },
})
