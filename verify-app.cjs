const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, 'docs', 'screenshots');

(async () => {
  // Ensure screenshots directory exists
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const allErrors = [];
  const allWarnings = [];

  const page = await context.newPage();

  // Collect console messages
  page.on('console', msg => {
    if (msg.type() === 'error') allErrors.push(`[${msg.type()}] ${msg.text()}`);
    if (msg.type() === 'warning') allWarnings.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Collect network failures
  page.on('requestfailed', request => {
    allErrors.push(`[network] ${request.method()} ${request.url()} - ${request.failure().errorText}`);
  });

  // Helper to take screenshot with metadata
  async function screenshot(name, url, opts = {}) {
    const start = Date.now();
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    } catch (e) {
      // Some pages redirect, that's ok
    }
    await page.waitForTimeout(1500);
    const loadTime = Date.now() - start;

    const filePath = path.join(SCREENSHOTS_DIR, `${name}.png`);
    await page.screenshot({ path: filePath, fullPage: opts.fullPage || false });

    // Get page title and URL
    const title = await page.title();
    const currentUrl = page.url();

    console.log(`✓ ${name} | ${loadTime}ms | ${currentUrl}`);
    return { name, loadTime, title, url: currentUrl, file: filePath };
  }

  console.log('=== VERIFICACIÓN COMPLETA DE LA APLICACIÓN ===\n');

  // ============================================
  // 1. PÁGINAS PÚBLICAS (sin autenticación)
  // ============================================
  console.log('--- 1. PÁGINAS PÚBLICAS ---');

  const login = await screenshot('01-login', 'http://localhost:5173/login', { fullPage: true });
  const register = await screenshot('02-register', 'http://localhost:5173/register', { fullPage: true });
  const forgotPassword = await screenshot('03-forgot-password', 'http://localhost:5173/forgot-password', { fullPage: true });
  const notFound = await screenshot('04-404', 'http://localhost:5173/nonexistent', { fullPage: true });
  const unauthorized = await screenshot('05-unauthorized', 'http://localhost:5173/unauthorized', { fullPage: true });

  // ============================================
  // 2. VERIFICAR FORMULARIO DE LOGIN
  // ============================================
  console.log('\n--- 2. FORMULARIO DE LOGIN ---');

  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Check form elements exist
  const emailInput = await page.$('input[type="email"]');
  const passwordInput = await page.$('input[type="password"]');
  const submitBtn = await page.$('button[type="submit"]');
  const forgotLink = await page.$('a[href="/forgot-password"]');
  const registerLink = await page.$('a[href="/register"]');

  console.log(`  Email input: ${emailInput ? '✓' : '✗'}`);
  console.log(`  Password input: ${passwordInput ? '✓' : '✗'}`);
  console.log(`  Submit button: ${submitBtn ? '✓' : '✗'}`);
  console.log(`  Forgot password link: ${forgotLink ? '✓' : '✗'}`);
  console.log(`  Register link: ${registerLink ? '✓' : '✗'}`);

  // Test login form validation (empty submit)
  await page.click('button[type="submit"]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-login-validation.png'), fullPage: true });
  console.log('  Empty submit validation: screenshot taken');

  // Test password visibility toggle
  const toggleBtn = await page.$('.toggle-password');
  if (toggleBtn) {
    await toggleBtn.click();
    await page.waitForTimeout(300);
    const passwordType = await passwordInput.getAttribute('type');
    console.log(`  Password toggle: ${passwordType === 'text' ? '✓ shows text' : '✗'}`);
    await toggleBtn.click(); // toggle back
  }

  // ============================================
  // 3. VERIFICAR FORMULARIO DE REGISTRO
  // ============================================
  console.log('\n--- 3. FORMULARIO DE REGISTRO ---');

  await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Check form elements
  const nameInput = await page.$('input[name="full_name"]');
  const docInput = await page.$('input[name="document_number"]');
  const regEmailInput = await page.$('input[name="email"]');
  const regPasswordInput = await page.$('input[name="password"]');
  const confirmInput = await page.$('input[name="confirmPassword"]');
  const roleOptions = await page.$$('.role-option');
  const submitRegBtn = await page.$('button[type="submit"]');

  console.log(`  Name input: ${nameInput ? '✓' : '✗'}`);
  console.log(`  Document input: ${docInput ? '✓' : '✗'}`);
  console.log(`  Email input: ${regEmailInput ? '✓' : '✗'}`);
  console.log(`  Password input: ${regPasswordInput ? '✓' : '✗'}`);
  console.log(`  Confirm password: ${confirmInput ? '✓' : '✗'}`);
  console.log(`  Role options: ${roleOptions.length} found`);
  console.log(`  Submit button: ${submitRegBtn ? '✓' : '✗'}`);

  // Test role selection
  if (roleOptions.length >= 2) {
    await roleOptions[1].click(); // Select PROFESIONAL
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07-register-profesional.png'), fullPage: true });
    console.log('  PROFESIONAL role selected: screenshot taken');

    // Check if dependency selector appears
    const depSelector = await page.$('.dependency-selector');
    console.log(`  Dependency selector visible: ${depSelector ? '✓' : '✗'}`);
  }

  // Test password strength indicator
  await page.fill('input[name="password"]', 'abc');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08-register-weak-password.png'), fullPage: true });
  console.log('  Weak password indicator: screenshot taken');

  await page.fill('input[name="password"]', 'abc123DEF!');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09-register-strong-password.png'), fullPage: true });
  console.log('  Strong password indicator: screenshot taken');

  // ============================================
  // 4. RESPONSIVE (Mobile)
  // ============================================
  console.log('\n--- 4. RESPONSIVE (Mobile 375px) ---');

  await context.close();
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'
  });
  const mobilePage = await mobileContext.newPage();

  mobilePage.on('console', msg => {
    if (msg.type() === 'error') allErrors.push(`[mobile] ${msg.text()}`);
  });

  await mobilePage.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: path.join(SCREENSHOTS_DIR, '10-mobile-login.png'), fullPage: true });
  console.log('  Mobile login: screenshot taken');

  await mobilePage.goto('http://localhost:5173/register', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: path.join(SCREENSHOTS_DIR, '11-mobile-register.png'), fullPage: true });
  console.log('  Mobile register: screenshot taken');

  await mobileContext.close();

  // ============================================
  // 5. RESUMEN DE ERRORES
  // ============================================
  console.log('\n--- 5. RESUMEN DE ERRORES ---');
  console.log(`  Errores en consola: ${allErrors.length}`);
  allErrors.forEach(e => console.log(`    - ${e.substring(0, 120)}`));
  console.log(`  Warnings: ${allWarnings.length}`);

  // ============================================
  // 6. GENERAR REPORTE
  // ============================================
  const report = {
    date: new Date().toISOString(),
    pages: [login, register, forgotPassword, notFound, unauthorized],
    errors: allErrors,
    warnings: allWarnings,
    screenshots: fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png')),
  };

  fs.writeFileSync(
    path.join(SCREENSHOTS_DIR, 'report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log(`\n✓ Reporte guardado en docs/screenshots/report.json`);
  console.log(`✓ ${report.screenshots.length} screenshots tomados`);

  await browser.close();
})();
