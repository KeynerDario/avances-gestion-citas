import fs from 'fs';
import path from 'path';

const REPORT_DIR = path.join(import.meta.dirname, '..', 'report');
const SCREENSHOTS_DIR = path.join(REPORT_DIR, 'screenshots');
const OUTPUT = path.join(REPORT_DIR, 'TESTING_REPORT.html');

const report = JSON.parse(fs.readFileSync(path.join(REPORT_DIR, 'test-results.json'), 'utf-8'));
const screenshots = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png')).sort();

function getScreenshotForStep(step) {
  return screenshots.find(s => s.includes(step)) || null;
}

function generateTestRows(tests) {
  return tests.map(t => `
    <tr>
      <td>${t.test}</td>
      <td><span class="badge ${t.passed ? 'pass' : 'fail'}">${t.passed ? '✅ PASS' : '❌ FAIL'}</span></td>
    </tr>`).join('');
}

function generateUserSection(user) {
  const screenshotsForUser = screenshots.filter(s => s.startsWith(user.role.toLowerCase().substring(0, 4)) || s.includes(user.role.toLowerCase()));
  const imgTags = screenshotsForUser.map(s => `
    <div class="screenshot-item">
      <img src="screenshots/${s}" alt="${s}" onclick="openModal(this.src)" />
      <span class="screenshot-name">${s.replace('.png', '').replace(/-/g, ' ')}</span>
    </div>`).join('');

  return `
  <div class="user-section">
    <div class="user-header">
      <h2>👤 ${user.role}</h2>
      <span class="user-email">${user.email}</span>
      <span class="badge ${user.loginOk ? 'pass' : 'fail'}">${user.loginOk ? 'Login OK' : 'Login FAIL'}</span>
    </div>
    <table class="test-table">
      <thead><tr><th>Test</th><th>Resultado</th></tr></thead>
      <tbody>${generateTestRows(user.tests)}</tbody>
    </table>
    ${imgTags ? `<div class="screenshots-grid">${imgTags}</div>` : ''}
  </div>`;
}

const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte de Testing - SENA Bienestar</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0f172a; color: #e2e8f0; line-height: 1.6; }
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    header { text-align: center; padding: 3rem 0; border-bottom: 1px solid #1e293b; }
    header h1 { font-size: 2.5rem; background: linear-gradient(135deg, #39A900, #22c55e); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    header p { color: #94a3b8; margin-top: 0.5rem; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin: 2rem 0; }
    .summary-card { background: #1e293b; border-radius: 12px; padding: 1.5rem; text-align: center; border: 1px solid #334155; }
    .summary-card .number { font-size: 2.5rem; font-weight: 700; }
    .summary-card .label { color: #94a3b8; font-size: 0.875rem; margin-top: 0.25rem; }
    .summary-card.total .number { color: #3b82f6; }
    .summary-card.passed .number { color: #22c55e; }
    .summary-card.failed .number { color: #ef4444; }
    .summary-card.rate .number { color: #f59e0b; }
    .user-section { background: #1e293b; border-radius: 12px; margin: 2rem 0; overflow: hidden; border: 1px solid #334155; }
    .user-header { padding: 1.5rem; display: flex; align-items: center; gap: 1rem; border-bottom: 1px solid #334155; flex-wrap: wrap; }
    .user-header h2 { font-size: 1.25rem; }
    .user-email { color: #94a3b8; font-size: 0.875rem; }
    .test-table { width: 100%; border-collapse: collapse; }
    .test-table th, .test-table td { padding: 0.75rem 1.5rem; text-align: left; border-bottom: 1px solid #334155; }
    .test-table th { background: #0f172a; color: #94a3b8; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .test-table tr:hover { background: #334155; }
    .badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .badge.pass { background: #052e16; color: #22c55e; }
    .badge.fail { background: #450a0a; color: #ef4444; }
    .screenshots-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; padding: 1.5rem; }
    .screenshot-item { text-align: center; }
    .screenshot-item img { width: 100%; border-radius: 8px; cursor: pointer; border: 1px solid #334155; transition: transform 0.2s; }
    .screenshot-item img:hover { transform: scale(1.02); border-color: #39A900; }
    .screenshot-name { display: block; font-size: 0.75rem; color: #94a3b8; margin-top: 0.5rem; }
    .modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 1000; justify-content: center; align-items: center; cursor: pointer; }
    .modal-overlay.active { display: flex; }
    .modal-overlay img { max-width: 90vw; max-height: 90vh; border-radius: 8px; }
    footer { text-align: center; padding: 2rem 0; color: #64748b; font-size: 0.875rem; border-top: 1px solid #1e293b; margin-top: 2rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Reporte de Testing</h1>
      <p>SENA Bienestar - Sistema de Gestión de Citas</p>
      <p style="margin-top: 0.5rem; font-size: 0.875rem;">${new Date(report.timestamp).toLocaleString('es-CO')}</p>
    </header>

    <div class="summary">
      <div class="summary-card total">
        <div class="number">${report.summary.totalTests}</div>
        <div class="label">Total Tests</div>
      </div>
      <div class="summary-card passed">
        <div class="number">${report.summary.passed}</div>
        <div class="label">Pasados</div>
      </div>
      <div class="summary-card failed">
        <div class="number">${report.summary.failed}</div>
        <div class="label">Fallidos</div>
      </div>
      <div class="summary-card rate">
        <div class="number">${Math.round((report.summary.passed / report.summary.totalTests) * 100)}%</div>
        <div class="label">Tasa de Éxito</div>
      </div>
    </div>

    ${report.users.map(u => generateUserSection(u)).join('')}

    <footer>
      Generado automáticamente por Playwright - SENA Bienestar © ${new Date().getFullYear()}
    </footer>
  </div>

  <div class="modal-overlay" id="imgModal" onclick="this.classList.remove('active')">
    <img id="modalImg" src="" alt="Screenshot ampliado" />
  </div>

  <script>
    function openModal(src) {
      document.getElementById('modalImg').src = src;
      document.getElementById('imgModal').classList.add('active');
    }
  </script>
</body>
</html>`;

fs.writeFileSync(OUTPUT, html);
console.log(`✅ Reporte HTML generado: ${OUTPUT}`);
