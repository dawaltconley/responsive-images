import { test, expect } from '@playwright/test'

test('has title', async ({ page }) => {
  await page.goto('/')

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Responsive Images Test Page/)
})

test('basic working picture element', async ({ page }) => {
  await page.goto('/')
  const results = [
    { width: 1920, height: 1200, src: 800 },
    { width: 1024, height: 768, src: 1024 },
    { width: 432, height: 768, src: 432 },
  ]
  for (const { src, ...viewport } of results) {
    await page.setViewportSize(viewport)
    await page.reload()
    const vp = page.viewportSize()
    console.log({ vp })
    const img = page.getByAltText('image with a basic min-width query')
    await expect(img).toBeAttached()
    const currentSrc = await img.evaluate(
      img => img instanceof HTMLImageElement && img.currentSrc,
    )
    expect(currentSrc).toContain(`-${src}.`)
    // await expect(img).toHaveJSProperty(
    //   'currentSrc',
    //   expect.stringMatching(new RegExp(`-${src}\\.`)),
    // )
  }
})
