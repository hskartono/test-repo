// Shared setup for specs that aren't exercising the splash screen itself.
// Navigates to the app, skips straight past the splash's real intro/fade
// timers via the test-only `window.__forceSplashTitle()` hook, and clicks
// Start so gameplay is live - matching what every one of these specs assumed
// before the splash screen gated the render loop behind a Start click.
export async function gotoAndStart(page) {
  await page.goto('/');
  await page.evaluate(() => window.__forceSplashTitle());
  await page.click('#start-button');
}
