import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

const USERS = [
  {
    full_name: 'Juan Aprendiz',
    document_number: '10000001',
    email: 'aprendiz@test.com',
    password: 'Test1234!',
    role: 'APRENDIZ'
  },
  {
    full_name: 'Maria Profesional',
    document_number: '10000002',
    email: 'profesional@test.com',
    password: 'Test1234!',
    role: 'PROFESIONAL',
    dependency: 'Psicología'
  },
  {
    full_name: 'Carlos Coordinador',
    document_number: '10000003',
    email: 'coordinacion@test.com',
    password: 'Test1234!',
    role: 'COORDINACION'
  },
  {
    full_name: 'Ana Admin',
    document_number: '10000004',
    email: 'admin@test.com',
    password: 'Test1234!',
    role: 'SUPERADMIN'
  }
];

async function registerUsers() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warn') {
      console.log(`[${msg.type()}]`, msg.text());
    }
  });
  
  for (const user of USERS) {
    console.log(`\n=== Registering ${user.role}: ${user.email} ===`);
    
    // Clear storage and go to register
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');
    
    // Wait for the form to be visible
    await page.waitForSelector('input[name="full_name"]', { timeout: 10000 });
    
    // Fill form
    await page.fill('input[name="full_name"]', user.full_name);
    await page.fill('input[name="document_number"]', user.document_number);
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', user.password);
    await page.fill('input[name="confirmPassword"]', user.password);
    
    // Select role
    const roleValue = user.role === 'SUPERADMIN' ? 'COORDINACION' : user.role;
    await page.evaluate((role) => {
      const radio = document.querySelector(`input[type="radio"][value="${role}"]`);
      if (radio) {
        radio.checked = true;
        radio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, roleValue);
    await page.waitForTimeout(500);
    
    // If professional, select dependency
    if (user.role === 'PROFESIONAL') {
      await page.waitForTimeout(1000);
      await page.evaluate(() => {
        const depRadio = document.querySelector('.dependency-option:first-child input[type="radio"]');
        if (depRadio) {
          depRadio.checked = true;
          depRadio.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      await page.waitForTimeout(300);
    }
    
    // Take screenshot
    await page.screenshot({ path: `audit/register-${user.role.toLowerCase()}-filled.png`, fullPage: true });
    
    // Submit
    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) {
        form.requestSubmit();
      }
    });
    await page.waitForTimeout(3000);
    
    // Check result
    const result = await page.evaluate(() => ({
      url: window.location.href,
      hasError: !!document.querySelector('.auth-error'),
      errorText: document.querySelector('.auth-error')?.textContent || '',
    }));
    
    console.log(`Result: ${JSON.stringify(result, null, 2)}`);
    
    if (result.hasError) {
      console.log(`FAILED: ${result.errorText}`);
    } else {
      console.log(`SUCCESS - Redirected to: ${result.url}`);
    }
    
    // Clear storage before next user
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.context().clearCookies();
  }
  
  await browser.close();
}

registerUsers().catch(console.error);
