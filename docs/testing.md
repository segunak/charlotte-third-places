# Frontend Testing Strategy

This document outlines the automated testing infrastructure for the Charlotte Third Places frontend application.

## Overview

The project uses a two-tier testing approach:

1. **Unit & Component Tests** - Vitest + React Testing Library
2. **End-to-End Tests** - Playwright (Chromium only)

Both run in GitHub Actions CI, with E2E tests executing against Vercel preview deployments.

## Tools & Rationale

### Vitest + React Testing Library

- **Vitest** - Native ESM support, fast execution, compatible with Vite ecosystem
- **React Testing Library** - Tests components the way users interact with them
- **jsdom** - Browser environment simulation for component tests
- **@vitest/coverage-v8** - Code coverage reporting with 80% minimum threshold

### Playwright

- **Chromium only** - Reduces CI time while covering the most common browser
- **Single worker in CI** - Prioritizes stability and reproducibility over speed
- **Preview URL testing** - E2E tests run against Vercel preview deployments, not localhost

## Folder Structure

```txt
charlotte-third-places/
├── __tests__/
│   ├── lib/           # Unit tests for utility functions
│   │   ├── markdown.test.ts
│   │   ├── filter-utils.test.ts
│   │   └── utils.test.ts
│   └── components/    # Component tests
│       ├── PlaceCard.test.tsx
│       └── ...
├── e2e/               # Playwright E2E tests
│   ├── smoke.spec.ts
│   └── ...
├── vitest.config.mts
├── playwright.config.ts
└── package.json
```

## Configuration Files

### vitest.config.mts

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./__tests__/setup.ts'],
    include: ['__tests__/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', '.next/', 'e2e/'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
})
```

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
```

## NPM Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ci": "vitest run --coverage",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

## GitHub Actions Workflows

### Unit & Component Tests (.github/workflows/test.yml)

Runs on:
- Push to `develop` or `master`
- Pull requests into `master`

Steps:
1. Checkout code
2. Setup Node.js (LTS)
3. Install dependencies (`npm ci`)
4. Run tests with coverage (`npm run test:ci`)
5. Fail if coverage below 80%

### E2E Tests (.github/workflows/playwright.yml)

Runs on:
- `deployment_status` event (triggered by Vercel after preview deploy completes)

Key configuration:
```yaml
on:
  deployment_status:

jobs:
  test:
    if: github.event.deployment_status.state == 'success'
    steps:
      - name: Run Playwright tests
        run: npx playwright test
        env:
          PLAYWRIGHT_TEST_BASE_URL: ${{ github.event.deployment_status.target_url }}
```

This approach:
- Waits for Vercel to complete the preview deployment
- Tests against the actual preview URL (mimics production)
- Uploads HTML report as artifact for debugging failures

## Branch Protection

Configure in GitHub repo settings (Settings → Branches → master):

1. Require status checks to pass before merging
2. Add required status checks:
   - `test` (from test.yml workflow)
   - `playwright` (from playwright.yml workflow)

This prevents merging PRs into master unless both unit tests and E2E tests pass.

## Test Coverage Requirements

- **Minimum threshold**: 80% for statements, branches, functions, and lines
- **Enforced in CI**: Build fails if coverage drops below threshold
- **Coverage reports**: Generated in `coverage/` directory (gitignored)

## Test Priorities

### Tier 1 - Core Utilities (High Priority)
- `lib/markdown.ts` - parseMarkdown(), parseInline()
- `lib/filter-utils.ts` - doesPlaceMatchFilter(), filterPlaces()
- `lib/utils.ts` - normalizeForSearch()
- `lib/data-services.ts` - mapRecordToPlace(), parseDate(), parsePythonArrayString()

### Tier 2 - Complex Components
- `PlaceHighlights.tsx` - priority ordering, ribbon/gradient logic
- `NeighborhoodBadge.tsx` - color caching, hash-based assignment
- `FilterUtilities.tsx` - distinct value extraction, ordering
- `DataTable.tsx` - filtering, sorting, virtualization

### Tier 3 - E2E Smoke Tests
- Homepage loads successfully
- Places page displays places
- Filter interactions work
- Map page renders
- Navigation between pages

### Tier 4 - Integration Tests
- Full filter flow with data
- Search functionality
- Mobile responsive behavior

## Gitignore Additions

```
# Test artifacts
playwright-report/
test-results/
coverage/
```

## Local Development

```bash
# Run unit tests in watch mode
npm test

# Run unit tests once with coverage
npm run test:coverage

# Run E2E tests locally (requires dev server running)
npm run dev &
npm run test:e2e

# Run E2E tests with UI mode (debugging)
npm run test:e2e:ui
```

## Dependencies to Install

### Dev Dependencies
```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths @vitest/coverage-v8
npx playwright install chromium --with-deps
```
