import { test, expect } from '@playwright/test'

// Note: This is a smoke test skeleton. It assumes the dev server is running.
// It stubs camera/mic permissions and intercepts network for submit endpoint.

test.describe('Record → preview → submit', () => {
  test('happy path (stubbed)', async ({ page, context }) => {
    await context.grantPermissions(['camera', 'microphone'])
    await page.addInitScript(() => {
      ;(window as any).__E2E__ = true
    })

    // Intercept API calls
    await page.route('**/api/projects/**', (route) => {
      return route.fulfill({ status: 200, body: JSON.stringify({ id: 'p1', name: 'Demo', description: 'desc', callToAction: 'cta', slug: 'demo' }) })
    })
    await page.route('**/api/testimonials', (route) => {
      return route.fulfill({ status: 200, body: JSON.stringify({ id: 't1' }) })
    })

    await page.goto('/record/demo')

    // Fill fields
    await page.getByLabel('Your Name').fill('Alex')
    await page.getByLabel('Email').fill('alex@example.com')

    // Switch to video mode
    await page.getByRole('button', { name: 'Video Testimonial' }).click()

  // Simulate recording
  await page.getByRole('button', { name: 'Simulate Recording (E2E)' }).click()

    // Submit
  await page.getByRole('button', { name: 'Submit Testimonial' }).click()

    // Expect success screen
    await expect(page.getByText('Thank You')).toBeVisible()
  })
})
