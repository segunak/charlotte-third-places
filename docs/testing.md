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

---

## AI Chatbot / RAG Testing Strategy

The chatbot uses Retrieval-Augmented Generation (RAG) with entity detection, vector search, and dynamic filtering. This section outlines how to test the AI pipeline.

### Test Categories

#### 1. Entity Detection Unit Tests (`__tests__/lib/ai/entity-detection.test.ts`)

Test the `detectEntities()`, `detectNeighborhoods()`, and `detectTags()` functions.

**Neighborhood Detection:**

```typescript
describe('detectNeighborhoods', () => {
  it('detects canonical neighborhood names', () => {
    const result = detectNeighborhoods('Places in NoDa');
    expect(result.primary).toContain('NoDa');
  });

  it('handles case-insensitive matching', () => {
    const result = detectNeighborhoods('places in noda');
    expect(result.primary).toContain('NoDa');
  });

  it('maps aliases to canonical names', () => {
    const result = detectNeighborhoods('coffee in South Park');
    expect(result.primary).toContain('SouthPark');
  });

  it('handles multi-word aliases', () => {
    const result = detectNeighborhoods('places in plaza midwood');
    expect(result.primary).toContain('Plaza Midwood');
  });

  it('expands to nearby neighborhoods', () => {
    const result = detectNeighborhoods('coffee in NoDa');
    expect(result.nearby.length).toBeGreaterThan(0);
    expect(result.nearby).toContain('Plaza Midwood'); // NoDa neighbor
  });

  it('excludes primary from nearby', () => {
    const result = detectNeighborhoods('places in NoDa');
    expect(result.nearby).not.toContain('NoDa');
  });

  it('detects multiple neighborhoods', () => {
    const result = detectNeighborhoods('NoDa or Plaza Midwood');
    expect(result.primary).toContain('NoDa');
    expect(result.primary).toContain('Plaza Midwood');
  });

  it('returns empty for no neighborhood mentioned', () => {
    const result = detectNeighborhoods('best coffee shops');
    expect(result.primary).toHaveLength(0);
    expect(result.nearby).toHaveLength(0);
  });

  it('matches longer terms before shorter (Plaza Midwood before Plaza)', () => {
    const result = detectNeighborhoods('places in Plaza Midwood');
    expect(result.primary).toContain('Plaza Midwood');
    expect(result.primary).not.toContain('Plaza');
  });
});
```

**Tag Detection:**
```typescript
describe('detectTags', () => {
  it('detects exact tag matches', () => {
    const result = detectTags('places with a fireplace');
    expect(result).toContain('Has Fireplace');
  });

  it('handles case-insensitive matching', () => {
    const result = detectTags('FIREPLACE coffee shop');
    expect(result).toContain('Has Fireplace');
  });

  it('detects multiple tags', () => {
    const result = detectTags('fireplace and good for groups');
    expect(result).toContain('Has Fireplace');
    expect(result).toContain('Good for Groups');
  });

  it('returns empty for no tags mentioned', () => {
    const result = detectTags('coffee in NoDa');
    expect(result).toHaveLength(0);
  });
});
```

**Combined Entity Detection:**
```typescript
describe('detectEntities', () => {
  it('detects both neighborhoods and tags', () => {
    const result = detectEntities('fireplace in NoDa');
    expect(result.neighborhoods.primary).toContain('NoDa');
    expect(result.tags).toContain('Has Fireplace');
  });

  it('handles complex queries', () => {
    const result = detectEntities(
      'cozy places in South Park with good wifi and a fireplace'
    );
    expect(result.neighborhoods.primary).toContain('SouthPark');
    expect(result.tags).toContain('Has Fireplace');
  });
});
```

#### 2. Cosmos DB Query Builder Tests (`__tests__/lib/ai/cosmos.test.ts`)

These tests verify the SQL query generation logic without hitting the actual database. You'll need to mock the Cosmos SDK.

**Test Setup:**
```typescript
import { vi } from 'vitest';

// Mock the Cosmos client
vi.mock('@azure/cosmos', () => ({
  CosmosClient: vi.fn().mockImplementation(() => ({
    database: () => ({
      container: () => ({
        items: {
          query: vi.fn().mockReturnValue({
            fetchAll: vi.fn().mockResolvedValue({ resources: [] }),
          }),
        },
        item: () => ({
          read: vi.fn().mockResolvedValue({ resource: null }),
        }),
      }),
    }),
  })),
}));
```

**Query Building Tests:**
```typescript
describe('vectorSearchPlaces query construction', () => {
  it('builds unfiltered query when no filters provided', async () => {
    const mockQuery = vi.fn().mockReturnValue({
      fetchAll: vi.fn().mockResolvedValue({ resources: [] }),
    });
    // ... setup mock to capture query
    
    await vectorSearchPlaces(embedding, 10, 0.6);
    
    const [queryObj] = mockQuery.mock.calls[0];
    expect(queryObj.query).not.toContain('ARRAY_CONTAINS');
    expect(queryObj.query).toContain('VectorDistance');
  });

  it('includes neighborhood filter with ARRAY_CONTAINS', async () => {
    await vectorSearchPlaces(embedding, 10, 0.6, {
      neighborhoods: { primary: ['NoDa'], nearby: ['Plaza Midwood'] },
    });
    
    const [queryObj] = mockQuery.mock.calls[0];
    expect(queryObj.query).toContain('ARRAY_CONTAINS(@neighborhoods, LOWER(c.neighborhood))');
    expect(queryObj.parameters).toContainEqual({
      name: '@neighborhoods',
      value: ['noda', 'plaza midwood'],
    });
  });

  it('includes tag filter with EXISTS subquery', async () => {
    await vectorSearchPlaces(embedding, 10, 0.6, {
      tags: ['Has Fireplace'],
    });
    
    const [queryObj] = mockQuery.mock.calls[0];
    expect(queryObj.query).toContain('EXISTS(SELECT VALUE t FROM t IN c.tags WHERE ARRAY_CONTAINS(@tags, LOWER(t)))');
    expect(queryObj.parameters).toContainEqual({
      name: '@tags',
      value: ['has fireplace'],
    });
  });

  it('combines neighborhood and tag filters', async () => {
    await vectorSearchPlaces(embedding, 10, 0.6, {
      neighborhoods: { primary: ['NoDa'], nearby: [] },
      tags: ['Has Fireplace'],
    });
    
    const [queryObj] = mockQuery.mock.calls[0];
    expect(queryObj.query).toContain('ARRAY_CONTAINS(@neighborhoods');
    expect(queryObj.query).toContain('EXISTS(SELECT VALUE t');
  });

  it('calculates maxDistance from minScore correctly', async () => {
    await vectorSearchPlaces(embedding, 10, 0.7); // minScore = 0.7
    
    const [queryObj] = mockQuery.mock.calls[0];
    expect(queryObj.parameters).toContainEqual({
      name: '@maxDistance',
      value: 0.3, // 1 - 0.7
    });
  });

  it('uses minScore of 0 for filtered queries (maxDistance = 1)', async () => {
    await vectorSearchPlaces(embedding, 10, 0.0, {
      neighborhoods: { primary: ['NoDa'], nearby: [] },
    });
    
    const [queryObj] = mockQuery.mock.calls[0];
    expect(queryObj.parameters).toContainEqual({
      name: '@maxDistance',
      value: 1.0,
    });
  });
});
```

**Nearby Neighborhood Flagging:**
```typescript
describe('isFromNearbyNeighborhood flag', () => {
  it('marks places from nearby neighborhoods', async () => {
    const mockResources = [
      { id: '1', neighborhood: 'Plaza Midwood', distance: 0.2 },
    ];
    // ... setup mock
    
    const results = await vectorSearchPlaces(embedding, 10, 0.6, {
      neighborhoods: { primary: ['NoDa'], nearby: ['Plaza Midwood'] },
    });
    
    expect(results[0].isFromNearbyNeighborhood).toBe(true);
  });

  it('does not mark places from primary neighborhoods', async () => {
    const mockResources = [
      { id: '1', neighborhood: 'NoDa', distance: 0.2 },
    ];
    
    const results = await vectorSearchPlaces(embedding, 10, 0.6, {
      neighborhoods: { primary: ['NoDa'], nearby: ['Plaza Midwood'] },
    });
    
    expect(results[0].isFromNearbyNeighborhood).toBe(false);
  });
});
```

#### 3. RAG Orchestration Tests (`__tests__/lib/ai/rag.test.ts`)

Test the `performRAG()` function's orchestration logic.

```typescript
describe('performRAG', () => {
  it('uses filteredMinScore (0.0) when neighborhoods detected', async () => {
    const result = await performRAG({ query: 'coffee in NoDa' });
    
    // Verify vectorSearchPlaces was called with minScore = 0
    expect(mockVectorSearchPlaces).toHaveBeenCalledWith(
      expect.any(Array),
      expect.any(Number),
      0.0, // filteredMinScore
      expect.objectContaining({
        neighborhoods: expect.objectContaining({
          primary: expect.arrayContaining(['NoDa']),
        }),
      }),
      'coffee in NoDa'
    );
  });

  it('uses generalPlaces.minScore when no filters detected', async () => {
    const result = await performRAG({ query: 'best coffee shops' });
    
    expect(mockVectorSearchPlaces).toHaveBeenCalledWith(
      expect.any(Array),
      expect.any(Number),
      0.6, // generalPlaces.minScore
      undefined,
      'best coffee shops'
    );
  });

  it('passes entity context to response when filters detected', async () => {
    const result = await performRAG({ query: 'fireplace in NoDa' });
    
    expect(result.entityContext).toBeDefined();
    expect(result.entityContext?.neighborhoods.primary).toContain('NoDa');
    expect(result.entityContext?.tags).toContain('Has Fireplace');
  });

  it('does not pass entity context when no filters', async () => {
    const result = await performRAG({ query: 'best coffee' });
    
    expect(result.entityContext).toBeUndefined();
  });
});
```

#### 4. Build Script Tests (`__tests__/scripts/generate-airtable-data.test.ts`)

Test the code generation script produces valid output.

```typescript
describe('generate-airtable-data script', () => {
  it('extracts distinct neighborhoods from places', () => {
    const places = [
      { neighborhood: 'NoDa' },
      { neighborhood: 'NoDa' },
      { neighborhood: 'Dilworth' },
    ];
    
    const neighborhoods = extractNeighborhoods(places);
    
    expect(neighborhoods).toHaveLength(2);
    expect(neighborhoods).toContain('NoDa');
    expect(neighborhoods).toContain('Dilworth');
  });

  it('extracts and flattens tags from places', () => {
    const places = [
      { tags: ['Has Fireplace', 'Good for Groups'] },
      { tags: ['Has Fireplace'] },
    ];
    
    const tags = extractTags(places);
    
    expect(tags).toContain('Has Fireplace');
    expect(tags).toContain('Good for Groups');
    expect(tags.filter(t => t === 'Has Fireplace')).toHaveLength(1); // deduped
  });

  it('sorts neighborhoods alphabetically', () => {
    const neighborhoods = extractNeighborhoods([
      { neighborhood: 'Dilworth' },
      { neighborhood: 'NoDa' },
      { neighborhood: 'Ballantyne' },
    ]);
    
    expect(neighborhoods).toEqual(['Ballantyne', 'Dilworth', 'NoDa']);
  });

  it('generates valid TypeScript', () => {
    const output = generateTypeScriptFile(['NoDa'], ['Has Fireplace']);
    
    expect(output).toContain('export const NEIGHBORHOODS');
    expect(output).toContain('export const TAGS');
    expect(() => eval(output)).not.toThrow(); // Basic syntax check
  });
});
```

#### 5. E2E Chatbot Tests (`e2e/chatbot.spec.ts`)

Integration tests that verify the full chatbot flow.

```typescript
import { test, expect } from '@playwright/test';

test.describe('Chatbot RAG Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chat');
  });

  test('filters by neighborhood and returns relevant places', async ({ page }) => {
    await page.getByPlaceholder(/ask/i).fill('coffee shops in NoDa');
    await page.getByRole('button', { name: /send/i }).click();
    
    // Wait for response
    await expect(page.getByTestId('ai-response')).toBeVisible({ timeout: 30000 });
    
    // Response should mention NoDa places
    const response = await page.getByTestId('ai-response').textContent();
    expect(response?.toLowerCase()).toContain('noda');
  });

  test('handles neighborhood aliases (South Park → SouthPark)', async ({ page }) => {
    await page.getByPlaceholder(/ask/i).fill('places in South Park');
    await page.getByRole('button', { name: /send/i }).click();
    
    await expect(page.getByTestId('ai-response')).toBeVisible({ timeout: 30000 });
    
    const response = await page.getByTestId('ai-response').textContent();
    expect(response?.toLowerCase()).toMatch(/southpark|south park/);
  });

  test('filters by tags', async ({ page }) => {
    await page.getByPlaceholder(/ask/i).fill('places with a fireplace');
    await page.getByRole('button', { name: /send/i }).click();
    
    await expect(page.getByTestId('ai-response')).toBeVisible({ timeout: 30000 });
    
    const response = await page.getByTestId('ai-response').textContent();
    expect(response?.toLowerCase()).toContain('fireplace');
  });

  test('combines neighborhood and tag filters', async ({ page }) => {
    await page.getByPlaceholder(/ask/i).fill('fireplace in Dilworth');
    await page.getByRole('button', { name: /send/i }).click();
    
    await expect(page.getByTestId('ai-response')).toBeVisible({ timeout: 30000 });
    
    const response = await page.getByTestId('ai-response').textContent();
    expect(response?.toLowerCase()).toContain('dilworth');
  });

  test('returns results for unfiltered semantic queries', async ({ page }) => {
    await page.getByPlaceholder(/ask/i).fill('best place to study');
    await page.getByRole('button', { name: /send/i }).click();
    
    await expect(page.getByTestId('ai-response')).toBeVisible({ timeout: 30000 });
    
    // Should get a meaningful response
    const response = await page.getByTestId('ai-response').textContent();
    expect(response?.length).toBeGreaterThan(50);
  });
});
```

### Test Data & Fixtures

#### Mock Embeddings
```typescript
// __tests__/fixtures/embeddings.ts
export const MOCK_EMBEDDING = new Array(1536).fill(0.1);

export const MOCK_PLACE_DOCUMENTS = [
  {
    id: 'place-1',
    placeName: 'Amelie's French Bakery',
    neighborhood: 'NoDa',
    tags: ['Has Fireplace', 'Good for Groups'],
    distance: 0.15,
  },
  {
    id: 'place-2', 
    placeName: 'Common Market',
    neighborhood: 'Plaza Midwood',
    tags: ['Good for Groups'],
    distance: 0.25,
  },
];
```

### CI Integration

Add AI tests to the existing test workflow:

```yaml
# .github/workflows/test.yml
- name: Run unit tests with coverage
  run: npm run test:ci
  env:
    # Mock API keys for tests (tests should not call real APIs)
    OPENAI_API_KEY: test-key
    COSMOS_DB_CONNECTION_STRING: test-connection
```

### Test Coverage Goals

| Module | Target Coverage |
|--------|-----------------|
| `lib/ai/entity-detection.ts` | 95% |
| `lib/ai/cosmos.ts` (query building) | 90% |
| `lib/ai/rag.ts` | 85% |
| `scripts/generate-airtable-data.ts` | 80% |

### Mocking Strategy

1. **OpenAI Embeddings** - Mock `getEmbedding()` to return deterministic vectors
2. **Cosmos DB** - Mock `@azure/cosmos` client to test query construction without network
3. **Environment Variables** - Set test values in `vitest.config.mts` setupFiles

### Snapshot Testing (Optional)

For complex query generation, consider snapshot tests:

```typescript
it('generates expected SQL for neighborhood + tag filter', async () => {
  const query = buildQueryForFilters({
    neighborhoods: { primary: ['NoDa'], nearby: ['Plaza Midwood'] },
    tags: ['Has Fireplace'],
  });
  
  expect(query).toMatchInlineSnapshot(`
    "SELECT TOP @topK ... WHERE ARRAY_CONTAINS(@neighborhoods, LOWER(c.neighborhood))
        AND EXISTS(SELECT VALUE t FROM t IN c.tags WHERE ARRAY_CONTAINS(@tags, LOWER(t)))
        AND VectorDistance(c.embedding, @queryEmbedding) < @maxDistance
    ORDER BY VectorDistance(c.embedding, @queryEmbedding)"
  `);
});
```

### Manual Testing Checklist

For features that are difficult to automate, maintain a manual test checklist:

- [ ] "Places in NoDa" returns NoDa places (not just semantically similar)
- [ ] "South Park" maps to "SouthPark" correctly
- [ ] "downtown charlotte" maps to "Uptown" correctly  
- [ ] "fireplace" returns only places with Has Fireplace tag
- [ ] Combined queries work: "fireplace in Dilworth"
- [ ] Nearby neighborhoods appear in results when primary has few matches
- [ ] General queries like "best coffee" use semantic similarity
- [ ] Dev server console shows debug logs with query type and minScore
