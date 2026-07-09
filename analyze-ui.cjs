const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // Go to login page
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/01-login.png', fullPage: true });
  console.log('Screenshot: login page');

  // Go to main page (will redirect)
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/02-home.png', fullPage: true });
  console.log('Screenshot: home page');

  // Go to register
  await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/03-register.png', fullPage: true });
  console.log('Screenshot: register page');

  // Go to dashboard (will redirect to login if not authenticated)
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/04-dashboard.png', fullPage: true });
  console.log('Screenshot: dashboard page');

  // Go to 404 page
  await page.goto('http://localhost:5173/nonexistent', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/05-404.png', fullPage: true });
  console.log('Screenshot: 404 page');

  // Check console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);
  
  console.log('\nConsole errors:', errors.length ? errors.join('\n') : 'None');

  await browser.close();
})();
