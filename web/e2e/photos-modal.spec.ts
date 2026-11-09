import { expect, test, type Locator, type Page } from '@playwright/test'

// Browser request interception must not be bypassed by a service worker.
test.use({ serviceWorkers: 'block' })

test.describe('PhotosModal mobile behavior', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    hasTouch: true,
    isMobile: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  })

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

  test('loads photos only when opened and restores the gallery through browser history', async ({ page }) => {
    let requestCount = 0
    let release!: () => void
    const ready = new Promise<void>((resolve) => { release = resolve })
    await mockPhotoImages(page)
    await page.route('**/api/places/*', async (route) => {
      requestCount += 1
      await ready
      await route.fulfill({ json: galleryResponse(route.request().url()) })
    })

    await page.goto('/')
    const carousel = page.getByTestId('card-carousel')
    await expect(carousel).toBeVisible({ timeout: 60000 })
    await carousel.scrollIntoViewIfNeeded()
    const card = carousel.getByTestId('place-card').filter({
      has: page.getByRole('button', { name: 'View photos', exact: true }),
    }).first()
    const name = (await card.locator('[data-slot="card-title"]').textContent())?.trim()
    expect(name).toBeTruthy()
    expect(requestCount).toBe(0)

    await card.locator('[data-slot="card-title"]').click()
    const placeDialog = page.getByRole('dialog', { name, exact: true })
    await expect(placeDialog).toBeVisible()
    expect(requestCount).toBe(0)
    await placeDialog.getByRole('button', { name: 'View photos', exact: true }).click()

    const gallery = page.getByRole('dialog', { name: `${name} Photos`, exact: true })
    await expect(gallery).toBeVisible()
    await expect(gallery.getByRole('status')).toHaveText('Loading photo list...')
    await expect(gallery.getByAltText(`${name} photo 1`, { exact: true })).toBeVisible()
    expect(requestCount).toBe(1)

    release()
    await expect(gallery.getByTestId('filmstrip-thumb-2')).toBeVisible()
    await expect(gallery.getByRole('status')).toHaveCount(0)
    expect((await readPhotoState(gallery)).total).toBe(3)

    await gallery.getByTestId('filmstrip-thumb-1').click()
    await expect(gallery.getByTestId('filmstrip-thumb-1')).toHaveAttribute('data-active', 'true')
    expect((await readPhotoState(gallery)).current).toBe(2)

    await page.goBack()
    await expect(gallery).toHaveCount(0)
    await expect(placeDialog).toBeVisible()

    await page.goForward()
    await expect(gallery).toBeVisible()
    await expect(gallery.getByTestId('filmstrip-thumb-2')).toBeVisible()
    await expect(gallery.getByRole('status')).toHaveCount(0)
    expect(requestCount).toBe(1)
  })

  test('keeps the gallery open when its photo request fails and permits retry', async ({ page }) => {
    let requestCount = 0
    await mockPhotoImages(page)
    await page.route('**/api/places/*', async (route) => {
      requestCount += 1
      if (requestCount === 1) {
        await route.fulfill({ status: 504, json: { error: 'Test timeout' } })
      } else {
        await route.fulfill({ json: galleryResponse(route.request().url()) })
      }
    })

    await page.goto('/')
    const carousel = page.getByTestId('card-carousel')
    await expect(carousel).toBeVisible({ timeout: 60000 })
    await carousel.scrollIntoViewIfNeeded()
    await carousel.getByRole('button', { name: 'View photos', exact: true }).filter({ visible: true }).first().click()

    const gallery = page.getByRole('dialog', { name: /photos/i })
    await expect(gallery.getByRole('alert')).toContainText('Could not load the photo list.')
    await expect(gallery.getByRole('button', { name: 'Close', exact: true })).toBeVisible()
    await gallery.getByRole('button', { name: 'Retry', exact: true }).click()

    await expect(gallery.getByTestId('filmstrip-thumb-2')).toBeVisible()
    await expect(gallery.getByRole('alert')).toHaveCount(0)
    expect(requestCount).toBe(2)
  })
})

test('loads the complete gallery and thumbnail rail on desktop', async ({ page }) => {
  await mockPhotoImages(page)
  await page.route('**/api/places/*', (route) => route.fulfill({
    json: galleryResponse(route.request().url()),
  }))
  await page.goto('/')
  await page.addStyleTag({ content: '* { animation: none !important; }' })
  const button = page.getByTestId('place-card')
    .getByRole('button', { name: 'View photos', exact: true })
    .filter({ visible: true })
    .first()
  await expect(button).toBeVisible({ timeout: 60000 })
  await button.click()

  const gallery = page.getByRole('dialog', { name: /photos/i })
  await expect(gallery.getByRole('button', { name: 'Go to photo 3', exact: true })).toBeVisible()
  await expect(gallery.getByRole('button', { name: 'Next photo', exact: true })).toBeVisible()
  await expect(gallery.getByTestId('photos-modal-filmstrip')).toHaveCount(0)
  expect((await readPhotoState(gallery)).total).toBe(3)
})

function galleryResponse(url: string) {
  const recordId = decodeURIComponent(new URL(url).pathname.split('/').pop() ?? '')
  return {
    recordId,
    photos: Array.from({ length: 3 }, (_, index) => ({
      display: `https://thirdplacesdata.blob.core.windows.net/photos/e2e/display/${index}.webp`,
      thumbnail: `https://thirdplacesdata.blob.core.windows.net/photos/e2e/thumbnail/${index}.webp`,
    })),
  }
}

async function mockPhotoImages(page: Page) {
  await page.route('https://thirdplacesdata.blob.core.windows.net/photos/e2e/**', (route) => route.fulfill({
    contentType: 'image/png',
    body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0u8AAAAASUVORK5CYII=', 'base64'),
  }))
}

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
