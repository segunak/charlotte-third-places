# Testing Guide

This document describes the automated testing infrastructure for the Charlotte Third Places frontend application.

## Overview

The project uses a two-tier testing approach:

1. **Unit & Component Tests** — Vitest + React Testing Library
2. **End-to-End Tests (E2E)** — Playwright (Chromium only)

Both tiers run in GitHub Actions CI. Unit tests run on every push and PR, while E2E tests run against Vercel preview deployments after they complete.

## Tools

| Tool | Purpose |
|------|---------|
| [Vitest](https://vitest.dev/) | Test runner with native ESM support, compatible with Vite |
| [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) | Tests components the way users interact with them |
| [jsdom](https://github.com/jsdom/jsdom) | Browser environment simulation for component tests |
| [@vitest/coverage-v8](https://vitest.dev/guide/coverage.html) | Code coverage reporting |
| [Playwright](https://playwright.dev/) | Browser automation for E2E tests |

## Directory Structure

```txt
charlotte-third-places/
├── __tests__/
│   ├── setup.tsx              # Global test setup (mocks, cleanup)
│   ├── lib/                   # Unit tests for utility functions
│   │   └── ai/                # AI/RAG utility tests
│   ├── components/            # Component tests
│   └── contexts/              # Context provider tests
├── e2e/                       # Playwright E2E tests
├── vitest.config.mts          # Vitest configuration
├── playwright.config.ts       # Playwright configuration
└── coverage/                  # Generated coverage reports (gitignored)
```

## Configuration

### Vitest

See [vitest.config.mts](../charlotte-third-places/vitest.config.mts) for full configuration. Key settings:

- **Environment**: `jsdom` for browser simulation
- **Setup file**: [setup.tsx](../charlotte-third-places/__tests__/setup.tsx) runs before each test file (mocks Next.js router, matchMedia, etc.)
- **Test pattern**: `__tests__/**/*.test.{ts,tsx}`
- **Coverage**: V8 provider with HTML/JSON/text reporters

### Playwright

See [playwright.config.ts](../charlotte-third-places/playwright.config.ts) for full configuration. Key settings:

- **Browser**: Chromium only (reduces CI time)
- **Base URL**: Uses `PLAYWRIGHT_TEST_BASE_URL` env var, falls back to `localhost:3000`
- **Artifacts**: Screenshots on failure, traces on retry

## NPM Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `npm test` | `vitest run && start-server-and-test dev http://localhost:3000 test:e2e` | Run all tests (unit + E2E) |
| `npm run test:unit` | `vitest` | Run unit tests in watch mode |
| `npm run test:unit:run` | `vitest run` | Run unit tests once |
| `npm run test:ci` | `vitest run --coverage` | Run unit tests with coverage (CI) |
| `npm run test:coverage` | `vitest run --coverage` | Same as test:ci |
| `npm run test:e2e` | `playwright test` | Run E2E tests (requires dev server) |
| `npm run test:e2e:ui` | `playwright test --ui` | Run E2E tests with interactive UI |

The default `npm test` command runs all tests. It:

1. Runs unit tests with Vitest
2. Starts the Next.js dev server automatically
3. Runs E2E tests with Playwright
4. Shuts down the dev server when done

This is powered by `start-server-and-test`, which handles server lifecycle management.

## GitHub Actions Workflows

### Unit Tests

**File**: [.github/workflows/unit-tests.yml](../.github/workflows/unit-tests.yml)

Runs `npm run test:ci` (Vitest with coverage) on push to `develop`/`master` and on PRs targeting `master`.

### E2E Tests

**File**: [.github/workflows/playwright-tests.yml](../.github/workflows/playwright-tests.yml)

Triggered by `deployment_status` event when Vercel preview deployment completes. Runs Playwright against the preview URL.

## Branch Protection

To require tests to pass before merging PRs into `master`:

1. Go to **Settings → Branches → Branch protection rules**
2. Add rule for `master`
3. Enable **Require status checks to pass before merging**
4. Add these required checks:
   - `Run Vitest` (from unit-tests.yml)
   - `Run Playwright` (from playwright-tests.yml)

## Writing Tests

### Unit Tests

Test pure functions and utilities:

```typescript
import { describe, it, expect } from 'vitest'
import { normalizeTextForSearch } from '@/lib/utils'

describe('normalizeTextForSearch', () => {
  it('lowercases text', () => {
    expect(normalizeTextForSearch('HELLO')).toBe('hello')
  })
})
```

### Component Tests

Test components using React Testing Library's user-centric queries:

```typescript
import { render, screen } from '@testing-library/react'
import { PlaceCard } from '@/components/PlaceCard'

it('renders place name', () => {
  render(<PlaceCard place={mockPlace} />)
  expect(screen.getByText('Test Coffee Shop')).toBeInTheDocument()
})
```

### E2E Tests

Test full user flows with Playwright:

```typescript
import { test, expect } from '@playwright/test'

test('place detail page loads', async ({ page }) => {
  await page.goto('/places/1')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})
```

## What to Test vs. What Not to Test

### Good candidates for unit tests

- **Pure utility functions** — String manipulation, filtering logic, parsing
- **Configuration objects** — Validate structure and values
- **Component rendering** — Correct elements appear for given props
- **State transitions** — Context providers, reducers

### Not worth unit testing

- **API/SDK wrappers** — Cosmos DB, OpenAI, Google Maps calls (use integration tests)
- **Simple pass-through components** — Components that just render children
- **Third-party component behavior** — Trust the library's tests

### Use E2E tests for

- **Full user flows** — Navigation, form submission, search
- **Integration with external services** — Map rendering, AI chat
- **Responsive behavior** — Mobile vs desktop layouts

## Local Development

```bash
npm test              # Run all tests (unit + E2E)
npm run test:unit     # Unit tests in watch mode
npm run test:coverage # Unit tests with coverage report
npm run test:e2e      # E2E tests (requires dev server)
npm run test:e2e:ui   # E2E tests with interactive UI
```

## Coverage Reports

After running `npm run test:coverage`, open `coverage/index.html` to view the HTML report.
