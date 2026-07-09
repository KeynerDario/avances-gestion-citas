const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, 'docs', 'screenshots');
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  async function shot(name, opts = {}) {
    await page.waitForTimeout(opts.wait || 2000);
    const file = path.join(SCREENSHOTS_DIR, `${name}.png`);
    await page.screenshot({ path: file, fullPage: opts.fullPage || false });
    console.log(`  ✓ ${name} | ${page.url()}`);
    return file;
  }

  console.log('=== LOGIN Y CAPTURAS DE PANTALLA ===\n');

  // ============================================
  // 1. LOGIN
  // ============================================
  console.log('--- 1. LOGIN ---');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await shot('20-login-form');

  // Fill credentials
  await page.fill('input[type="email"]', 'kdarevalofria@gmail.com');
  await page.fill('input[type="password"]', '123456');
  await shot('21-login-filled');

  // Submit
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // Check where we landed
  const currentUrl = page.url();
  console.log(`  → Redirigido a: ${currentUrl}`);
  await shot('22-dashboard-admin', { fullPage: true });

  // ============================================
  // 2. ADMIN DASHBOARD - VISTA GENERAL
  // ============================================
  console.log('\n--- 2. ADMIN DASHBOARD ---');
  await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await shot('23-admin-dashboard', { fullPage: true });

  // ============================================
  // 3. TAB: GESTIÓN DE USUARIOS
  // ============================================
  console.log('\n--- 3. GESTIÓN DE USUARIOS ---');
  // Click on "Usuarios" tab if not already active
  const usersTab = await page.$('button[role="tab"]:has-text("Usuarios")');
  if (usersTab) await usersTab.click();
  await page.waitForTimeout(2000);
  await shot('24-admin-users', { fullPage: true });

  // ============================================
  // 4. TAB: DEPENDENCIAS
  // ============================================
  console.log('\n--- 4. DEPENDENCIAS ---');
  const depsTab = await page.$('button[role="tab"]:has-text("Dependencias")');
  if (depsTab) await depsTab.click();
  await page.waitForTimeout(2000);
  await shot('25-admin-dependencies', { fullPage: true });

  // ============================================
  // 5. TAB: ROLES Y PERMISOS
  // ============================================
  console.log('\n--- 5. ROLES Y PERMISOS ---');
  const rolesTab = await page.$('button[role="tab"]:has-text("Roles")');
  if (rolesTab) await rolesTab.click();
  await page.waitForTimeout(2000);
  await shot('26-admin-roles', { fullPage: true });

  // ============================================
  // 6. TAB: AUDITORÍA
  // ============================================
  console.log('\n--- 6. AUDITORÍA ---');
  const auditTab = await page.$('button[role="tab"]:has-text("Auditoría")');
  if (auditTab) await auditTab.click();
  await page.waitForTimeout(2000);
  await shot('27-admin-audit', { fullPage: true });

  // ============================================
  // 7. TAB: CONFIGURACIÓN
  // ============================================
  console.log('\n--- 7. CONFIGURACIÓN ---');
  const configTab = await page.$('button[role="tab"]:has-text("Configuración")');
  if (configTab) await configTab.click();
  await page.waitForTimeout(2000);
  await shot('28-admin-config', { fullPage: true });

  // ============================================
  // 8. SIDEBAR EXPANDIDO
  // ============================================
  console.log('\n--- 8. SIDEBAR ---');
  await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  // Hover over sidebar to expand it
  const sidebar = await page.$('.dashboard-sidebar');
  if (sidebar) {
    await sidebar.hover();
    await page.waitForTimeout(500);
  }
  await shot('29-sidebar-expanded');

  // ============================================
  // 9. PERFIL DE USUARIO
  // ============================================
  console.log('\n--- 9. PERFIL ---');
  const profileBtn = await page.$('.profile-trigger');
  if (profileBtn) {
    await profileBtn.click();
    await page.waitForTimeout(1000);
    await shot('30-profile-dropdown');
  }

  // ============================================
  // 10. MODO OSCURO
  // ============================================
  console.log('\n--- 10. MODO OSCURO ---');
  const themeBtn = await page.$('button[aria-label="Cambiar tema"]');
  if (themeBtn) {
    await themeBtn.click();
    await page.waitForTimeout(1000);
    await shot('31-dark-mode-admin', { fullPage: true });
  }

  // ============================================
  // 11. COMMAND PALETTE
  // ============================================
  console.log('\n--- 11. COMMAND PALETTE ---');
  await page.keyboard.press('Control+k');
  await page.waitForTimeout(800);
  await shot('32-command-palette');

  // Close it
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // Switch back to light mode
  if (themeBtn) {
    await themeBtn.click();
    await page.waitForTimeout(500);
  }

  // ============================================
  // RESUMEN
  // ============================================
  console.log(`\n=== RESUMEN ===`);
  console.log(`Screenshots tomados: ${fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png') && f.startsWith('2')).length}`);
  console.log(`Errores en consola: ${errors.length}`);
  errors.forEach(e => console.log(`  - ${e.substring(0, 100)}`));

  await browser.close();
})();
