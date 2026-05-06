import { expect, test, type Locator } from '@playwright/test'

test.use({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  hasTouch: true,
  isMobile: true,
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
})

test.describe('PhotosModal mobile behavior', () => {
  test('opens from homepage and shows the mobile filmstrip without scrolling the page', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const homeCarousel = page.getByTestId('card-carousel')
    await expect(homeCarousel).toBeVisible({ timeout: 60000 })
    await homeCarousel.scrollIntoViewIfNeeded()

    const viewPhotosButton = homeCarousel
      .locator('button[aria-label="View photos"]')
      .filter({ visible: true })
      .first()
    await expect(viewPhotosButton).toBeVisible({ timeout: 10000 })
    await viewPhotosButton.click()

    const dialog = page.getByRole('dialog', { name: /photos/i })
    await expect(dialog).toBeVisible({ timeout: 10000 })

    const initialScrollY = await page.evaluate(() => window.scrollY)

    // Filmstrip is always visible on mobile when there are 2+ photos.
    const filmstrip = dialog.getByTestId('photos-modal-filmstrip')
    await expect(filmstrip).toBeVisible()

    const state = await readPhotoState(dialog)
    expect(state.total).toBeGreaterThan(1)
    expect(state.current).toBe(1)

    const firstThumb = dialog.getByTestId('filmstrip-thumb-0')
    await expect(firstThumb).toBeVisible()
    await expect(firstThumb).toHaveAttribute('data-active', 'true')
    await expect(dialog.getByTestId('filmstrip-thumb-1')).toHaveAttribute('data-active', 'false')
    await expect(dialog.getByRole('button', { name: 'Previous photo' })).toHaveCount(0)
    await expect(dialog.getByRole('button', { name: 'Next photo' })).toHaveCount(0)

    // Page beneath the modal must not have scrolled.
    expect(await page.evaluate(() => window.scrollY)).toBe(initialScrollY)
  })
})

async function readPhotoState(dialog: Locator) {
  const label = await dialog.getByText(/Photo \d+ of \d+/).first().textContent()
  const match = label?.match(/Photo (\d+) of (\d+)/)

  if (!match) {
    throw new Error(`Unable to read photo label: ${label ?? 'missing'}`)
  }

  return {
    current: Number(match[1]),
    total: Number(match[2]),
  }
}
