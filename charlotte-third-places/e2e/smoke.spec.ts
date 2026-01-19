import { test, expect } from '@playwright/test'

/**
 * Smoke tests for Charlotte Third Places frontend.
 * These tests verify core functionality is working on the deployed site.
 */

test.describe('Smoke Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/')
    
    // Check that the page title is set
    await expect(page).toHaveTitle(/Charlotte Third Places/i)
    
    // Check that main content is visible
    await expect(page.locator('main')).toBeVisible()
  })

  test('homepage displays place count', async ({ page }) => {
    await page.goto('/')
    
    // The heading should show a number of places (e.g., "Explore 150 Third Places")
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible()
    await expect(heading).toContainText(/Explore \d+ Third Places/i)
  })

  test('homepage displays browse section with places', async ({ page }) => {
    await page.goto('/')
    
    // Wait for domcontentloaded, then wait for the browse section
    await page.waitForLoadState('domcontentloaded')
    
    // The browse section should exist and contain place cards
    // This is a dynamically loaded component so needs longer timeout
    const browseSection = page.getByTestId('browse-section')
    await expect(browseSection).toBeVisible({ timeout: 60000 })
  })

  test('about page loads', async ({ page }) => {
    await page.goto('/about')
    
    await expect(page).toHaveTitle(/About/i)
    await expect(page.locator('main')).toBeVisible()
  })

  test('map page loads', async ({ page }) => {
    await page.goto('/map')
    
    await expect(page.locator('main')).toBeVisible()
    
    // Wait for the APIProvider/Map to load - look for the Google Maps container
    // The @vis.gl/react-google-maps library renders into a div
    const mapElement = page.locator('[class*="gm-style"], [id*="map"], .gm-style').first()
    await expect(mapElement).toBeVisible({ timeout: 20000 })
  })

  test('navigation to map page works', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    
    // Find and click map link in navigation
    const mapLink = page.getByRole('link', { name: /map/i }).first()
    await expect(mapLink).toBeVisible({ timeout: 15000 })
    await mapLink.click()
    
    // Verify navigation occurred - use longer timeout for slow dev server
    await expect(page).toHaveURL(/\/map/, { timeout: 30000 })
  })

  test('responsive: mobile navigation is accessible', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/')
    
    // Check that page loads correctly on mobile
    await expect(page.locator('main')).toBeVisible()
  })
})

test.describe('Homepage Content', () => {
  test('displays Feed/Random section', async ({ page }) => {
    await page.goto('/')
    
    // Wait for content to load
    await expect(page.locator('main')).toBeVisible()
    
    // Should have either "Feed" (desktop) or "Random" (mobile) section
    const feedSection = page.locator('#stack-section')
    await expect(feedSection).toBeVisible()
  })

  test('displays navigation links', async ({ page }) => {
    await page.goto('/')
    
    // Desktop navigation links in intro text
    await expect(page.getByRole('link', { name: /map/i }).first()).toBeVisible()
  })

  test('displays AI hero section on desktop', async ({ page }) => {
    // Use desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 })
    
    await page.goto('/')
    
    // AI hero section should be visible
    const aiSection = page.getByText(/Not sure where to go/i)
    await expect(aiSection).toBeVisible()
  })

  test('displays quick action buttons on mobile', async ({ page }) => {
    // Use mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/')
    
    // Mobile quick action buttons are in main content area
    // Use getByRole('main') to scope to the main content and avoid matching nav links
    const main = page.getByRole('main')
    
    // "Random" and "Browse" are buttons, "Map" and "Chat" are links styled as buttons
    await expect(main.getByRole('button', { name: 'Random' })).toBeVisible()
    await expect(main.getByRole('link', { name: 'Map' })).toBeVisible()
    await expect(main.getByRole('link', { name: 'Chat' })).toBeVisible()
    await expect(main.getByRole('button', { name: 'Browse' })).toBeVisible()
  })
})

test.describe('Places Functionality', () => {
  // Place detail pages are accessed directly via URL (not via links from homepage)
  // Homepage place cards open modals, not links to /places/[id]
  // Dynamically fetch a valid place ID from sitemap - works for both local CSV (numeric IDs)
  // and production Airtable (record IDs like recXXXXXX)
  
  let validPlaceId: string = '1' // fallback for local development

  test.beforeAll(async ({ request }) => {
    try {
      const response = await request.get('/sitemap.xml')
      const text = await response.text()
      // Extract first place ID from sitemap (works for both /places/1 and /places/recXXXXXX)
      const match = text.match(/\/places\/([^<\s]+)/)
      if (match) {
        validPlaceId = match[1]
      }
    } catch {
      // Keep fallback if sitemap fetch fails
    }
  })

  test('place detail page loads directly', async ({ page }) => {
    // Navigate directly to a place detail page using dynamically fetched ID
    await page.goto(`/places/${validPlaceId}`)
    
    // Page should load successfully
    await expect(page.locator('main')).toBeVisible()
    // Should not show "Place not found"
    await expect(page.getByText('Place not found')).not.toBeVisible()
  })

  test('place detail page shows place name in heading', async ({ page }) => {
    await page.goto(`/places/${validPlaceId}`)
    
    // The place name should appear in the h1 heading
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible()
    // Heading should have actual content (not empty)
    await expect(heading).not.toBeEmpty()
  })

  test('place detail page shows description section', async ({ page }) => {
    await page.goto(`/places/${validPlaceId}`)
    
    // Description section should be visible
    await expect(page.getByText(/Description/i)).toBeVisible()
  })

  test('place detail page shows share button', async ({ page }) => {
    await page.goto(`/places/${validPlaceId}`)
    
    // Should have share button - use getByRole to target the button specifically
    await expect(page.getByRole('button', { name: 'Share Place' })).toBeVisible()
  })
})

test.describe('Map Page', () => {
  test('map shows on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    
    await page.goto('/map')
    await page.waitForLoadState('domcontentloaded')
    
    // Wait for Google Maps to load - look for the gm-style class added by Google Maps
    const mapContainer = page.locator('.gm-style').first()
    await expect(mapContainer).toBeVisible({ timeout: 60000 })
  })

  test('map page shows place count on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    
    await page.goto('/map')
    await page.waitForLoadState('domcontentloaded')
    
    // Heading should show place count
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toContainText(/\d+ Third Places/i, { timeout: 30000 })
  })

  test('map page shows filter sidebar on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    
    await page.goto('/map')
    await page.waitForLoadState('domcontentloaded')
    
    // Filter sidebar should be visible on desktop - use data-testid for stability
    const sidebar = page.getByTestId('filter-sidebar')
    await expect(sidebar).toBeVisible({ timeout: 60000 })
  })
})

test.describe('PlaceCard Interaction', () => {
  test('clicking place card opens modal on homepage', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    
    // Wait for the browse section to load (contains DataTable with PlaceCards)
    const browseSection = page.getByTestId('browse-section')
    await expect(browseSection).toBeVisible({ timeout: 60000 })
    
    // Scroll browse section into view first
    await browseSection.evaluate(el => el.scrollIntoView({ block: 'start' }))
    await page.waitForTimeout(2000)
    
    // Find a clickable place card
    const placeCard = page.locator('[data-testid="place-card"]').first()
    
    if (await placeCard.count() > 0) {
      // For virtualized content, use dispatchEvent to click directly
      // because the element may be styled with absolute positioning that
      // makes Playwright think it's "outside the viewport"
      await placeCard.dispatchEvent('click')
      
      // Radix Dialog should appear with role="dialog"
      const dialog = page.locator('[role="dialog"]')
      await expect(dialog).toBeVisible({ timeout: 5000 })
    }
  })

  test('modal has close button', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    
    // Wait for the browse section and cards to load
    const browseSection = page.getByTestId('browse-section')
    await expect(browseSection).toBeVisible({ timeout: 60000 })
    
    // Scroll browse section into view first
    await browseSection.evaluate(el => el.scrollIntoView({ block: 'start' }))
    await page.waitForTimeout(2000)
    
    const placeCard = page.locator('[data-testid="place-card"]').first()
    
    if (await placeCard.count() > 0) {
      // Use dispatchEvent for virtualized content
      await placeCard.dispatchEvent('click')
      
      // Wait for dialog
      const dialog = page.locator('[role="dialog"]')
      await expect(dialog).toBeVisible({ timeout: 5000 })
      
      // Close button in footer should be visible (use .first() since there's also an X button)
      const closeButton = dialog.getByRole('button', { name: /close/i }).first()
      await expect(closeButton).toBeVisible()
      
      // Clicking close should dismiss the modal
      await closeButton.click()
      
      await expect(dialog).not.toBeVisible()
    }
  })
})

/**
 * INP (Interaction to Next Paint) Performance Tests
 * 
 * These tests measure interaction responsiveness for WARM STATE interactions.
 * We test the experience of users who are already on the site, not cold-start.
 * 
 * Strategy: Pre-warm → Reset → Measure
 * 1. Perform interaction once (loads lazy chunks, initializes state)
 * 2. Reset/close the interaction
 * 3. Measure the same interaction again
 * 
 * Target: < 200ms for good INP, < 500ms for acceptable INP
 */
test.describe('INP Performance (Warm State)', () => {
  const INP_THRESHOLD_MS = 500 // Acceptable threshold - good is < 200ms

  test('place card click opens modal within INP threshold', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // Wait for place cards to load
    const browseSection = page.getByTestId('browse-section')
    await expect(browseSection).toBeVisible({ timeout: 60000 })
    await page.waitForTimeout(2000)

    const placeCard = page.locator('[data-testid="place-card"]').first()
    const dialog = page.locator('[role="dialog"]')

    if (await placeCard.count() > 0) {
      // PRE-WARM: Open modal once to load lazy chunks, then close it
      // Use dispatchEvent for virtualized content that has absolute positioning
      await placeCard.dispatchEvent('click')
      await expect(dialog).toBeVisible({ timeout: 5000 })
      
      // Close the modal (click close button or press Escape)
      await page.keyboard.press('Escape')
      await expect(dialog).toBeHidden({ timeout: 2000 })
      await page.waitForTimeout(300) // Brief settle time

      // MEASURE: Now measure the warm interaction
      const startTime = Date.now()
      await placeCard.dispatchEvent('click')
      await expect(dialog).toBeVisible({ timeout: 2000 })
      const endTime = Date.now()

      const interactionTime = endTime - startTime
      console.log(`Place card click to modal visible (warm): ${interactionTime}ms`)

      // Warm modal should appear quickly - no lazy loading overhead
      expect(interactionTime).toBeLessThan(INP_THRESHOLD_MS)
    }
  })

  test('filter select interaction responds within INP threshold', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // Wait for content to load
    const browseSection = page.getByTestId('browse-section')
    await expect(browseSection).toBeVisible({ timeout: 60000 })
    
    // Scroll to browse section so filters are visible
    await browseSection.scrollIntoViewIfNeeded()
    await page.waitForTimeout(500) // Let filters render

    // Look for a filter select/button - must be visible
    const filterTrigger = page.locator('button[aria-haspopup="listbox"], button[aria-haspopup="dialog"]').first()

    // Skip if no visible filter trigger (mobile view may hide sidebar filters)
    if (await filterTrigger.count() > 0 && await filterTrigger.isVisible()) {
      // PRE-WARM: Open dropdown once to load lazy chunks, then close it
      await filterTrigger.click()
      await page.waitForTimeout(500) // Wait for dropdown to render
      await page.keyboard.press('Escape') // Close dropdown
      await page.waitForTimeout(300) // Brief settle time

      // MEASURE: Now measure the warm interaction
      const startTime = Date.now()
      await filterTrigger.click()
      const endTime = Date.now()

      const interactionTime = endTime - startTime
      console.log(`Filter select click time (warm): ${interactionTime}ms`)

      expect(interactionTime).toBeLessThan(INP_THRESHOLD_MS)
    }
  })

  // Note: Navigation test removed - SSR navigation is inherently cold and not representative
  // of INP. Consider adding back when implementing View Transitions or client-side routing.
})

test.describe('Keyboard Navigation in Virtualized Picker', () => {
  test('keyboard navigation scrolls items into view in picker modal', async ({ page }) => {
    // Use mobile viewport to get the picker modal
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    
    // Wait for the browse section to be visible
    const browseSection = page.getByTestId('browse-section')
    await expect(browseSection).toBeVisible({ timeout: 60000 })
    
    // Open filter drawer on mobile
    const filterButton = page.locator('[data-testid="filter-drawer-trigger"], button:has-text("Filters")').first()
    
    // Skip if no filter button visible
    if (await filterButton.count() > 0 && await filterButton.isVisible()) {
      await filterButton.click()
      await page.waitForTimeout(300)
      
      // Find a picker trigger (neighborhood or name filter)
      const pickerTrigger = page.locator('button[aria-haspopup="dialog"]:has-text("Neighborhood"), button[aria-haspopup="dialog"]:has-text("Name")').first()
      
      if (await pickerTrigger.count() > 0 && await pickerTrigger.isVisible()) {
        // Use force: true to bypass the Vaul drawer overlay that intercepts pointer events
        await pickerTrigger.click({ force: true })
        await page.waitForTimeout(500)
        
        // The modal should be open
        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible({ timeout: 5000 })
        
        // Navigate down with keyboard - press End to jump to last item
        await page.keyboard.press('End')
        await page.waitForTimeout(200)
        
        // The highlighted item should be visible (not scrolled out of view)
        const highlightedItem = page.locator('[data-highlighted]')
        if (await highlightedItem.count() > 0) {
          await expect(highlightedItem).toBeVisible()
        }
        
        // Navigate to top with Home
        await page.keyboard.press('Home')
        await page.waitForTimeout(200)
        
        // First item should be highlighted and visible
        const firstHighlighted = page.locator('[data-highlighted]')
        if (await firstHighlighted.count() > 0) {
          await expect(firstHighlighted).toBeVisible()
        }
        
        // Close dialog
        await page.keyboard.press('Escape')
      }
    }
  })

  test('keyboard navigation works in desktop VirtualizedSelect', async ({ page }) => {
    // Use desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 })
    
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    
    // Wait for the browse section to be visible
    const browseSection = page.getByTestId('browse-section')
    await expect(browseSection).toBeVisible({ timeout: 60000 })
    
    // Find a filter combobox
    const filterTrigger = page.locator('button[role="combobox"]').first()
    
    if (await filterTrigger.count() > 0 && await filterTrigger.isVisible()) {
      await filterTrigger.click()
      await page.waitForTimeout(300)
      
      // Check that the listbox is visible
      const listbox = page.getByRole('listbox')
      await expect(listbox).toBeVisible({ timeout: 3000 })
      
      // Close with Escape
      await page.keyboard.press('Escape')
      await page.waitForTimeout(200)
      
      // Listbox should be hidden
      await expect(listbox).not.toBeVisible()
    }
  })
})

test.describe('Shuffle Functionality', () => {
  test('desktop shuffle button is visible and clickable', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // Wait for the feed section to load
    const feedSection = page.locator('#stack-section')
    await expect(feedSection).toBeVisible({ timeout: 60000 })

    // Find shuffle button in the feed section (button with shuffle icon)
    const shuffleButton = feedSection.locator('button').filter({ has: page.locator('svg') })
    
    if (await shuffleButton.count() > 0) {
      const firstButton = shuffleButton.first()
      await expect(firstButton).toBeVisible({ timeout: 10000 })
      
      // Click should not error
      await firstButton.click()
      
      // Page should still be functional after shuffle
      await expect(feedSection).toBeVisible()
    }
  })

  test('mobile shuffle button shuffles carousel', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // Wait for mobile carousel to load
    const feedSection = page.locator('#stack-section')
    await expect(feedSection).toBeVisible({ timeout: 60000 })

    // Find shuffle button (button with icon)
    const shuffleButton = feedSection.locator('button').filter({ has: page.locator('svg') })
    
    if (await shuffleButton.count() > 0) {
      const firstButton = shuffleButton.first()
      await expect(firstButton).toBeVisible({ timeout: 10000 })
      
      // Click shuffle
      await firstButton.click()
      
      // Page should still be functional (no errors)
      await expect(page.locator('main')).toBeVisible()
      await expect(feedSection).toBeVisible()
    }
  })

  test('shuffle does not break carousel navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    
    // Wait for feed section
    const feedSection = page.locator('#stack-section')
    await expect(feedSection).toBeVisible({ timeout: 60000 })
    
    // Find and click shuffle button
    const shuffleButton = feedSection.locator('button').filter({ has: page.locator('svg') })
    
    if (await shuffleButton.count() > 0) {
      await shuffleButton.first().click()
      await page.waitForTimeout(500) // Wait for shuffle animation
      
      // The carousel should still be visible and contain place cards
      const carouselItems = feedSection.locator('[class*="carousel"]')
      await expect(carouselItems.first()).toBeVisible({ timeout: 5000 })
      
      // Page should remain interactive
      await expect(page.locator('main')).toBeVisible()
    }
  })
})
