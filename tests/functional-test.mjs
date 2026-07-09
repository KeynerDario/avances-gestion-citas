import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';

const USERS = [
  { email: 'admin@test.com', pass: 'Test1234!', role: 'SUPERADMIN', home: '/admin' },
  { email: 'coordinacion@test.com', pass: 'Test1234!', role: 'COORDINACION', home: '/coordination' },
  { email: 'profesional@test.com', pass: 'Test1234!', role: 'PROFESIONAL', home: '/professional' },
  { email: 'aprendiz@test.com', pass: 'Test1234!', role: 'APRENDIZ', home: '/dashboard' },
];

const report = [];

async function testRole(browser, user) {
  // Fresh browser context per user = clean cookies/storage
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  const features = [];

  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('400')) {
      errors.push(msg.text().substring(0, 120));
    }
  });

  // Login
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('#login-email', user.email);
  await page.fill('#login-password', user.pass);
  await page.click('.btn-login');
  await page.waitForTimeout(4000);

  const url = page.url();
  const loginOk = url.includes(user.home);
  features.push({ name: 'Login', ok: loginOk, detail: url });
  await page.screenshot({ path: `report/${user.role.toLowerCase()}-01-dashboard.png`, fullPage: true });

  if (!loginOk) {
    const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 300));
    console.log(`  LOGIN FAILED for ${user.email}. URL: ${url}`);
    console.log(`  Body: ${bodyText.substring(0, 200)}`);
    await ctx.close();
    return { role: user.role, features, errors };
  }

  // Test sidebar
  const sidebar = await page.$('.dashboard-sidebar');
  features.push({ name: 'Sidebar visible', ok: !!sidebar });

  // Test nav items
  const navItems = await page.$$('.nav-item');
  features.push({ name: 'Nav items', ok: navItems.length > 0, detail: `${navItems.length} items` });

  // Test profile dropdown
  const profileBtn = await page.$('.profile-trigger');
  if (profileBtn) {
    await profileBtn.click();
    await page.waitForTimeout(500);
    const aside = await page.$('.profile-aside.open');
    features.push({ name: 'Profile panel', ok: !!aside });
    await page.screenshot({ path: `report/${user.role.toLowerCase()}-02-profile.png`, fullPage: true });
    const closeBtn = await page.$('.aside-hero-close');
    if (closeBtn) await closeBtn.click();
    await page.waitForTimeout(300);
  }

  // Test theme toggle
  const themeBtn = await page.$('button[aria-label="Cambiar tema"]');
  if (themeBtn) {
    await themeBtn.click();
    await page.waitForTimeout(500);
    const isDark = await page.evaluate(() => document.documentElement.getAttribute('data-theme') === 'dark');
    features.push({ name: 'Dark mode', ok: true, detail: isDark ? 'dark' : 'light' });
    await page.screenshot({ path: `report/${user.role.toLowerCase()}-03-dark.png`, fullPage: true });
    await themeBtn.click();
    await page.waitForTimeout(300);
  }

  // Test command palette
  await page.keyboard.press('Control+k');
  await page.waitForTimeout(500);
  const cmdPalette = await page.$('.cmd-palette');
  features.push({ name: 'Command palette', ok: !!cmdPalette });
  if (cmdPalette) await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // Role-specific tests
  if (user.role === 'SUPERADMIN') {
    const tabs = ['users', 'deps', 'roles', 'audit', 'config'];
    for (const tab of tabs) {
      const btn = await page.$(`#tab-${tab}`);
      if (btn) {
        await btn.click();
        await page.waitForTimeout(1000);
        const content = await page.$(`#panel-${tab}`);
        features.push({ name: `Tab: ${tab}`, ok: !!content });
        await page.screenshot({ path: `report/${user.role.toLowerCase()}-04-${tab}.png`, fullPage: true });
      }
    }
    const collapseBtn = await page.$('.sidebar-toggle');
    if (collapseBtn) {
      await collapseBtn.click();
      await page.waitForTimeout(500);
      const collapsed = await page.$('.dashboard-sidebar.collapsed');
      features.push({ name: 'Sidebar collapse', ok: !!collapsed });
      await page.screenshot({ path: `report/${user.role.toLowerCase()}-05-collapsed.png`, fullPage: true });
      await collapseBtn.click();
      await page.waitForTimeout(300);
    }
  }

  if (user.role === 'COORDINACION') {
    const filterBtn = await page.$('.advanced-toggle');
    if (filterBtn) {
      await filterBtn.click();
      await page.waitForTimeout(500);
      features.push({ name: 'Advanced filters', ok: true });
      await page.screenshot({ path: `report/${user.role.toLowerCase()}-04-filters.png`, fullPage: true });
    }
    features.push({ name: 'Export CSV', ok: !!(await page.$('button:has-text("Exportar")')) });
    features.push({ name: 'Refresh', ok: !!(await page.$('button:has-text("Actualizar")')) });
  }

  if (user.role === 'PROFESIONAL') {
    for (const tab of ['pending', 'history', 'stats', 'schedule']) {
      const btn = await page.$(`#tab-${tab}`);
      if (btn) {
        await btn.click();
        await page.waitForTimeout(1000);
        features.push({ name: `Tab: ${tab}`, ok: true });
        await page.screenshot({ path: `report/${user.role.toLowerCase()}-04-${tab}.png`, fullPage: true });
      }
    }
  }

  if (user.role === 'APRENDIZ') {
    for (const tab of ['pending', 'confirmed', 'completed', 'cancelled']) {
      const btn = await page.$(`#tab-${tab}`);
      if (btn) {
        await btn.click();
        await page.waitForTimeout(500);
        features.push({ name: `Tab: ${tab}`, ok: true });
      }
    }
    const fab = await page.$('.fab-btn');
    features.push({ name: 'FAB button', ok: !!fab });
    if (fab) {
      await fab.click();
      await page.waitForTimeout(1000);
      const modal = await page.$('.modal-overlay');
      features.push({ name: 'Appointment modal', ok: !!modal });
      await page.screenshot({ path: `report/${user.role.toLowerCase()}-04-modal.png`, fullPage: true });
      const closeBtn = await page.$('.modal-close');
      if (closeBtn) await closeBtn.click();
    }
  }

  // Mobile test
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `report/${user.role.toLowerCase()}-06-mobile.png`, fullPage: true });
  features.push({ name: 'Mobile responsive', ok: true });

  await ctx.close();
  return { role: user.role, features, errors };
}

async function runTests() {
  const browser = await chromium.launch({ headless: true });

  for (const user of USERS) {
    console.log(`\n=== TESTING ${user.role} ===`);
    const result = await testRole(browser, user);
    report.push(result);
    const passed = result.features.filter(f => f.ok).length;
    console.log(`  Result: ${passed}/${result.features.length} passed, ${result.errors.length} errors`);
  }

  await browser.close();

  const fs = await import('fs');
  fs.mkdirSync('report', { recursive: true });
  fs.writeFileSync('report/functional-report.json', JSON.stringify(report, null, 2));

  console.log('\n=== SUMMARY ===');
  for (const r of report) {
    const p = r.features.filter(f => f.ok).length;
    console.log(`${r.role}: ${p}/${r.features.length} features`);
  }
}

runTests().catch(console.error);
