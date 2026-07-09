import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

const USERS = [
  { email: 'admin@test.com', password: 'Test1234!', role: 'SUPERADMIN', expectedUrl: '/admin' },
  { email: 'coordinacion@test.com', password: 'Test1234!', role: 'COORDINACION', expectedUrl: '/coordination' },
  { email: 'profesional@test.com', password: 'Test1234!', role: 'PROFESIONAL', expectedUrl: '/professional' },
  { email: 'aprendiz@test.com', password: 'Test1234!', role: 'APRENDIZ', expectedUrl: '/dashboard' },
];

async function testLogins() {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  
  for (const user of USERS) {
    console.log(`\n=== Testing ${user.role}: ${user.email} ===`);
    
    // Fresh context per user
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('#login-email', user.email);
    await page.fill('#login-password', user.password);
    await page.click('.btn-login');
    await page.waitForTimeout(4000);
    
    const currentUrl = page.url();
    const hasError = await page.$('.auth-error');
    const errorText = hasError ? await hasError.textContent() : '';
    
    const passed = currentUrl.includes(user.expectedUrl) && !hasError;
    console.log(`URL: ${currentUrl}`);
    console.log(`Expected: ${user.expectedUrl}`);
    console.log(`Error: ${errorText || 'none'}`);
    console.log(`Result: ${passed ? 'PASS' : 'FAIL'}`);
    
    await page.screenshot({ path: `audit/login-${user.role.toLowerCase()}-${passed ? 'ok' : 'fail'}.png`, fullPage: true });
    
    results.push({ role: user.role, email: user.email, passed, url: currentUrl, error: errorText });
    await context.close();
  }
  
  console.log('\n=== SUMMARY ===');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.role}: ${r.email} -> ${r.url}`);
  }
  
  await browser.close();
}

testLogins().catch(console.error);
