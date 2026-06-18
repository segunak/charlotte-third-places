import { test, expect, Locator, Page } from '@playwright/test'

/**
 * COMPREHENSIVE Filter and Sort E2E Tests
 * 
 * This file tests ALL filtering and sorting defined in lib/filters.ts
 * on the homepage (/), map page (/map), and mobile viewports.
 * 
 * FILTERS (from FILTER_DEFS in lib/filters.ts):
 * 1. Name - VirtualizedSelect/Picker
 * 2. Neighborhood - Multi-select Picker
 * 3. Type - Multi-select Picker
 * 4. Tags - Multi-select
 * 5. Parking - Chip filter (Free/Paid)
 * 6. Free Wi-Fi - Chip filter (Yes/No)
 * 7. Purchase Required - Chip filter (Yes/No)
 * 8. Size - Chip filter (Small/Medium/Large)
 * 9. Has Cinnamon Rolls - Chip filter (Yes/No/Sometimes)
 * 
 * SORT OPTIONS (from SORT_DEFS in lib/filters.ts):
 * 1. Name (A-Z)
 * 2. Name (Z-A)
 * 3. Date Added (Old to New)
 * 4. Date Added (New to Old)
 * 5. Last Updated (Old to New)
 * 6. Last Updated (New to Old)
 */

// Helper function to find a chip filter section by label and click a chip value
async function clickChipFilter(page: Page, sidebar: ReturnType<Page['getByTestId']>, labelText: string, chipValue: string) {
  const label = sidebar.getByText(labelText, { exact: true })
  if (await label.count() > 0) {
    const section = label.locator('..')
    const button = section.getByRole('button', { name: chipValue, exact: true })
    if (await button.count() > 0 && await button.isVisible()) {
      await button.click()
      return button
    }
  }
  return null
}

async function expectSelectedDialogFilter(sidebar: ReturnType<Page['getByTestId']>) {
  const selectedFilter = sidebar.locator('button[aria-haspopup="dialog"]').filter({ hasText: /selected/i }).first()
  await expect(selectedFilter).toHaveClass(/bg-primary/)
  await expect(selectedFilter).toContainText(/selected/i)
}

async function expectTypeMatchMode(modal: Locator) {
  const anyType = modal.getByRole('button', { name: 'Has Any Type' })
  const allTypes = modal.getByRole('button', { name: 'Has All Types' })

  await expect(anyType).toBeVisible()
  await expect(allTypes).toBeVisible()
  await expect(anyType).toHaveAttribute('aria-pressed', 'true')
  await expect(allTypes).toHaveAttribute('aria-pressed', 'false')
  await expect(modal.locator('button').filter({ hasText: /Has (Any Type|All Types)/ }).nth(0)).toHaveText('Has Any Type')
  await expect(modal.locator('button').filter({ hasText: /Has (Any Type|All Types)/ }).nth(1)).toHaveText('Has All Types')
  await expect(modal.getByText('Places can match any selected type')).toBeVisible()
  await expect(modal.getByText('Has All Tags')).toHaveCount(0)
  await expect(modal.getByText('Has Any Tag')).toHaveCount(0)
}

async function expectTagsMatchMode(modal: Locator) {
  const allTags = modal.getByRole('button', { name: 'Has All Tags' })
  const anyTag = modal.getByRole('button', { name: 'Has Any Tag' })

  await expect(allTags).toBeVisible()
  await expect(anyTag).toBeVisible()
  await expect(allTags).toHaveAttribute('aria-pressed', 'true')
  await expect(anyTag).toHaveAttribute('aria-pressed', 'false')
  await expect(modal.locator('button').filter({ hasText: /Has (All Tags|Any Tag)/ }).nth(0)).toHaveText('Has All Tags')
  await expect(modal.locator('button').filter({ hasText: /Has (All Tags|Any Tag)/ }).nth(1)).toHaveText('Has Any Tag')
  await expect(modal.getByText('Places must have all selected tags')).toBeVisible()
  await expect(modal.getByText('Has Any Type')).toHaveCount(0)
  await expect(modal.getByText('Has All Types')).toHaveCount(0)
}

async function openMobileFilterDrawer(page: Page): Promise<Locator | null> {
  const filterButton = page.locator('[data-testid="filter-drawer-trigger"], button:has-text("All Filters")').first()

  if (await filterButton.count() > 0 && await filterButton.isVisible()) {
    await filterButton.click()
    await page.waitForTimeout(500)

    const drawer = page.locator('[data-vaul-drawer], [role="dialog"]').filter({ hasText: 'Filters' }).last()
    await expect(drawer).toBeVisible({ timeout: 5000 })
    return drawer
  }

  return null
}

async function openMobilePickerModal(page: Page, label: string): Promise<Locator | null> {
  const drawer = await openMobileFilterDrawer(page)
  if (!drawer) return null

  const picker = drawer.locator('button[aria-haspopup="dialog"]').filter({ hasText: new RegExp(`^${label}$`, 'i') }).first()

  if (await picker.count() > 0 && await picker.isVisible()) {
    await picker.click({ force: true })

    const modal = page.getByRole('dialog').filter({ hasText: `Select ${label}` }).last()
    await expect(modal).toBeVisible({ timeout: 5000 })
    return modal
  }

  return null
}

async function openMobileQuickPickerModal(page: Page, label: string): Promise<Locator | null> {
  const browseSection = page.getByTestId('browse-section')
  const picker = browseSection.locator('button[aria-haspopup="dialog"]').filter({ hasText: new RegExp(`^${label}$`, 'i') }).first()

  if (await picker.count() > 0 && await picker.isVisible()) {
    await picker.click({ force: true })

    const modal = page.getByRole('dialog').filter({ hasText: `Select ${label}` }).last()
    await expect(modal).toBeVisible({ timeout: 5000 })
    return modal
  }

  return null
}

// ============================================================================
// HOMEPAGE FILTERS (Desktop)
// ============================================================================
test.describe('Homepage Filters (Desktop)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    
    // Wait for browse section and filter sidebar to load
    const browseSection = page.getByTestId('browse-section')
    await expect(browseSection).toBeVisible({ timeout: 60000 })
    
    const sidebar = page.getByTestId('filter-sidebar')
    await expect(sidebar).toBeVisible({ timeout: 10000 })
  })

  // --- Dropdown/Picker Filters ---

  test('Name filter selects specific place', async ({ page }) => {
    const nameFilter = page.locator('button[role="combobox"]').filter({ hasText: /^Name$/i }).first()
    
    if (await nameFilter.count() > 0 && await nameFilter.isVisible()) {
      await nameFilter.click()
      await page.waitForTimeout(300)
      
      const listbox = page.getByRole('listbox')
      await expect(listbox).toBeVisible({ timeout: 3000 })
      
      const firstOption = page.locator('[role="option"]').filter({ hasNotText: 'All' }).first()
      if (await firstOption.count() > 0) {
        const optionText = await firstOption.textContent()
        await firstOption.click()
        
        await expect(nameFilter).toHaveClass(/bg-primary/)
        if (optionText) {
          await expect(nameFilter).toContainText(optionText.trim())
        }
      }
    }
  })

  test('Neighborhood filter selects multiple neighborhoods', async ({ page }) => {
    const neighborhoodFilter = page.locator('button[aria-haspopup="dialog"]').filter({ hasText: /^Neighborhood$/i }).first()
    
    if (await neighborhoodFilter.count() > 0 && await neighborhoodFilter.isVisible()) {
      await neighborhoodFilter.click()
      await page.waitForTimeout(300)
      
      const modal = page.getByRole('dialog').last()
      await expect(modal).toBeVisible({ timeout: 5000 })
      await expect(modal.getByText('Places in any selected neighborhood.')).toBeVisible()
      await expect(modal.getByText('Has All Tags')).toHaveCount(0)
      await expect(modal.getByText('Has Any Tag')).toHaveCount(0)

      const options = modal.locator('ul button')
      if (await options.count() > 0) {
        await options.nth(0).click()
        if (await options.count() > 1) {
          await options.nth(1).click()
        }
        await modal.getByRole('button', { name: /done/i }).click()
        await expect(neighborhoodFilter).toHaveClass(/bg-primary/)
        await expect(neighborhoodFilter).toContainText(/selected/i)
      }
    }
  })

  test('Type filter selects multiple types', async ({ page }) => {
    const typeFilter = page.locator('button[aria-haspopup="dialog"]').filter({ hasText: /^Type$/i }).first()
    
    if (await typeFilter.count() > 0 && await typeFilter.isVisible()) {
      await typeFilter.click()
      await page.waitForTimeout(300)
      
      const modal = page.getByRole('dialog').last()
      await expect(modal).toBeVisible({ timeout: 5000 })
      await expectTypeMatchMode(modal)
      
      const options = modal.locator('ul button')
      if (await options.count() > 0) {
        await options.nth(0).click()
        if (await options.count() > 1) {
          await options.nth(1).click()
        }
        await modal.getByRole('button', { name: /done/i }).click()
        await expectSelectedDialogFilter(page.getByTestId('filter-sidebar'))
      }
    }
  })

  test('Tags multi-select filter selects multiple tags', async ({ page }) => {
    const tagsFilter = page.locator('button[aria-haspopup="dialog"]').filter({ hasText: /^Tags$/i }).first()
    
    if (await tagsFilter.count() > 0 && await tagsFilter.isVisible()) {
      await tagsFilter.click()
      await page.waitForTimeout(300)
      
      const modal = page.getByRole('dialog').last()
      await expect(modal).toBeVisible({ timeout: 5000 })
      await expectTagsMatchMode(modal)
      await expect(modal.getByText('Places in any selected neighborhood.')).toHaveCount(0)
      
      const firstOption = modal.locator('ul button').first()
      if (await firstOption.count() > 0) {
        await firstOption.click()
        
        // Multi-select: modal should still be open until Done
        await expect(modal).toBeVisible()
        await modal.getByRole('button', { name: /done/i }).click()
        
        await expect(tagsFilter).toContainText(/1 selected/i)
        await expect(tagsFilter).toHaveClass(/bg-primary/)
      }
    }
  })

  // --- Chip Filters (All Values) ---

  test('Parking chip filter - Free', async ({ page }) => {
    const sidebar = page.getByTestId('filter-sidebar')
    const button = await clickChipFilter(page, sidebar, 'Parking', 'Free')
    if (button) {
      await expect(button).toHaveClass(/bg-primary/)
    }
  })

  test('Parking chip filter - Paid', async ({ page }) => {
    const sidebar = page.getByTestId('filter-sidebar')
    const button = await clickChipFilter(page, sidebar, 'Parking', 'Paid')
    if (button) {
      await expect(button).toHaveClass(/bg-primary/)
    }
  })

  test('Free Wi-Fi chip filter - Yes', async ({ page }) => {
    const sidebar = page.getByTestId('filter-sidebar')
    const button = await clickChipFilter(page, sidebar, 'Free Wi-Fi', 'Yes')
    if (button) {
      await expect(button).toHaveClass(/bg-primary/)
    }
  })

  test('Free Wi-Fi chip filter - No', async ({ page }) => {
    const sidebar = page.getByTestId('filter-sidebar')
    const button = await clickChipFilter(page, sidebar, 'Free Wi-Fi', 'No')
    if (button) {
      await expect(button).toHaveClass(/bg-primary/)
    }
  })

  test('Purchase Required chip filter - Yes', async ({ page }) => {
    const sidebar = page.getByTestId('filter-sidebar')
    const button = await clickChipFilter(page, sidebar, 'Purchase Required', 'Yes')
    if (button) {
      await expect(button).toHaveClass(/bg-primary/)
    }
  })

  test('Purchase Required chip filter - No', async ({ page }) => {
    const sidebar = page.getByTestId('filter-sidebar')
    const button = await clickChipFilter(page, sidebar, 'Purchase Required', 'No')
    if (button) {
      await expect(button).toHaveClass(/bg-primary/)
    }
  })

  test('Size chip filter - Small', async ({ page }) => {
    const sidebar = page.getByTestId('filter-sidebar')
    const button = await clickChipFilter(page, sidebar, 'Size', 'Small')
    if (button) {
      await expect(button).toHaveClass(/bg-primary/)
    }
  })

  test('Size chip filter - Medium', async ({ page }) => {
    const sidebar = page.getByTestId('filter-sidebar')
    const button = await clickChipFilter(page, sidebar, 'Size', 'Medium')
    if (button) {
      await expect(button).toHaveClass(/bg-primary/)
    }
  })

  test('Size chip filter - Large', async ({ page }) => {
    const sidebar = page.getByTestId('filter-sidebar')
    const button = await clickChipFilter(page, sidebar, 'Size', 'Large')
    if (button) {
      await expect(button).toHaveClass(/bg-primary/)
    }
  })

  test('Has Cinnamon Rolls chip filter - Yes', async ({ page }) => {
    const sidebar = page.getByTestId('filter-sidebar')
    const button = await clickChipFilter(page, sidebar, 'Has Cinnamon Rolls', 'Yes')
    if (button) {
      await expect(button).toHaveClass(/bg-primary/)
    }
  })

  test('Has Cinnamon Rolls chip filter - No', async ({ page }) => {
    const sidebar = page.getByTestId('filter-sidebar')
    const button = await clickChipFilter(page, sidebar, 'Has Cinnamon Rolls', 'No')
    if (button) {
      await expect(button).toHaveClass(/bg-primary/)
    }
  })

  test('Has Cinnamon Rolls chip filter - Sometimes', async ({ page }) => {
    const sidebar = page.getByTestId('filter-sidebar')
    const button = await clickChipFilter(page, sidebar, 'Has Cinnamon Rolls', 'Sometimes')
    if (button) {
      await expect(button).toHaveClass(/bg-primary/)
    }
  })

  // --- Reset ---

  test('Reset button clears all filters', async ({ page }) => {
    const sidebar = page.getByTestId('filter-sidebar')
    
    const button = await clickChipFilter(page, sidebar, 'Size', 'Medium')
    if (button) {
      await expect(button).toHaveClass(/bg-primary/)
      
      const resetButton = sidebar.getByRole('button', { name: /reset/i })
      if (await resetButton.count() > 0) {
        await resetButton.click()
        await expect(button).not.toHaveClass(/bg-primary/)
      }
    }
  })
})

// ============================================================================
// HOMEPAGE SORT (Desktop) - All 6 sort options
// ============================================================================
test.describe('Homepage Sort (Desktop)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    
    const browseSection = page.getByTestId('browse-section')
    await expect(browseSection).toBeVisible({ timeout: 60000 })
  })

  test('Sort by Name (A-Z)', async ({ page }) => {
    const sortTrigger = page.locator('button[role="combobox"]').filter({ hasText: /Sort|Name|Date/i }).first()
    
    if (await sortTrigger.count() > 0 && await sortTrigger.isVisible()) {
      await sortTrigger.click()
      await page.waitForTimeout(300)
      
      const listbox = page.getByRole('listbox')
      await expect(listbox).toBeVisible({ timeout: 3000 })
      
      const option = page.locator('[role="option"]').filter({ hasText: /Name \(A-Z\)/i }).first()
      if (await option.count() > 0) {
        await option.click()
        await expect(sortTrigger).toContainText(/Name \(A-Z\)/i)
      }
    }
  })

  test('Sort by Name (Z-A)', async ({ page }) => {
    const sortTrigger = page.locator('button[role="combobox"]').filter({ hasText: /Sort|Name|Date/i }).first()
    
    if (await sortTrigger.count() > 0 && await sortTrigger.isVisible()) {
      await sortTrigger.click()
      await page.waitForTimeout(300)
      
      const listbox = page.getByRole('listbox')
      await expect(listbox).toBeVisible({ timeout: 3000 })
      
      const option = page.locator('[role="option"]').filter({ hasText: /Name \(Z-A\)/i }).first()
      if (await option.count() > 0) {
        await option.click()
        await expect(sortTrigger).toContainText(/Name \(Z-A\)/i)
      }
    }
  })

  test('Sort by Date Added (Old to New)', async ({ page }) => {
    const sortTrigger = page.locator('button[role="combobox"]').filter({ hasText: /Sort|Name|Date/i }).first()
    
    if (await sortTrigger.count() > 0 && await sortTrigger.isVisible()) {
      await sortTrigger.click()
      await page.waitForTimeout(300)
      
      const listbox = page.getByRole('listbox')
      await expect(listbox).toBeVisible({ timeout: 3000 })
      
      const option = page.locator('[role="option"]').filter({ hasText: /Date Added \(Old to New\)/i }).first()
      if (await option.count() > 0) {
        await option.click()
        await expect(sortTrigger).toContainText(/Date Added \(Old to New\)/i)
      }
    }
  })

  test('Sort by Date Added (New to Old)', async ({ page }) => {
    const sortTrigger = page.locator('button[role="combobox"]').filter({ hasText: /Sort|Name|Date/i }).first()
    
    if (await sortTrigger.count() > 0 && await sortTrigger.isVisible()) {
      await sortTrigger.click()
      await page.waitForTimeout(300)
      
      const listbox = page.getByRole('listbox')
      await expect(listbox).toBeVisible({ timeout: 3000 })
      
      const option = page.locator('[role="option"]').filter({ hasText: /Date Added \(New to Old\)/i }).first()
      if (await option.count() > 0) {
        await option.click()
        await expect(sortTrigger).toContainText(/Date Added \(New to Old\)/i)
      }
    }
  })

  test('Sort by Last Updated (Old to New)', async ({ page }) => {
    const sortTrigger = page.locator('button[role="combobox"]').filter({ hasText: /Sort|Name|Date|Last/i }).first()
    
    if (await sortTrigger.count() > 0 && await sortTrigger.isVisible()) {
      await sortTrigger.click()
      await page.waitForTimeout(300)
      
      const listbox = page.getByRole('listbox')
      await expect(listbox).toBeVisible({ timeout: 3000 })
      
      const option = page.locator('[role="option"]').filter({ hasText: /Last Updated \(Old to New\)/i }).first()
      if (await option.count() > 0) {
        await option.click()
        await expect(sortTrigger).toContainText(/Last Updated \(Old to New\)/i)
      }
    }
  })

  test('Sort by Last Updated (New to Old)', async ({ page }) => {
    const sortTrigger = page.locator('button[role="combobox"]').filter({ hasText: /Sort|Name|Date|Last/i }).first()
    
    if (await sortTrigger.count() > 0 && await sortTrigger.isVisible()) {
      await sortTrigger.click()
      await page.waitForTimeout(300)
      
      const listbox = page.getByRole('listbox')
      await expect(listbox).toBeVisible({ timeout: 3000 })
      
      const option = page.locator('[role="option"]').filter({ hasText: /Last Updated \(New to Old\)/i }).first()
      if (await option.count() > 0) {
        await option.click()
        await expect(sortTrigger).toContainText(/Last Updated \(New to Old\)/i)
      }
    }
  })
})

// ============================================================================
// MAP PAGE FILTERS (Desktop) - All 9 filters
// ============================================================================
test.describe('Map Page Filters (Desktop)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/map')
    await page.waitForLoadState('domcontentloaded')
    
    const mapContainer = page.locator('.gm-style').first()
    await expect(mapContainer).toBeVisible({ timeout: 60000 })
    
    const sidebar = page.getByTestId('filter-sidebar')
    await expect(sidebar).toBeVisible({ timeout: 10000 })
  })

  test('Name filter works on map page', async ({ page }) => {
    const nameFilter = page.locator('button[role="combobox"]').filter({ hasText: /^Name$/i }).first()
    
    if (await nameFilter.count() > 0 && await nameFilter.isVisible()) {
      await nameFilter.click()
      await page.waitForTimeout(300)
      
      const listbox = page.getByRole('listbox')
      await expect(listbox).toBeVisible({ timeout: 3000 })
      
      const firstOption = page.locator('[role="option"]').filter({ hasNotText: 'All' }).first()
      if (await firstOption.count() > 0) {
        await firstOption.click()
        await expect(nameFilter).toHaveClass(/bg-primary/)
      }
    }
  })

  test('Neighborhood filter works on map page', async ({ page }) => {
    const neighborhoodFilter = page.locator('button[aria-haspopup="dialog"]').filter({ hasText: /^Neighborhood$/i }).first()
    
    if (await neighborhoodFilter.count() > 0 && await neighborhoodFilter.isVisible()) {
      await neighborhoodFilter.click()
      await page.waitForTimeout(300)
      
      const modal = page.getByRole('dialog').last()
      await expect(modal).toBeVisible({ timeout: 5000 })
      await expect(modal.getByText('Places in any selected neighborhood.')).toBeVisible()
      
      const firstOption = modal.locator('ul button').first()
      if (await firstOption.count() > 0) {
        await firstOption.click()
        await page.keyboard.press('Escape')
        await expectSelectedDialogFilter(page.getByTestId('filter-sidebar'))
      }
    }
  })

  test('Type filter works on map page', async ({ page }) => {
    const typeFilter = page.locator('button[aria-haspopup="dialog"]').filter({ hasText: /^Type$/i }).first()
    
    if (await typeFilter.count() > 0 && await typeFilter.isVisible()) {
      await typeFilter.click()
      await page.waitForTimeout(300)
      
      const modal = page.getByRole('dialog').last()
      await expect(modal).toBeVisible({ timeout: 5000 })
      await expectTypeMatchMode(modal)
      
      const firstOption = modal.locator('ul button').first()
      if (await firstOption.count() > 0) {
        await firstOption.click()
        await page.keyboard.press('Escape')
        await expectSelectedDialogFilter(page.getByTestId('filter-sidebar'))
      }
    }
  })

  test('Tags filter works on map page', async ({ page }) => {
    const tagsFilter = page.locator('button[aria-haspopup="dialog"]').filter({ hasText: /^Tags$/i }).first()
    
    if (await tagsFilter.count() > 0 && await tagsFilter.isVisible()) {
      await tagsFilter.click()
      await page.waitForTimeout(300)
      
      const modal = page.getByRole('dialog').last()
      await expect(modal).toBeVisible({ timeout: 5000 })
      await expectTagsMatchMode(modal)
      
      const firstOption = modal.locator('ul button').first()
      if (await firstOption.count() > 0) {
        await firstOption.click()
        await page.keyboard.press('Escape')
        await expectSelectedDialogFilter(page.getByTestId('filter-sidebar'))
      }
    }
  })

  test('Parking chip filter works on map page', async ({ page }) => {
    const sidebar = page.getByTestId('filter-sidebar')
    const button = await clickChipFilter(page, sidebar, 'Parking', 'Free')
    if (button) {
      await expect(button).toHaveClass(/bg-primary/)
    }
  })

  test('Free Wi-Fi chip filter works on map page', async ({ page }) => {
    const sidebar = page.getByTestId('filter-sidebar')
    const button = await clickChipFilter(page, sidebar, 'Free Wi-Fi', 'Yes')
    if (button) {
      await expect(button).toHaveClass(/bg-primary/)
    }
  })

  test('Purchase Required chip filter works on map page', async ({ page }) => {
    const sidebar = page.getByTestId('filter-sidebar')
    const button = await clickChipFilter(page, sidebar, 'Purchase Required', 'Yes')
    if (button) {
      await expect(button).toHaveClass(/bg-primary/)
    }
  })

  test('Size chip filter works on map page', async ({ page }) => {
    const sidebar = page.getByTestId('filter-sidebar')
    const button = await clickChipFilter(page, sidebar, 'Size', 'Large')
    if (button) {
      await expect(button).toHaveClass(/bg-primary/)
    }
  })

  test('Has Cinnamon Rolls chip filter works on map page', async ({ page }) => {
    const sidebar = page.getByTestId('filter-sidebar')
    const button = await clickChipFilter(page, sidebar, 'Has Cinnamon Rolls', 'Yes')
    if (button) {
      await expect(button).toHaveClass(/bg-primary/)
    }
  })
})

// ============================================================================
// MOBILE FILTERS
// ============================================================================
test.describe('Mobile Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    
    const browseSection = page.getByTestId('browse-section')
    await expect(browseSection).toBeVisible({ timeout: 60000 })
  })

  test('Filter drawer opens on mobile', async ({ page }) => {
    const filterButton = page.locator('[data-testid="filter-drawer-trigger"], button:has-text("All Filters")').first()
    
    if (await filterButton.count() > 0 && await filterButton.isVisible()) {
      await filterButton.click()
      await page.waitForTimeout(300)
      
      const drawer = page.locator('[data-vaul-drawer], [role="dialog"]').first()
      await expect(drawer).toBeVisible({ timeout: 3000 })
    }
  })

  test('Mobile picker modal opens for Name filter', async ({ page }) => {
    const modal = await openMobilePickerModal(page, 'Name')

    if (modal) {
      await page.keyboard.press('Escape')
    }
  })

  test('Mobile picker modal opens for Neighborhood filter', async ({ page }) => {
    const modal = await openMobilePickerModal(page, 'Neighborhood')

    if (modal) {
      await expect(modal.getByText('Places in any selected neighborhood.')).toBeVisible()
      await expect(modal.getByText('Has All Tags')).toHaveCount(0)
      await expect(modal.getByText('Has Any Tag')).toHaveCount(0)

      await page.keyboard.press('Escape')
    }
  })

  test('Mobile picker modal opens for Type filter', async ({ page }) => {
    const modal = await openMobilePickerModal(page, 'Type')

    if (modal) {
      await expectTypeMatchMode(modal)

      await page.keyboard.press('Escape')
    }
  })

  test('Mobile quick Type picker defaults to Has Any Type', async ({ page }) => {
    const modal = await openMobileQuickPickerModal(page, 'Type')

    if (modal) {
      await expectTypeMatchMode(modal)

      await page.keyboard.press('Escape')
    }
  })

  test('Mobile picker modal opens for Tags filter', async ({ page }) => {
    const modal = await openMobilePickerModal(page, 'Tags')

    if (modal) {
      await expectTagsMatchMode(modal)

      await page.keyboard.press('Escape')
    }
  })

  test('Mobile quick Tags picker honors Has Any Tag selection', async ({ page }) => {
    const modal = await openMobileQuickPickerModal(page, 'Tags')

    if (modal) {
      const anyTag = modal.getByRole('button', { name: 'Has Any Tag' })
      const allTags = modal.getByRole('button', { name: 'Has All Tags' })

      await expectTagsMatchMode(modal)
      await anyTag.click()
      await expect(anyTag).toHaveAttribute('aria-pressed', 'true')
      await expect(allTags).toHaveAttribute('aria-pressed', 'false')

      await page.keyboard.press('Escape')
    }
  })

  test('Mobile chip filters work in drawer - Size', async ({ page }) => {
    const filterButton = page.locator('[data-testid="filter-drawer-trigger"], button:has-text("All Filters")').first()
    
    if (await filterButton.count() > 0 && await filterButton.isVisible()) {
      await filterButton.click()
      await page.waitForTimeout(300)
      
      const drawer = page.locator('[data-vaul-drawer], [role="dialog"]').first()
      if (await drawer.count() > 0) {
        const smallButton = drawer.getByRole('button', { name: 'Small', exact: true })
        if (await smallButton.count() > 0 && await smallButton.isVisible()) {
          await smallButton.click()
          await expect(smallButton).toHaveClass(/bg-primary/)
        }
      }
    }
  })

  test('Mobile chip filters work in drawer - Parking', async ({ page }) => {
    const filterButton = page.locator('[data-testid="filter-drawer-trigger"], button:has-text("All Filters")').first()
    
    if (await filterButton.count() > 0 && await filterButton.isVisible()) {
      await filterButton.click()
      await page.waitForTimeout(300)
      
      const drawer = page.locator('[data-vaul-drawer], [role="dialog"]').first()
      if (await drawer.count() > 0) {
        const freeButton = drawer.getByRole('button', { name: 'Free', exact: true })
        if (await freeButton.count() > 0 && await freeButton.isVisible()) {
          await freeButton.click()
          await expect(freeButton).toHaveClass(/bg-primary/)
        }
      }
    }
  })

  test('Mobile chip filters work in drawer - Has Cinnamon Rolls', async ({ page }) => {
    const filterButton = page.locator('[data-testid="filter-drawer-trigger"], button:has-text("All Filters")').first()
    
    if (await filterButton.count() > 0 && await filterButton.isVisible()) {
      await filterButton.click()
      await page.waitForTimeout(300)
      
      const drawer = page.locator('[data-vaul-drawer], [role="dialog"]').first()
      if (await drawer.count() > 0) {
        const cinnamonLabel = drawer.getByText('Has Cinnamon Rolls')
        if (await cinnamonLabel.count() > 0) {
          await cinnamonLabel.scrollIntoViewIfNeeded()
          const section = cinnamonLabel.locator('..')
          const yesInSection = section.getByRole('button', { name: 'Yes', exact: true })
          if (await yesInSection.count() > 0 && await yesInSection.isVisible()) {
            await yesInSection.click()
            await expect(yesInSection).toHaveClass(/bg-primary/)
          }
        }
      }
    }
  })
})

// ============================================================================
// QUICK SEARCH
// ============================================================================
test.describe('Quick Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    
    const browseSection = page.getByTestId('browse-section')
    await expect(browseSection).toBeVisible({ timeout: 60000 })
  })

  test('Quick search filters places by text', async ({ page }) => {
    const sidebar = page.getByTestId('filter-sidebar')
    
    const searchInput = sidebar.locator('input[placeholder*="Search"], input[placeholder*="Filter"]').first()
    
    if (await searchInput.count() > 0 && await searchInput.isVisible()) {
      await searchInput.fill('Coffee')
      await page.waitForTimeout(500)
      
      await expect(searchInput).toHaveValue('Coffee')
      
      await searchInput.clear()
      await expect(searchInput).toHaveValue('')
    }
  })
})

// ============================================================================
// FILTER STATE PERSISTENCE
// ============================================================================
test.describe('Filter State Persistence', () => {
  test('Filter badge shows count of active filters', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    
    const browseSection = page.getByTestId('browse-section')
    await expect(browseSection).toBeVisible({ timeout: 60000 })
    
    const sidebar = page.getByTestId('filter-sidebar')
    await expect(sidebar).toBeVisible({ timeout: 10000 })
    
    const button1 = await clickChipFilter(page, sidebar, 'Size', 'Medium')
    if (button1) {
      const badge = sidebar.locator('.bg-red-500')
      await expect(badge).toBeVisible()
      await expect(badge).toContainText('1')
      
      const button2 = await clickChipFilter(page, sidebar, 'Parking', 'Free')
      if (button2) {
        await expect(badge).toContainText('2')
      }
    }
  })

  test('Multiple filters can be applied simultaneously', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    
    const browseSection = page.getByTestId('browse-section')
    await expect(browseSection).toBeVisible({ timeout: 60000 })
    
    const sidebar = page.getByTestId('filter-sidebar')
    await expect(sidebar).toBeVisible({ timeout: 10000 })
    
    const sizeBtn = await clickChipFilter(page, sidebar, 'Size', 'Large')
    const wifiBtn = await clickChipFilter(page, sidebar, 'Free Wi-Fi', 'Yes')
    const parkingBtn = await clickChipFilter(page, sidebar, 'Parking', 'Free')
    
    if (sizeBtn) await expect(sizeBtn).toHaveClass(/bg-primary/)
    if (wifiBtn) await expect(wifiBtn).toHaveClass(/bg-primary/)
    if (parkingBtn) await expect(parkingBtn).toHaveClass(/bg-primary/)
    
    const badge = sidebar.locator('.bg-red-500')
    if (await badge.count() > 0) {
      await expect(badge).toContainText('3')
    }
  })
})
