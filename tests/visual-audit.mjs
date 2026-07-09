import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'http://localhost:5173';
const AUDIT_DIR = 'audit';

// Ensure audit directory exists
mkdirSync(AUDIT_DIR, { recursive: true });

const results = {
  pages: [],
  consoleErrors: [],
  consoleWarnings: [],
  networkErrors: [],
  designIssues: [],
  accessibilityIssues: [],
  responsiveIssues: [],
  codeIssues: []
};

async function auditPage(page, name, url, screenshotPath) {
  console.log(`\n--- Auditing: ${name} (${url}) ---`);
  
  await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  // Desktop screenshot
  await page.screenshot({ path: join(AUDIT_DIR, screenshotPath + '-desktop.png'), fullPage: true });
  
  // Analyze page
  const analysis = await page.evaluate((pageName) => {
    const result = {
      name: pageName,
      title: document.title,
      url: window.location.href,
      elements: {},
      issues: [],
      accessibility: {}
    };
    
    // Count elements
    result.elements.headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
    result.elements.images = document.querySelectorAll('img').length;
    result.elements.buttons = document.querySelectorAll('button').length;
    result.elements.inputs = document.querySelectorAll('input, select, textarea').length;
    result.elements.links = document.querySelectorAll('a').length;
    result.elements.forms = document.querySelectorAll('form').length;
    result.elements.divs = document.querySelectorAll('div').length;
    
    // Check heading hierarchy
    const headings = [];
    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
      headings.push({ level: parseInt(h.tagName[1]), text: h.textContent.trim().substring(0, 50) });
    });
    result.headings = headings;
    
    // Check for issues
    // 1. Images without alt
    document.querySelectorAll('img:not([alt])').forEach(img => {
      result.issues.push(`Image without alt: ${img.src?.substring(0, 80)}`);
    });
    
    // 2. Buttons without accessible text
    document.querySelectorAll('button').forEach(btn => {
      if (!btn.textContent.trim() && !btn.getAttribute('aria-label') && !btn.getAttribute('title')) {
        result.issues.push('Button without accessible text');
      }
    });
    
    // 3. Inputs without labels
    document.querySelectorAll('input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"])').forEach(input => {
      const hasLabel = input.id && document.querySelector(`label[for="${input.id}"]`);
      const hasAriaLabel = input.getAttribute('aria-label');
      const hasPlaceholder = input.getAttribute('placeholder');
      if (!hasLabel && !hasAriaLabel && !hasPlaceholder) {
        result.issues.push(`Input ${input.name || 'unnamed'} without label`);
      }
    });
    
    // 4. Color contrast check (basic)
    const body = document.body;
    const computedStyle = getComputedStyle(body);
    result.accessibility.bodyBg = computedStyle.backgroundColor;
    result.accessibility.bodyColor = computedStyle.color;
    
    // 5. Check for skip links
    result.accessibility.hasSkipLink = !!document.querySelector('a[href="#main"], .skip-link, [class*="skip"]');
    
    // 6. Check ARIA roles
    result.accessibility.ariaRoles = document.querySelectorAll('[role]').length;
    
    // 7. Check focus styles
    result.accessibility.focusVisible = !!document.querySelector(':focus-visible');
    
    // 8. Check for animations (potential accessibility issues)
    const animatedElements = document.querySelectorAll('[class*="animate"], [class*="spin"], [class*="transition"]');
    result.accessibility.animatedElements = animatedElements.length;
    
    // 9. Check for overflow issues
    const overflowing = [];
    document.querySelectorAll('*').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.right > window.innerWidth + 10) {
        overflowing.push(el.tagName + (el.className ? '.' + el.className.split(' ')[0] : ''));
      }
    });
    result.overflowingElements = [...new Set(overflowing)].slice(0, 5);
    
    // 10. Check for inline styles (code smell)
    let inlineStyleCount = 0;
    document.querySelectorAll('[style]').forEach(el => {
      if (el.getAttribute('style')?.trim()) inlineStyleCount++;
    });
    result.inlineStyleCount = inlineStyleCount;
    
    // 11. Page height
    result.pageHeight = document.body.scrollHeight;
    result.pageWidth = document.body.scrollWidth;
    
    return result;
  }, name);
  
  results.pages.push(analysis);
  
  // Mobile screenshot
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(AUDIT_DIR, screenshotPath + '-mobile.png'), fullPage: true });
  
  // Tablet screenshot
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(AUDIT_DIR, screenshotPath + '-tablet.png'), fullPage: true });
  
  // Reset to desktop
  await page.setViewportSize({ width: 1440, height: 900 });
  
  return analysis;
}

async function auditDesignSystem(page) {
  console.log('\n=== DESIGN SYSTEM AUDIT ===');
  
  // Audit CSS variables
  const cssVars = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    return {
      green: root.getPropertyValue('--sena-green').trim(),
      dark: root.getPropertyValue('--sena-dark').trim(),
      gray: root.getPropertyValue('--sena-gray').trim(),
      white: root.getPropertyValue('--sena-white').trim(),
      fontSans: root.getPropertyValue('--font-sans').trim(),
      radiusMd: root.getPropertyValue('--radius-md').trim(),
      shadowSm: root.getPropertyValue('--shadow-sm').trim(),
    };
  });
  
  console.log('CSS Variables:', JSON.stringify(cssVars, null, 2));
  return cssVars;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light'
  });
  
  const page = await context.newPage();
  
  // Capture console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      results.consoleErrors.push({ url: page.url(), text: msg.text() });
    } else if (msg.type() === 'warning') {
      results.consoleWarnings.push({ url: page.url(), text: msg.text() });
    }
  });
  
  page.on('requestfailed', req => {
    results.networkErrors.push({ url: req.url(), failure: req.failure()?.errorText });
  });
  
  // Audit Design System
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  const cssVars = await auditDesignSystem(page);
  
  // Audit each page
  await auditPage(page, 'Login', '/login', '01-login');
  await auditPage(page, 'Register', '/register', '02-register');
  await auditPage(page, 'Forgot Password', '/forgot-password', '03-forgot-password');
  await auditPage(page, 'Unauthorized', '/unauthorized', '04-unauthorized');
  await auditPage(page, '404 Not Found', '/nonexistent', '05-not-found');
  
  // Dark mode audit
  console.log('\n=== DARK MODE AUDIT ===');
  await context.close();
  const darkContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark'
  });
  const darkPage = await darkContext.newPage();
  
  await darkPage.goto(`${BASE_URL}/login`);
  await darkPage.waitForLoadState('networkidle');
  await darkPage.waitForTimeout(500);
  await darkPage.screenshot({ path: join(AUDIT_DIR, '06-login-dark.png'), fullPage: true });
  
  await darkPage.goto(`${BASE_URL}/register`);
  await darkPage.waitForLoadState('networkidle');
  await darkPage.waitForTimeout(500);
  await darkPage.screenshot({ path: join(AUDIT_DIR, '07-register-dark.png'), fullPage: true });
  
  await darkContext.close();
  
  // Generate report
  console.log('\n\n========================================');
  console.log('     COMPREHENSIVE AUDIT REPORT');
  console.log('========================================');
  
  console.log('\n--- PAGES AUDITED ---');
  for (const p of results.pages) {
    console.log(`\n📄 ${p.name} (${p.url})`);
    console.log(`   Elements: ${p.elements.headings} headings, ${p.elements.buttons} buttons, ${p.elements.inputs} inputs, ${p.elements.links} links`);
    console.log(`   Page height: ${p.pageHeight}px`);
    if (p.overflowingElements?.length > 0) {
      console.log(`   ⚠️  Overflowing: ${p.overflowingElements.join(', ')}`);
    }
    if (p.issues?.length > 0) {
      p.issues.forEach(i => console.log(`   ❌ ${i}`));
    }
    if (p.headings?.length > 0) {
      console.log(`   Headings: ${p.headings.map(h => `h${h.level}:"${h.text}"`).join(' > ')}`);
    }
  }
  
  console.log('\n--- CONSOLE ERRORS ---');
  if (results.consoleErrors.length === 0) {
    console.log('   ✅ No console errors');
  } else {
    results.consoleErrors.forEach(e => console.log(`   ❌ ${e.url}: ${e.text.substring(0, 100)}`));
  }
  
  console.log('\n--- CONSOLE WARNINGS ---');
  if (results.consoleWarnings.length === 0) {
    console.log('   ✅ No warnings');
  } else {
    results.consoleWarnings.slice(0, 10).forEach(w => console.log(`   ⚠️  ${w.text.substring(0, 100)}`));
  }
  
  console.log('\n--- NETWORK ERRORS ---');
  if (results.networkErrors.length === 0) {
    console.log('   ✅ No network errors');
  } else {
    results.networkErrors.forEach(e => console.log(`   ❌ ${e.url}: ${e.failure}`));
  }
  
  // Save full report
  writeFileSync(join(AUDIT_DIR, 'audit-report.json'), JSON.stringify(results, null, 2));
  console.log('\n📊 Full report saved to audit/audit-report.json');
  
  await browser.close();
}

main().catch(console.error);
