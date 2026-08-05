import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const REPORT_DIR = path.join(import.meta.dirname, '..', 'report');
const SCREENSHOTS_DIR = path.join(REPORT_DIR, 'manual-screenshots');
const OUTPUT_DIR = path.join(import.meta.dirname, '..', 'entrega-final', 'manual-usuario');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function getBase64Image(filePath) {
  if (!fs.existsSync(filePath)) return '';
  const data = fs.readFileSync(filePath);
  return `data:image/png;base64,${data.toString('base64')}`;
}

function buildImageGrid() {
  const screenshots = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png')).sort();
  return screenshots.map(f => {
    const img = getBase64Image(path.join(SCREENSHOTS_DIR, f));
    const label = f.replace('.png', '').replace(/-/g, ' ');
    return `<div class="screenshot"><img src="${img}" alt="${label}"/><p>${label}</p></div>`;
  }).join('\n');
}

function buildScreenshotsBySection() {
  const sections = {
    'login': { title: '1.1 Página de Login', files: ['01-login.png', '02-login-lleno.png'] },
    'register': { title: '1.2 Página de Registro', files: ['03-registro.png', '04-registro-lleno.png'] },
    'forgot': { title: '1.3 Recuperar Contraseña', files: ['05-olvide-contrasena.png'] },
    'admin': { title: '2.1 Panel de Administración', files: ['06-admin-dashboard.png', '07-admin-usuarios.png', '08-admin-dependencias.png', '09-admin-roles.png', '10-admin-auditoria.png', '11-admin-configuracion.png'] },
    'admin-features': { title: '2.2 Funcionalidades Admin', files: ['13-admin-modo-oscuro.png', '14-admin-palette.png'] },
    'coordination': { title: '3.1 Panel de Coordinación', files: ['15-coordinacion-dashboard.png', '16-coordinacion-filtros.png'] },
    'professional': { title: '4.1 Panel Profesional', files: ['17-profesional-dashboard.png', '18-profesional-pending.png', '18-profesional-history.png', '18-profesional-stats.png', '18-profesional-schedule.png'] },
    'aprendiz': { title: '5.1 Panel del Aprendiz', files: ['19-aprendiz-dashboard.png', '21-aprendiz-mobile.png'] },
    'special': { title: '6. Páginas Especiales', files: ['22-404-not-found.png', '23-403-unauthorized.png'] },
  };

  let html = '';
  for (const [key, section] of Object.entries(sections)) {
    html += `<h2>${section.title}</h2>`;
    for (const file of section.files) {
      const img = getBase64Image(path.join(SCREENSHOTS_DIR, file));
      if (img) {
        const label = file.replace('.png', '').replace(/-/g, ' ');
        html += `<div class="screenshot"><img src="${img}" alt="${label}"/><p class="caption">${label}</p></div>`;
      }
    }
  }
  return html;
}

const manualHTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Manual de Usuario - SENA Bienestar</title>
  <style>
    @page { margin: 20mm; size: A4; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; line-height: 1.6; padding: 40px; }
    .cover { text-align: center; padding: 100px 20px; page-break-after: always; }
    .cover h1 { font-size: 36px; color: #1a5c2e; margin-bottom: 10px; }
    .cover h2 { font-size: 20px; color: #64748b; font-weight: 400; margin-bottom: 30px; }
    .cover .date { color: #94a3b8; font-size: 14px; }
    .cover .logo { font-size: 72px; margin-bottom: 20px; }
    h1 { font-size: 28px; color: #1a5c2e; border-bottom: 3px solid #1a5c2e; padding-bottom: 8px; margin: 30px 0 15px; page-break-after: avoid; }
    h2 { font-size: 20px; color: #334155; margin: 25px 0 10px; page-break-after: avoid; }
    h3 { font-size: 16px; color: #475569; margin: 15px 0 8px; }
    p { margin: 8px 0; text-align: justify; }
    ul, ol { margin: 8px 0 8px 24px; }
    li { margin: 4px 0; }
    .screenshot { text-align: center; margin: 15px 0; page-break-inside: avoid; }
    .screenshot img { max-width: 100%; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .caption { font-size: 12px; color: #64748b; margin-top: 5px; font-style: italic; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; }
    th { background: #1a5c2e; color: white; font-weight: 600; }
    tr:nth-child(even) { background: #f8fafc; }
    .note { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 15px 0; border-radius: 0 8px 8px 0; }
    .tip { background: #dcfce7; border-left: 4px solid #22c55e; padding: 12px; margin: 15px 0; border-radius: 0 8px 8px 0; }
    .warning { background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 15px 0; border-radius: 0 8px 8px 0; }
    .page-break { page-break-before: always; }
    .toc { page-break-after: always; }
    .toc ul { list-style: none; margin: 0; padding: 0; }
    .toc li { padding: 8px 0; border-bottom: 1px dotted #cbd5e1; }
    .toc li a { text-decoration: none; color: #1e293b; }
  </style>
</head>
<body>
  <div class="cover">
    <div class="logo">🛡️</div>
    <h1>Manual de Usuario</h1>
    <h2>Sistema de Gestión de Citas<br/>SENA Bienestar</h2>
    <p class="date">Generado: ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    <p class="date">Versión 1.0</p>
  </div>

  <div class="toc">
    <h1>Contenido</h1>
    <ul>
      <li><strong>1.</strong> Acceso al Sistema</li>
      <li>&nbsp;&nbsp;&nbsp;1.1 Página de Login</li>
      <li>&nbsp;&nbsp;&nbsp;1.2 Registro de Usuario</li>
      <li>&nbsp;&nbsp;&nbsp;1.3 Recuperación de Contraseña</li>
      <li><strong>2.</strong> Panel de Administración</li>
      <li>&nbsp;&nbsp;&nbsp;2.1 Gestión de Usuarios</li>
      <li>&nbsp;&nbsp;&nbsp;2.2 Dependencias, Roles, Auditoría, Configuración</li>
      <li>&nbsp;&nbsp;&nbsp;2.3 Modo Oscuro y Paleta de Comandos</li>
      <li><strong>3.</strong> Panel de Coordinación</li>
      <li><strong>4.</strong> Panel Profesional</li>
      <li><strong>5.</strong> Panel del Aprendiz</li>
      <li><strong>6.</strong> Páginas Especiales (404, 403)</li>
      <li><strong>7.</strong> Roles y Permisos</li>
      <li><strong>8.</strong> Solución de Problemas</li>
    </ul>
  </div>

  <h1>1. Acceso al Sistema</h1>
  
  <h2>1.1 Página de Login</h2>
  <p>Para acceder al sistema, ingrese su correo electrónico y contraseña en la página de inicio de sesión. El sistema lo redirigirá automáticamente a su panel correspondiente según su rol.</p>
  <ul>
    <li>Ingrese su correo electrónico</li>
    <li>Ingrese su contraseña</li>
    <li>Haga clic en "Iniciar Sesión"</li>
  </ul>
  ${buildScreenshotsBySection().split('1.2 Página de Registro')[0]}

  <div class="page-break"></div>
  <h2>1.2 Registro de Nuevo Usuario</h2>
  <p>Si es nuevo en la plataforma, haga clic en "Regístrate aquí" para crear su cuenta.</p>
  <ul>
    <li>Nombre completo</li>
    <li>Número de documento (6-12 dígitos)</li>
    <li>Tipo de rol: Aprendiz, Profesional o Coordinación</li>
    <li>Correo electrónico</li>
    <li>Contraseña (mínimo 6 caracteres)</li>
  </ul>
  <div class="note"><strong>Nota:</strong> Los usuarios Profesionales y de Coordinación requieren aprobación del administrador.</div>
  ${buildScreenshotsBySection().split('1.2 Página de Registro')[1].split('1.3')[0]}

  <h2>1.3 Recuperación de Contraseña</h2>
  <p>Si olvidó su contraseña, haga clic en "¿Olvidaste tu contraseña?" y recibirá un correo con un enlace para restablecerla.</p>
  ${buildScreenshotsBySection().split('1.3 Recuperar Contraseña')[1].split('2.1')[0]}

  <div class="page-break"></div>
  <h1>2. Panel de Administración</h1>
  <p>Disponible exclusivamente para usuarios con rol <strong>SUPERADMIN</strong>.</p>

  <h2>2.1 Vista General y Gestión de Usuarios</h2>
  <p>El panel muestra estadísticas generales y permite administrar todos los usuarios del sistema.</p>
  ${buildScreenshotsBySection().split('2.1 Panel de Administración')[1].split('2.2')[0]}

  <h2>2.2 Funcionalidades del Admin</h2>
  <p>El administrador puede gestionar dependencias, roles y permisos, ver el registro de auditoría y configurar el sistema.</p>
  <ul>
    <li><strong>Dependencias:</strong> Crear, editar y eliminar áreas de bienestar</li>
    <li><strong>Roles:</strong> Gestionar permisos por rol</li>
    <li><strong>Auditoría:</strong> Registro de todas las acciones del sistema</li>
    <li><strong>Configuración:</strong> Parámetros generales</li>
  </ul>

  <h2>2.3 Modo Oscuro y Paleta de Comandos</h2>
  <p>El sistema ofrece tema oscuro (Ctrl+K para paleta de comandos) para navegación rápida.</p>
  ${buildScreenshotsBySection().split('2.2 Funcionalidades Admin')[1].split('3.1')[0]}

  <div class="page-break"></div>
  <h1>3. Panel de Coordinación</h1>
  <p>Disponible para usuarios con rol <strong>COORDINACION</strong>. Muestra KPIs, gráficos y métricas del bienestar.</p>
  <ul>
    <li>KPIs: Total citas, pendientes, tasa de cumplimiento, profesionales activos</li>
    <li>Filtros avanzados por rango de fechas</li>
    <li>Exportación de datos a CSV</li>
    <li>Gráficos de tendencia mensual y por dependencia</li>
  </ul>
  ${buildScreenshotsBySection().split('3.1 Panel de Coordinación')[1].split('4.1')[0]}

  <div class="page-break"></div>
  <h1>4. Panel Profesional</h1>
  <p>Disponible para usuarios con rol <strong>PROFESIONAL</strong>. Permite gestionar la agenda del día, citas pendientes, historial y horarios.</p>
  <ul>
    <li><strong>Agenda del Día:</strong> Vista de citas programadas para hoy</li>
    <li><strong>Pendientes:</strong> Citas esperando confirmación</li>
    <li><strong>Historial:</strong> Citas completadas</li>
    <li><strong>Estadísticas:</strong> Métricas personales de desempeño</li>
    <li><strong>Mis Horarios:</strong> Configuración de disponibilidad semanal</li>
  </ul>
  ${buildScreenshotsBySection().split('4.1 Panel Profesional')[1].split('5.1')[0]}

  <div class="page-break"></div>
  <h1>5. Panel del Aprendiz</h1>
  <p>Disponible para usuarios con rol <strong>APRENDIZ</strong>. Permite agendar y gestionar citas de bienestar.</p>
  <ul>
    <li>Ver todas las citas por estado</li>
    <li>Agendar nuevas citas con el botón flotante (FAB)</li>
    <li>Cancelar citas pendientes</li>
    <li>Vista responsive para móvil</li>
  </ul>
  <div class="tip"><strong>Tip:</strong> Solo puede tener máximo 2 citas pendientes simultáneamente.</div>
  ${buildScreenshotsBySection().split('5.1 Panel del Aprendiz')[1].split('6.')[0]}

  <div class="page-break"></div>
  <h1>6. Páginas Especiales</h1>
  <h2>Error 404 - Página No Encontrada</h2>
  <p>Se muestra cuando se intenta acceder a una URL que no existe en el sistema.</p>
  <h2>Error 403 - Acceso Denegado</h2>
  <p>Se muestra cuando el usuario no tiene permisos para acceder a la página solicitada.</p>
  ${buildScreenshotsBySection().split('6. Páginas Especiales')[1]}

  <div class="page-break"></div>
  <h1>7. Roles y Permisos</h1>
  <table>
    <tr><th>Rol</th><th>Descripción</th><th>Funciones Principales</th></tr>
    <tr><td>APRENDIZ</td><td>Estudiante del SENA</td><td>Agendar citas, ver estado, cancelar</td></tr>
    <tr><td>PROFESIONAL</td><td>Profesional de salud</td><td>Atender citas, horarios, notas clínicas</td></tr>
    <tr><td>COORDINACION</td><td>Coordinador</td><td>Ver métricas, exportar, supervisar</td></tr>
    <tr><td>SUPERADMIN</td><td>Administrador</td><td>Gestionar todo el sistema</td></tr>
  </table>

  <h1>8. Solución de Problemas</h1>
  <table>
    <tr><th>Problema</th><th>Solución</th></tr>
    <tr><td>No puedo iniciar sesión</td><td>Verifique correo y contraseña. Use recuperación si olvidó.</td></tr>
    <tr><td>No veo la opción de agendar</td><td>Verifique que no tenga 2 citas pendientes.</td></tr>
    <tr><td>Los datos no se actualizan</td><td>Haga clic en "Actualizar" o recargue la página.</td></tr>
    <tr><td>No accedo a cierta página</td><td>Verifique su rol. Contacte al administrador.</td></tr>
  </table>

  <div style="text-align:center; margin-top:40px; color:#64748b; font-size:12px;">
    <p>SENA Bienestar - Sistema de Gestión de Citas © 2026</p>
  </div>
</body>
</html>`;

const htmlPath = path.join(OUTPUT_DIR, 'manual-usuario.html');
fs.writeFileSync(htmlPath, manualHTML);

async function generatePDF() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setContent(manualHTML, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  await page.pdf({
    path: path.join(OUTPUT_DIR, 'Manual_Usuario_SENA_Bienestar.pdf'),
    format: 'A4',
    printBackground: true,
    margin: { top: '15mm', bottom: '15mm', left: '12mm', right: '12mm' }
  });
  
  console.log('✅ Manual de usuario PDF generado con capturas embebidas');
  await browser.close();
}

generatePDF().catch(console.error);
