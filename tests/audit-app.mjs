import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

// Test users - we'll try these or create them
const TEST_USERS = {
  APRENDIZ: {
    email: 'aprendiz@test.com',
    password: 'Test1234!',
    role: 'APRENDIZ'
  },
  PROFESIONAL: {
    email: 'profesional@test.com', 
    password: 'Test1234!',
    role: 'PROFESIONAL'
  },
  COORDINACION: {
    email: 'coordinacion@test.com',
    password: 'Test1234!',
    role: 'COORDINACION'
  },
  SUPERADMIN: {
    email: 'admin@test.com',
    password: 'Test1234!',
    role: 'SUPERADMIN'
  }
};

async function auditApp() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  
  const results = {
    loginPage: null,
    roles: {},
    consoleErrors: [],
    networkErrors: [],
    designIssues: [],
    accessibilityIssues: []
  };

  const page = await context.newPage();
  
  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      results.consoleErrors.push({
        url: page.url(),
        text: msg.text()
      });
    }
  });
  
  // Capture network errors
  page.on('requestfailed', req => {
    results.networkErrors.push({
      url: req.url(),
      failure: req.failure()?.errorText
    });
  });

  // 1. Audit Login Page
  console.log('\n=== AUDITING LOGIN PAGE ===');
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'audit/01-login-desktop.png', fullPage: true });
  results.loginPage = {
    url: page.url(),
    title: await page.title()
  };
  
  // Check login page elements
  const loginElements = await page.evaluate(() => {
    const el = {};
    el.emailInput = !!document.querySelector('#login-email');
    el.passwordInput = !!document.querySelector('#login-password');
    el.submitButton = !!document.querySelector('.btn-login');
    el.forgotLink = !!document.querySelector('.auth-forgot');
    el.registerLink = !!document.querySelector('.auth-link');
    el.brandSection = !!document.querySelector('.auth-left');
    el.featureCards = document.querySelectorAll('.auth-feature-card').length;
    
    // Check accessibility
    el.formHasLabels = !!document.querySelector('.auth-form')?.querySelector('input')?.getAttribute('autoComplete');
    el.buttonDisabled = document.querySelector('.btn-login')?.disabled;
    
    return el;
  });
  console.log('Login elements:', JSON.stringify(loginElements, null, 2));
  
  // Mobile view
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'audit/02-login-mobile.png', fullPage: true });

  // 2. Try Register page
  console.log('\n=== AUDITING REGISTER PAGE ===');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/register`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'audit/03-register.png', fullPage: true });

  // 3. Forgot Password page
  console.log('\n=== AUDITING FORGOT PASSWORD PAGE ===');
  await page.goto(`${BASE_URL}/forgot-password`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'audit/04-forgot-password.png', fullPage: true });

  // 4. Unauthorized page
  console.log('\n=== AUDITING UNAUTHORIZED PAGE ===');
  await page.goto(`${BASE_URL}/unauthorized`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'audit/05-unauthorized.png', fullPage: true });

  // 5. Not Found page
  console.log('\n=== AUDITING 404 PAGE ===');
  await page.goto(`${BASE_URL}/nonexistent-page`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'audit/06-not-found.png', fullPage: true });

  // 6. Try to login as SUPERADMIN
  console.log('\n=== TRYING LOGIN AS SUPERADMIN ===');
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  
  // Fill login form
  await page.fill('#login-email', TEST_USERS.SUPERADMIN.email);
  await page.fill('#login-password', TEST_USERS.SUPERADMIN.password);
  await page.screenshot({ path: 'audit/07-login-filled.png', fullPage: true });
  
  await page.click('.btn-login');
  await page.waitForTimeout(3000);
  
  const currentUrl = page.url();
  const loginResult = await page.evaluate(() => {
    return {
      url: window.location.href,
      hasError: !!document.querySelector('.auth-error'),
      errorText: document.querySelector('.auth-error')?.textContent || '',
      bodyText: document.body.innerText.substring(0, 500)
    };
  });
  
  console.log('Login result:', JSON.stringify(loginResult, null, 2));
  
  if (loginResult.hasError) {
    console.log('LOGIN FAILED:', loginResult.errorText);
    results.roles.SUPERADMIN = { 
      login: 'FAILED', 
      error: loginResult.errorText 
    };
    await page.screenshot({ path: 'audit/08-login-error.png', fullPage: true });
  } else if (currentUrl.includes('/admin')) {
    console.log('LOGIN SUCCESS - Admin dashboard loaded');
    await page.screenshot({ path: 'audit/09-admin-dashboard.png', fullPage: true });
    results.roles.SUPERADMIN = { login: 'SUCCESS', url: currentUrl };
    
    // Check admin dashboard elements
    const adminElements = await page.evaluate(() => {
      const el = {};
      el.tabs = document.querySelectorAll('.admin-tabs .tab-btn').length;
      el.statCards = document.querySelectorAll('.admin-stat-card').length;
      el.sidebar = !!document.querySelector('.dashboard-sidebar');
      el.sidebarNavItems = document.querySelectorAll('.nav-item').length;
      el.content = !!document.querySelector('.admin-content');
      el.profileDropdown = !!document.querySelector('.profile-dropdown') || !!document.querySelector('[class*="profile"]');
      return el;
    });
    console.log('Admin elements:', JSON.stringify(adminElements, null, 2));
    
    // Click through admin tabs
    const adminTabs = ['deps', 'roles', 'audit', 'config'];
    for (const tab of adminTabs) {
      const tabBtn = await page.$(`#tab-${tab}`);
      if (tabBtn) {
        await tabBtn.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: `audit/10-admin-${tab}.png`, fullPage: true });
        console.log(`Admin tab "${tab}" - screenshot taken`);
      }
    }
    
    // Back to users tab
    const usersTab = await page.$('#tab-users');
    if (usersTab) {
      await usersTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'audit/10-admin-users.png', fullPage: true });
    }
    
    // Logout
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
  } else {
    console.log('LOGIN - Unknown state, URL:', currentUrl);
    results.roles.SUPERADMIN = { login: 'UNKNOWN', url: currentUrl };
    await page.screenshot({ path: 'audit/08-login-unknown.png', fullPage: true });
  }

  // 7. Try Coordination
  console.log('\n=== TRYING LOGIN AS COORDINACION ===');
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('#login-email', TEST_USERS.COORDINACION.email);
  await page.fill('#login-password', TEST_USERS.COORDINACION.password);
  await page.click('.btn-login');
  await page.waitForTimeout(3000);
  
  const coordResult = await page.evaluate(() => ({
    url: window.location.href,
    hasError: !!document.querySelector('.auth-error'),
    errorText: document.querySelector('.auth-error')?.textContent || ''
  }));
  
  if (coordResult.hasError) {
    console.log('COORDINACION LOGIN FAILED:', coordResult.errorText);
    results.roles.COORDINACION = { login: 'FAILED', error: coordResult.errorText };
    await page.screenshot({ path: 'audit/11-coord-login-error.png', fullPage: true });
  } else if (page.url().includes('/coordination')) {
    console.log('COORDINACION LOGIN SUCCESS');
    await page.screenshot({ path: 'audit/12-coordination-dashboard.png', fullPage: true });
    results.roles.COORDINACION = { login: 'SUCCESS', url: page.url() };
    
    // Check coordination dashboard
    const coordElements = await page.evaluate(() => {
      const el = {};
      el.kpiCards = document.querySelectorAll('.kpi-card, [class*="kpi"]').length;
      el.charts = document.querySelectorAll('svg.recharts-surface, [class*="chart"]').length;
      el.sidebar = !!document.querySelector('.dashboard-sidebar');
      el.filterAdvanced = !!document.querySelector('.advanced-filters');
      return el;
    });
    console.log('Coordination elements:', JSON.stringify(coordElements, null, 2));
    
    // Try opening advanced filters
    const filterBtn = await page.$('.advanced-toggle');
    if (filterBtn) {
      await filterBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'audit/13-coordination-filters.png', fullPage: true });
    }
  } else {
    results.roles.COORDINACION = { login: 'UNKNOWN', url: page.url() };
    await page.screenshot({ path: 'audit/11-coord-unknown.png', fullPage: true });
  }

  // 8. Try Profesional
  console.log('\n=== TRYING LOGIN AS PROFESIONAL ===');
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('#login-email', TEST_USERS.PROFESIONAL.email);
  await page.fill('#login-password', TEST_USERS.PROFESIONAL.password);
  await page.click('.btn-login');
  await page.waitForTimeout(3000);
  
  const profResult = await page.evaluate(() => ({
    url: window.location.href,
    hasError: !!document.querySelector('.auth-error'),
    errorText: document.querySelector('.auth-error')?.textContent || ''
  }));
  
  if (profResult.hasError) {
    console.log('PROFESIONAL LOGIN FAILED:', profResult.errorText);
    results.roles.PROFESIONAL = { login: 'FAILED', error: profResult.errorText };
    await page.screenshot({ path: 'audit/14-prof-login-error.png', fullPage: true });
  } else if (page.url().includes('/professional')) {
    console.log('PROFESIONAL LOGIN SUCCESS');
    await page.screenshot({ path: 'audit/15-professional-dashboard.png', fullPage: true });
    results.roles.PROFESIONAL = { login: 'SUCCESS', url: page.url() };
    
    // Check professional dashboard elements
    const profElements = await page.evaluate(() => {
      const el = {};
      el.tabs = document.querySelectorAll('.prof-tabs button').length;
      el.quickStats = document.querySelectorAll('.prof-stat').length;
      el.sidebar = !!document.querySelector('.dashboard-sidebar');
      el.greeting = !!document.querySelector('.prof-greeting');
      return el;
    });
    console.log('Professional elements:', JSON.stringify(profElements, null, 2));
    
    // Click through professional tabs
    const profTabs = ['pending', 'history', 'stats', 'schedule'];
    for (const tab of profTabs) {
      const tabBtn = await page.$(`#tab-${tab}`);
      if (tabBtn) {
        await tabBtn.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: `audit/16-prof-${tab}.png`, fullPage: true });
        console.log(`Professional tab "${tab}" - screenshot taken`);
      }
    }
  } else {
    results.roles.PROFESIONAL = { login: 'UNKNOWN', url: page.url() };
    await page.screenshot({ path: 'audit/14-prof-unknown.png', fullPage: true });
  }

  // 9. Try Aprendiz
  console.log('\n=== TRYING LOGIN AS APRENDIZ ===');
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('#login-email', TEST_USERS.APRENDIZ.email);
  await page.fill('#login-password', TEST_USERS.APRENDIZ.password);
  await page.click('.btn-login');
  await page.waitForTimeout(3000);
  
  const aprendizResult = await page.evaluate(() => ({
    url: window.location.href,
    hasError: !!document.querySelector('.auth-error'),
    errorText: document.querySelector('.auth-error')?.textContent || ''
  }));
  
  if (aprendizResult.hasError) {
    console.log('APRENDIZ LOGIN FAILED:', aprendizResult.errorText);
    results.roles.APRENDIZ = { login: 'FAILED', error: aprendizResult.errorText };
    await page.screenshot({ path: 'audit/17-aprendiz-login-error.png', fullPage: true });
  } else if (page.url().includes('/dashboard')) {
    console.log('APRENDIZ LOGIN SUCCESS');
    await page.screenshot({ path: 'audit/18-aprendiz-dashboard.png', fullPage: true });
    results.roles.APRENDIZ = { login: 'SUCCESS', url: page.url() };
    
    // Check aprendiz dashboard elements
    const aprendizElements = await page.evaluate(() => {
      const el = {};
      el.tabs = document.querySelectorAll('.filter-tabs .tab-btn').length;
      el.sidebar = !!document.querySelector('.dashboard-sidebar');
      el.fabButton = !!document.querySelector('.fab-btn');
      return el;
    });
    console.log('Aprendiz elements:', JSON.stringify(aprendizElements, null, 2));
    
    // Click through tabs
    const aprendizTabs = ['pending', 'confirmed', 'completed', 'cancelled'];
    for (const tab of aprendizTabs) {
      const tabBtn = await page.$(`#tab-${tab}`);
      if (tabBtn) {
        await tabBtn.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: `audit/19-aprendiz-${tab}.png`, fullPage: true });
      }
    }
  } else {
    results.roles.APRENDIZ = { login: 'UNKNOWN', url: page.url() };
    await page.screenshot({ path: 'audit/17-aprendiz-unknown.png', fullPage: true });
  }

  // 10. Check dark mode
  console.log('\n=== CHECKING DARK MODE ===');
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'audit/20-login-dark-mode.png', fullPage: true });

  // 11. Check responsive views
  console.log('\n=== CHECKING RESPONSIVE VIEWS ===');
  await page.emulateMedia({ colorScheme: 'light' });
  
  // Mobile
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'audit/21-login-mobile-375.png', fullPage: true });
  
  // Tablet
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'audit/22-login-tablet-768.png', fullPage: true });

  // Final summary
  console.log('\n=== AUDIT RESULTS ===');
  console.log(JSON.stringify(results, null, 2));
  
  // Accessibility quick check
  console.log('\n=== ACCESSIBILITY CHECK ===');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  
  const accessibilityReport = await page.evaluate(() => {
    const issues = [];
    
    // Check images without alt
    document.querySelectorAll('img:not([alt])').forEach(img => {
      issues.push(`Image without alt: ${img.src}`);
    });
    
    // Check buttons without aria-label
    document.querySelectorAll('button:not([aria-label])').forEach(btn => {
      if (!btn.textContent.trim()) {
        issues.push(`Button without text or aria-label`);
      }
    });
    
    // Check form inputs
    document.querySelectorAll('input').forEach(input => {
      if (!input.getAttribute('aria-label') && !input.getAttribute('placeholder') && !document.querySelector(`label[for="${input.id}"]`)) {
        issues.push(`Input ${input.id || input.name || 'unnamed'} without label`);
      }
    });
    
    // Check heading hierarchy
    const headings = [];
    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
      headings.push({ level: parseInt(h.tagName[1]), text: h.textContent.trim() });
    });
    
    // Check for skip links
    const hasSkipLink = !!document.querySelector('a[href="#main"], a.skip-link, [class*="skip"]');
    
    // Check color contrast (basic)
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    const bodyColor = getComputedStyle(document.body).color;
    
    return {
      issues,
      headingCount: headings.length,
      headings: headings.slice(0, 10),
      hasSkipLink,
      bodyBg,
      bodyColor,
      totalInputs: document.querySelectorAll('input').length,
      totalButtons: document.querySelectorAll('button').length,
      totalLinks: document.querySelectorAll('a').length,
      formsCount: document.querySelectorAll('form').length
    };
  });
  
  console.log('Accessibility report:', JSON.stringify(accessibilityReport, null, 2));
  
  await browser.close();
  
  return results;
}

auditApp().catch(console.error);
