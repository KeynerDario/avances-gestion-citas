import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const SCRIPTS_DIR = path.join(import.meta.dirname);
const REPORT_DIR = path.join(SCRIPTS_DIR, '..', 'report');

fs.mkdirSync(REPORT_DIR, { recursive: true });

function run(script, description) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 ${description}`);
  console.log('='.repeat(60));
  try {
    execSync(`node "${path.join(SCRIPTS_DIR, script)}"`, { stdio: 'inherit', cwd: path.join(SCRIPTS_DIR, '..') });
    console.log(`✅ ${description} - COMPLETADO`);
  } catch (err) {
    console.error(`❌ ${description} - ERROR: ${err.message}`);
  }
}

console.log('🧪 EJECUCIÓN COMPLETA - SENA Bienestar');
console.log('Fecha:', new Date().toLocaleString('es-CO'));

run('full-test-and-captures.mjs', 'PASO 1: Tests funcionales y capturas de pantalla');
run('generate-testing-html.mjs', 'PASO 2: Generar reporte HTML de testing');
run('generate-user-manual.mjs', 'PASO 3: Generar manual de usuario PDF');

console.log('\n' + '='.repeat(60));
console.log('🎉 PROCESO FINALIZADO');
console.log('='.repeat(60));
console.log(`📁 Reportes en: ${REPORT_DIR}`);
console.log('📄 Archivos generados:');
if (fs.existsSync(path.join(REPORT_DIR, 'TESTING_REPORT.html'))) console.log('  - TESTING_REPORT.html (Reporte de testing)');
if (fs.existsSync(path.join(REPORT_DIR, 'test-results.json'))) console.log('  - test-results.json (Resultados JSON)');
if (fs.existsSync(path.join(REPORT_DIR, 'Manual_Usuario_Gestion_Citas_SENA_Playwright.pdf'))) console.log('  - Manual_Usuario_Gestion_Citas_SENA_Playwright.pdf (Manual de usuario)');
console.log('  - screenshots/ (Capturas de pantalla)');
