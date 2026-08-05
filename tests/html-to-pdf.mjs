import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const REPORT_DIR = path.join(import.meta.dirname, '..', 'report');
const HTML_FILE = path.join(REPORT_DIR, 'TESTING_REPORT.html');
const PDF_FILE = path.join(REPORT_DIR, 'TESTing_Report_SENA_Bienestar.pdf');

async function htmlToPdf() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const htmlContent = fs.readFileSync(HTML_FILE, 'utf-8');
  await page.setContent(htmlContent, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  await page.pdf({
    path: PDF_FILE,
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' }
  });
  
  console.log(`✅ PDF generado: ${PDF_FILE}`);
  await browser.close();
}

htmlToPdf().catch(console.error);
