import { test, expect, Page } from '@playwright/test'

/**
 * Responsive Column Layout E2E Tests
 * 
 * These tests verify that the DataTable component correctly displays
 * the expected number of columns at different viewport widths.
 * 
 * This test was added to catch regressions like the Tailwind v4 breakpoint
 * unit mismatch bug where custom breakpoints using `px` didn't cascade
 * correctly with Tailwind's default `rem`-based breakpoints.
 * 
 * Breakpoint definitions (from globals.css @theme):
 * - lg: 1024px (64rem) → 2 columns
 * - 3xl: 1920px (120rem) → 3 columns
 * - 4xl: 2560px (160rem) → 4 columns
 * - 5xl: 3200px (200rem) → 5 columns
 * 
 * The test verifies that CSS width classes (lg:w-1/2, 3xl:w-1/3, etc.)
 * are applied correctly by measuring the actual rendered card widths.
 */

// Wait for the DataTable to load and return the card container
async function waitForDataTable(page: Page) {
  await page.waitForLoadState('domcontentloaded')
  
  // Wait for browse section to be visible (indicates page is loaded)
  const browseSection = page.getByTestId('browse-section')
  await expect(browseSection).toBeVisible({ timeout: 60000 })
  
  // Wait for DataTable loading spinner to finish and virtualization to stabilize
  await page.waitForTimeout(2000)
  
  // Wait for at least one place card to be rendered
  const firstCard = page.locator('[data-testid="place-card"]').first()
  await expect(firstCard).toBeVisible({ timeout: 30000 })
  
  // Brief additional wait for virtualization to fully stabilize
  await page.waitForTimeout(300)
  
  return firstCard
}

// Calculate expected columns based on card width relative to container
async function getRenderedColumnCount(page: Page): Promise<number> {
  // Get the first row of cards (the virtualized row container)
  const firstRow = page.locator('[data-index="0"]').first()
  await expect(firstRow).toBeVisible()
  
  // Get all card wrappers in the first row
  const cardWrappers = firstRow.locator('> div > div')
  const count = await cardWrappers.count()
  
  if (count === 0) return 0
  
  // Get the container width and first card width
  const containerBox = await firstRow.boundingBox()
  const firstCardWrapper = cardWrappers.first()
  const cardBox = await firstCardWrapper.boundingBox()
  
  if (!containerBox || !cardBox) return 0
  
  // Calculate columns based on card width ratio
  // Account for padding (px-2 = 8px each side = 16px total)
  const cardWidthWithPadding = cardBox.width
  const columnsFromWidth = Math.round(containerBox.width / cardWidthWithPadding)
  
  return columnsFromWidth
}

// Alternative: count visible cards in first row
async function getCardCountInFirstRow(page: Page): Promise<number> {
  const firstRow = page.locator('[data-index="0"]').first()
  await expect(firstRow).toBeVisible()
  
  // Count direct card wrappers in the flex container
  const cardWrappers = firstRow.locator('[data-testid="place-card"]')
  return await cardWrappers.count()
}

test.describe('Responsive Column Layout', () => {
  test.describe.configure({ mode: 'serial' })

  test('displays CardCarousel on mobile (< 1024px)', async ({ page }) => {
    // Mobile uses CardCarousel (swipeable carousel) instead of DataTable grid
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE size
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    
    // Wait for responsive place cards container
    const responsiveCards = page.getByTestId('responsive-place-cards')
    await expect(responsiveCards).toBeVisible({ timeout: 60000 })
    
    // Mobile carousel container should be visible
    const mobileContainer = page.getByTestId('mobile-carousel-container')
    await expect(mobileContainer).toBeVisible({ timeout: 10000 })
    
    // Desktop carousel container should be hidden on mobile
    const desktopContainer = page.getByTestId('desktop-carousel-container')
    await expect(desktopContainer).not.toBeVisible()
    
    // CardCarousel component should be present
    const cardCarousel = page.getByTestId('card-carousel')
    await expect(cardCarousel).toBeVisible({ timeout: 10000 })
    
    // Shuffle button should be visible on mobile
    const shuffleButton = mobileContainer.locator('button').filter({ has: page.locator('svg') })
    await expect(shuffleButton.first()).toBeVisible()
  })

  test('displays 2 columns at lg breakpoint (1024px)', async ({ page }) => {
    // lg breakpoint - exactly at threshold
    await page.setViewportSize({ width: 1024, height: 800 })
    await page.goto('/')
    await waitForDataTable(page)
    
    const cardCount = await getCardCountInFirstRow(page)
    expect(cardCount).toBe(2)
  })

  test('displays 2 columns between lg and 3xl (1280px)', async ({ page }) => {
    // Common desktop size, between lg and 3xl
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await waitForDataTable(page)
    
    const cardCount = await getCardCountInFirstRow(page)
    expect(cardCount).toBe(2)
  })

  test('displays 3 columns at 3xl breakpoint (1920px)', async ({ page }) => {
    // 3xl breakpoint - Full HD
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')
    await waitForDataTable(page)
    
    const cardCount = await getCardCountInFirstRow(page)
    expect(cardCount).toBe(3)
  })

  test('displays 4 columns at 4xl breakpoint (2560px)', async ({ page }) => {
    // 4xl breakpoint - 1440p / 4K
    await page.setViewportSize({ width: 2560, height: 1440 })
    await page.goto('/')
    await waitForDataTable(page)
    
    const cardCount = await getCardCountInFirstRow(page)
    expect(cardCount).toBe(4)
  })

  test('displays 5 columns at 5xl breakpoint (3200px)', async ({ page }) => {
    // 5xl breakpoint - Ultrawide / 4K+
    await page.setViewportSize({ width: 3200, height: 1800 })
    await page.goto('/')
    await waitForDataTable(page)
    
    const cardCount = await getCardCountInFirstRow(page)
    expect(cardCount).toBe(5)
  })
})

test.describe('Responsive Column Layout - CSS Width Verification', () => {
  /**
   * This test verifies that the CSS breakpoints are being applied correctly
   * by checking the actual computed width of card elements.
   * 
   * This catches the specific bug where Tailwind v4 breakpoints using `px`
   * didn't cascade correctly with default `rem` breakpoints.
   */
  test('card width matches expected percentage at 3xl', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')
    await waitForDataTable(page)
    
    // Get the first row and its width
    const firstRow = page.locator('[data-index="0"]').first()
    await expect(firstRow).toBeVisible()
    const rowBox = await firstRow.boundingBox()
    
    // Get a card wrapper's width
    const cardWrapper = firstRow.locator('[data-testid="place-card"]').first().locator('..')
    const cardBox = await cardWrapper.boundingBox()
    
    if (rowBox && cardBox) {
      // At 3xl (1920px), cards should be ~1/3 width (33.33%)
      // Account for some variance due to padding
      const widthRatio = cardBox.width / rowBox.width
      expect(widthRatio).toBeGreaterThan(0.30) // Should be ~33%
      expect(widthRatio).toBeLessThan(0.40)
    }
  })

  test('card width increases correctly when viewport shrinks below 3xl', async ({ page }) => {
    // Start at 3xl
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')
    await waitForDataTable(page)
    
    let cardCount = await getCardCountInFirstRow(page)
    expect(cardCount).toBe(3)
    
    // Shrink below 3xl threshold
    await page.setViewportSize({ width: 1919, height: 1080 })
    await page.waitForTimeout(200) // Allow CSS to recalculate
    
    cardCount = await getCardCountInFirstRow(page)
    expect(cardCount).toBe(2)
  })
})
