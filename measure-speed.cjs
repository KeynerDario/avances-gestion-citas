const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // Collect console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  // Measure login page load
  const start1 = Date.now();
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 15000 });
  const loginTime = Date.now() - start1;
  console.log(`Login page: ${loginTime}ms`);

  // Measure home redirect
  const start2 = Date.now();
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 15000 });
  const homeTime = Date.now() - start2;
  console.log(`Home redirect: ${homeTime}ms`);

  // Measure register page
  const start3 = Date.now();
  await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle', timeout: 15000 });
  const registerTime = Date.now() - start3;
  console.log(`Register page: ${registerTime}ms`);

  // Measure 404 page
  const start4 = Date.now();
  await page.goto('http://localhost:5173/nonexistent', { waitUntil: 'networkidle', timeout: 15000 });
  const notFoundTime = Date.now() - start4;
  console.log(`404 page: ${notFoundTime}ms`);

  console.log(`\nConsole errors: ${errors.length}`);
  errors.forEach(e => console.log(`  - ${e.substring(0, 100)}`));

  await browser.close();
})();
