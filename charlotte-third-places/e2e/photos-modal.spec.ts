import { expect, test, type Locator, type Page } from '@playwright/test'

test.use({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  hasTouch: true,
  isMobile: true,
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
})

test.describe('PhotosModal mobile swipe behavior', () => {
  test('opens from homepage and stops at the final photo', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text())
      }
    })

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
    const swipeSurface = dialog.locator('[data-slot="carousel"]').first()
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 })

    let state = await readPhotoState(dialog)
    expect(state.total).toBeGreaterThan(1)

    const nextButton = dialog.getByRole('button', { name: 'Next photo' })
    await expect(nextButton).toBeVisible()
    await nextButton.click()
    await expect
      .poll(async () => (await readPhotoState(dialog)).current, { timeout: 5000 })
      .toBeGreaterThan(state.current)
    state = await readPhotoState(dialog)

    while (state.current < state.total) {
      const previousPhoto = state.current
      await swipeLeft(page, swipeSurface)
      await expect
        .poll(async () => (await readPhotoState(dialog)).current, { timeout: 5000 })
        .toBeGreaterThan(previousPhoto)
      state = await readPhotoState(dialog)
    }

    await swipeLeft(page, swipeSurface)
    await swipeLeft(page, swipeSurface)

    await expect
      .poll(async () => (await readPhotoState(dialog)).current, { timeout: 5000 })
      .toBe(state.total)
    await expect(dialog).toBeVisible()
    await expect(nextButton).toBeDisabled()
    expect(await page.evaluate(() => window.scrollY)).toBe(initialScrollY)
    expect(consoleErrors).toEqual([])
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

async function swipeLeft(page: Page, target: Locator) {
  const box = await target.boundingBox()
  if (!box) {
    throw new Error('Unable to locate PhotosModal carousel swipe surface')
  }

  const cdp = await page.context().newCDPSession(page)
  const y = Math.round(box.y + box.height * 0.5)
  const startX = Math.round(box.x + box.width * 0.84)
  const endX = Math.round(box.x + box.width * 0.16)

  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: startX, y, id: 1, radiusX: 2, radiusY: 2, force: 1 }],
  })

  for (let step = 1; step <= 16; step += 1) {
    const x = Math.round(startX + (endX - startX) * (step / 16))
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y, id: 1, radiusX: 2, radiusY: 2, force: 1 }],
    })
    await page.waitForTimeout(8)
  }

  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await page.waitForTimeout(350)
}