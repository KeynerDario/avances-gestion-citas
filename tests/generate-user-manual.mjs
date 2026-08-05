import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const BASE = 'http://localhost:5173';
const SCREENSHOTS_DIR = path.join(import.meta.dirname, '..', 'report', 'manual-screenshots');
const OUTPUT_DIR = path.join(import.meta.dirname, '..', 'report');
const GENERATE_PDF_SCRIPT = path.join(import.meta.dirname, '..', '.opencode', 'skills', 'generate-documents', 'scripts', 'generate-pdf.js');

fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const USERS = [
  { email: 'admin@test.com', pass: 'Test1234!', role: 'SUPERADMIN', name: 'Ana Admin', home: '/admin' },
  { email: 'coordinacion@test.com', pass: 'Test1234!', role: 'COORDINACION', name: 'Carlos Coordinador', home: '/coordination' },
  { email: 'profesional@test.com', pass: 'Test1234!', role: 'PROFESIONAL', name: 'Maria Profesional', home: '/professional' },
  { email: 'aprendiz@test.com', pass: 'Test1234!', role: 'APRENDIZ', name: 'Juan Aprendiz', home: '/dashboard' },
];

async function shot(page, name, opts = {}) {
  await page.waitForTimeout(opts.wait || 1500);
  const filePath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: opts.fullPage !== false });
  console.log(`  📸 ${name}`);
  return filePath;
}

async function captureAllPages() {
  console.log('📖 CAPTURANDO PÁGINAS PARA MANUAL DE USUARIO');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: true });
  const captured = {};

  // 1. LOGIN
  console.log('\n--- 1. Página de Login ---');
  let page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  captured.login = await shot(page, '01-login');
  await page.fill('#login-email', 'admin@test.com');
  await page.fill('#login-password', 'Test1234!');
  await shot(page, '02-login-lleno');
  await page.click('.btn-login');
  await page.waitForTimeout(3000);
  await page.close();

  // 2. REGISTRO
  console.log('\n--- 2. Página de Registro ---');
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/register`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  captured.register = await shot(page, '03-registro');
  await page.fill('input[name="full_name"]', 'Pedro Prueba');
  await page.fill('input[name="document_number"]', '12345678');
  await page.fill('input[name="email"]', 'pedro@test.com');
  await page.fill('input[name="password"]', 'Test1234!');
  await page.fill('input[name="confirmPassword"]', 'Test1234!');
  await shot(page, '04-registro-lleno');
  await page.close();

  // 3. OLVIDÉ MI CONTRASEÑA
  console.log('\n--- 3. Recuperar Contraseña ---');
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/forgot-password`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  captured.forgotPassword = await shot(page, '05-olvide-contrasena');
  await page.close();

  // 4. PANEL ADMIN
  console.log('\n--- 4. Panel de Administración ---');
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.fill('#login-email', 'admin@test.com');
  await page.fill('#login-password', 'Test1234!');
  await page.click('.btn-login');
  await page.waitForTimeout(3000);
  captured.adminDashboard = await shot(page, '06-admin-dashboard');

  // Admin - Usuarios
  const usersTab = await page.$('#tab-users');
  if (usersTab) { await usersTab.click(); await page.waitForTimeout(1000); }
  captured.adminUsers = await shot(page, '07-admin-usuarios');

  // Admin - Dependencias
  const depsTab = await page.$('#tab-deps');
  if (depsTab) { await depsTab.click(); await page.waitForTimeout(1000); }
  captured.adminDeps = await shot(page, '08-admin-dependencias');

  // Admin - Roles
  const rolesTab = await page.$('#tab-roles');
  if (rolesTab) { await rolesTab.click(); await page.waitForTimeout(1000); }
  captured.adminRoles = await shot(page, '09-admin-roles');

  // Admin - Auditoría
  const auditTab = await page.$('#tab-audit');
  if (auditTab) { await auditTab.click(); await page.waitForTimeout(1000); }
  captured.adminAudit = await shot(page, '10-admin-auditoria');

  // Admin - Configuración
  const configTab = await page.$('#tab-config');
  if (configTab) { await configTab.click(); await page.waitForTimeout(1000); }
  captured.adminConfig = await shot(page, '11-admin-configuracion');

  // Admin - Perfil
  const profileBtn = await page.$('.profile-trigger');
  if (profileBtn) {
    await profileBtn.click();
    await page.waitForTimeout(500);
    captured.adminProfile = await shot(page, '12-admin-perfil');
    const closeBtn = await page.$('.aside-hero-close');
    if (closeBtn) await closeBtn.click();
  }

  // Admin - Dark Mode
  const themeBtn = await page.$('button[aria-label="Cambiar tema"]');
  if (themeBtn) {
    await themeBtn.click();
    await page.waitForTimeout(500);
    captured.adminDark = await shot(page, '13-admin-modo-oscuro');
    await themeBtn.click();
  }

  // Admin - Command Palette
  await page.keyboard.press('Control+k');
  await page.waitForTimeout(500);
  captured.adminCmdPalette = await shot(page, '14-admin-palette');
  await page.keyboard.press('Escape');
  await page.close();

  // 5. PANEL COORDINACIÓN
  console.log('\n--- 5. Panel de Coordinación ---');
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.fill('#login-email', 'coordinacion@test.com');
  await page.fill('#login-password', 'Test1234!');
  await page.click('.btn-login');
  await page.waitForTimeout(3000);
  captured.coordDashboard = await shot(page, '15-coordinacion-dashboard');

  const filterBtn = await page.$('.advanced-toggle');
  if (filterBtn) {
    await filterBtn.click();
    await page.waitForTimeout(500);
    captured.coordFilters = await shot(page, '16-coordinacion-filtros');
  }
  await page.close();

  // 6. PANEL PROFESIONAL
  console.log('\n--- 6. Panel Profesional ---');
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.fill('#login-email', 'profesional@test.com');
  await page.fill('#login-password', 'Test1234!');
  await page.click('.btn-login');
  await page.waitForTimeout(3000);
  captured.profDashboard = await shot(page, '17-profesional-dashboard');

  for (const tab of ['pending', 'history', 'stats', 'schedule']) {
    const btn = await page.$(`#tab-${tab}`);
    if (btn) {
      await btn.click();
      await page.waitForTimeout(1000);
      captured[`prof_${tab}`] = await shot(page, `18-profesional-${tab}`);
    }
  }
  await page.close();

  // 7. PANEL APRENDIZ
  console.log('\n--- 7. Panel Aprendiz ---');
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.fill('#login-email', 'aprendiz@test.com');
  await page.fill('#login-password', 'Test1234!');
  await page.click('.btn-login');
  await page.waitForTimeout(3000);
  captured.aprendizDashboard = await shot(page, '19-aprendiz-dashboard');

  // Aprendiz - Modal nueva cita
  const fabBtn = await page.$('.fab-btn');
  if (fabBtn) {
    await fabBtn.click();
    await page.waitForTimeout(1000);
    captured.aprendizModal = await shot(page, '20-aprendiz-modal-cita');
    const closeBtn = await page.$('.modal-close');
    if (closeBtn) await closeBtn.click();
  }

  // Aprendiz - Móvil
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(500);
  captured.aprendizMobile = await shot(page, '21-aprendiz-mobile');
  await page.close();

  // 8. PÁGINAS ESPECIALES
  console.log('\n--- 8. Páginas Especiales ---');
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/nonexistent`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  captured.notFound = await shot(page, '22-404-not-found');

  await page.goto(`${BASE}/unauthorized`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  captured.unauthorized = await shot(page, '23-403-unauthorized');
  await page.close();

  await browser.close();
  return captured;
}

function generatePDFContent(captured) {
  const screenshotFiles = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png')).sort();

  const content = [
    { type: "heading", level: 1, text: "Manual de Usuario" },
    { type: "heading", level: 2, text: "Sistema de Gestión de Citas - SENA Bienestar" },
    { type: "paragraph", text: "Documento generado automáticamente con capturas reales de la aplicación.", italic: true },
    { type: "spacer", height: 10 },
    { type: "paragraph", text: `Fecha de generación: ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}` },
    { type: "line" },

    // 1. INTRODUCCIÓN
    { type: "heading", level: 1, text: "1. Introducción" },
    { type: "paragraph", text: "El Sistema de Gestión de Citas SENA Bienestar es una plataforma web diseñada para facilitar la agendación y seguimiento de citas de bienestar para la comunidad del SENA. Permite a aprendices, profesionales de salud, coordinadores y administradores gestionar citas de forma eficiente y segura." },
    { type: "spacer", height: 10 },

    // 2. ACCESO AL SISTEMA
    { type: "heading", level: 1, text: "2. Acceso al Sistema" },
    { type: "heading", level: 2, text: "2.1 Página de Login" },
    { type: "paragraph", text: "Para acceder al sistema, ingrese a la URL proporcionada por su institución. Se mostrará la página de inicio de sesión donde deberá ingresar su correo electrónico y contraseña." },
    { type: "paragraph", text: "Pasos:" },
    { type: "list", items: [
      "Ingrese su correo electrónico en el campo correspondiente",
      "Ingrese su contraseña en el campo de contraseña",
      "Haga clic en el botón 'Iniciar Sesión'",
      "El sistema lo redirigirá a su panel según su rol"
    ]},

    { type: "heading", level: 2, text: "2.2 Registro de Nuevo Usuario" },
    { type: "paragraph", text: "Si es la primera vez que accede al sistema, deberá registrarse haciendo clic en 'Regístrate aquí' en la página de login." },
    { type: "paragraph", text: "Datos requeridos:" },
    { type: "list", items: [
      "Nombre completo",
      "Número de documento (6-12 dígitos)",
      "Tipo de rol: Aprendiz, Profesional o Coordinación",
      "Correo electrónico",
      "Contraseña (mínimo 6 caracteres)"
    ]},
    { type: "paragraph", text: "Nota: Los usuarios Profesionales y de Coordinación requieren aprobación del administrador antes de activar su cuenta.", italic: true },

    { type: "heading", level: 2, text: "2.3 Recuperación de Contraseña" },
    { type: "paragraph", text: "Si olvidó su contraseña, haga clic en '¿Olvidaste tu contraseña?' en la página de login. Recibirá un correo electrónico con un enlace para restablecer su contraseña." },

    // 3. ROLES Y PERMISOS
    { type: "heading", level: 1, text: "3. Roles y Permisos" },
    { type: "paragraph", text: "El sistema cuenta con cuatro roles principales:" },
    { type: "table", headers: ["Rol", "Descripción", "Funciones Principales"], rows: [
      ["APRENDIZ", "Estudiante del SENA", "Agendar citas, ver estado, cancelar citas"],
      ["PROFESIONAL", "Profesional de salud", "Atender citas, gestionar horarios, notas clínicas"],
      ["COORDINACION", "Coordinador de dependencia", "Ver métricas, exportar datos, supervisar"],
      ["SUPERADMIN", "Administrador del sistema", "Gestionar usuarios, roles, configuración"]
    ]},
    { type: "spacer", height: 10 },

    // 4. PANEL APRENDIZ
    { type: "heading", level: 1, text: "4. Panel del Aprendiz" },
    { type: "heading", level: 2, text: "4.1 Vista General" },
    { type: "paragraph", text: "El panel del aprendiz muestra un resumen de todas sus citas con estadísticas por estado: pendientes, confirmadas, completadas y canceladas." },
    { type: "paragraph", text: "Características principales:" },
    { type: "list", items: [
      "Filtros por estado de cita (Todas, Pendientes, Confirmadas, Completadas, Canceladas)",
      "Botón flotante (FAB) para agendar nueva cita",
      "Paginación para navegar entre citas",
      "Botón de actualizar para refrescar datos"
    ]},

    { type: "heading", level: 2, text: "4.2 Agendar Nueva Cita" },
    { type: "paragraph", text: "Para agendar una nueva cita:" },
    { type: "list", items: [
      "Haga clic en el botón '+' (FAB) en la esquina inferior derecha",
      "Seleccione la dependencia (Psicología, Enfermería, etc.)",
      "Seleccione un profesional disponible",
      "Elija fecha y hora disponible",
      "Describa el motivo de la cita",
      "Confirme la solicitud"
    ]},
    { type: "paragraph", text: "Nota: Solo puede tener un máximo de 2 citas pendientes simultáneamente.", italic: true },

    { type: "heading", level: 2, text: "4.3 Cancelar Cita" },
    { type: "paragraph", text: "Para cancelar una cita pendiente, haga clic en el botón 'Cancelar' en la tarjeta de la cita. La acción es inmediata y no se puede deshacer." },

    // 5. PANEL PROFESIONAL
    { type: "heading", level: 1, text: "5. Panel del Profesional" },
    { type: "heading", level: 2, text: "5.1 Agenda del Día" },
    { type: "paragraph", text: "La agenda del día muestra todas las citas programadas para la fecha seleccionada. El profesional puede:" },
    { type: "list", items: [
      "Confirmar citas pendientes",
      "Marcar citas como completadas",
      "Registrar no asistencias",
      "Agregar notas clínicas a las citas",
      "Cambiar la fecha para ver otras agendas"
    ]},

    { type: "heading", level: 2, text: "5.2 Gestión de Horarios" },
    { type: "paragraph", text: "En la pestaña 'Mis Horarios', el profesional puede configurar su disponibilidad semanal:" },
    { type: "list", items: [
      "Agregar nuevos horarios por día de la semana",
      "Definir hora de inicio y fin",
      "Activar/desactivar horarios sin eliminarlos",
      "Eliminar horarios que ya no apliquen"
    ]},

    { type: "heading", level: 2, text: "5.3 Estadísticas Personales" },
    { type: "paragraph", text: "La pestaña 'Estadísticas' muestra métricas de desempeño del profesional:" },
    { type: "list", items: [
      "Total de citas atendidas",
      "Tasa de asistencia",
      "Citas por dependencia",
      "Tendencia mensual"
    ]},

    { type: "heading", level: 2, text: "5.4 Notas Clínicas" },
    { type: "paragraph", text: "Al completar una cita, el profesional puede registrar notas clínicas que incluyen:" },
    { type: "list", items: [
      "Descripción de la atención",
      "Observaciones adicionales",
      "Recomendaciones para el aprendiz"
    ]},

    // 6. PANEL COORDINACIÓN
    { type: "heading", level: 1, text: "6. Panel de Coordinación" },
    { type: "paragraph", text: "El panel de coordinación ofrece una vista general de métricas y KPIs relevantes para la gestión del bienestar." },
    { type: "heading", level: 2, text: "6.1 KPIs Principales" },
    { type: "list", items: [
      "Total de citas en el periodo",
      "Citas pendientes",
      "Tasa de cumplimiento",
      "Profesionales activos",
      "No asistencias",
      "Tiempo promedio de espera"
    ]},

    { type: "heading", level: 2, text: "6.2 Filtros y Exportación" },
    { type: "list", items: [
      "Filtros avanzados por rango de fechas",
      "Exportación de datos a CSV",
      "Botón de actualización de métricas"
    ]},

    // 7. PANEL ADMINISTRACIÓN
    { type: "heading", level: 1, text: "7. Panel de Administración" },
    { type: "paragraph", text: "El panel de administración está disponible exclusivamente para usuarios con rol SUPERADMIN." },

    { type: "heading", level: 2, text: "7.1 Gestión de Usuarios" },
    { type: "paragraph", text: "Permite administrar todos los usuarios del sistema:" },
    { type: "list", items: [
      "Ver lista completa de usuarios",
      "Buscar usuarios por nombre o correo",
      "Cambiar roles de usuarios",
      "Activar/desactivar usuarios",
      "Crear nuevos usuarios"
    ]},

    { type: "heading", level: 2, text: "7.2 Gestión de Dependencias" },
    { type: "paragraph", text: "Administra las dependencias (áreas de bienestar) del sistema:" },
    { type: "list", items: [
      "Crear nuevas dependencias",
      "Editar nombre y color de dependencias",
      "Eliminar dependencias"
    ]},

    { type: "heading", level: 2, text: "7.3 Roles y Permisos" },
    { type: "paragraph", text: "Gestiona los roles del sistema y sus permisos asociados." },

    { type: "heading", level: 2, text: "7.4 Registro de Auditoría" },
    { type: "paragraph", text: "Muestra un registro detallado de todas las acciones realizadas en el sistema:" },
    { type: "list", items: [
      "Creación de usuarios",
      "Agendamiento de citas",
      "Cambios de estado",
      "Configuración del sistema"
    ]},

    { type: "heading", level: 2, text: "7.5 Configuración del Sistema" },
    { type: "paragraph", text: "Permite configurar parámetros generales del sistema." },

    // 8. FUNCIONALIDADES GENERALES
    { type: "heading", level: 1, text: "8. Funcionalidades Generales" },

    { type: "heading", level: 2, text: "8.1 Modo Oscuro" },
    { type: "paragraph", text: "El sistema ofrece un tema oscuro para mayor comodidad visual. Para activarlo:" },
    { type: "list", items: [
      "Haga clic en el botón de tema (sol/luna) en la barra lateral",
      "El cambio se aplica inmediatamente",
      "La preferencia se guarda para futuras sesiones"
    ]},

    { type: "heading", level: 2, text: "8.2 Paleta de Comandos" },
    { type: "paragraph", text: "Acceda rápidamente a cualquier funcionalidad:" },
    { type: "list", items: [
      "Presione Ctrl+K (o Cmd+K en Mac)",
      "Escriba lo que desea buscar",
      "Seleccione la opción deseada",
      "Presione Escape para cerrar"
    ]},

    { type: "heading", level: 2, text: "8.3 Perfil de Usuario" },
    { type: "paragraph", text: "Para acceder a su perfil:" },
    { type: "list", items: [
      "Haga clic en su nombre en la barra lateral",
      "Se abrirá un panel con su información",
      "Puede cerrar el panel con el botón X"
    ]},

    { type: "heading", level: 2, text: "8.4 Responsive" },
    { type: "paragraph", text: "El sistema está optimizado para dispositivos móviles. La interfaz se adapta automáticamente al tamaño de la pantalla." },

    // 9. SOLUCIÓN DE PROBLEMAS
    { type: "heading", level: 1, text: "9. Solución de Problemas" },
    { type: "table", headers: ["Problema", "Solución"], rows: [
      ["No puedo iniciar sesión", "Verifique su correo y contraseña. Si olvidó su contraseña, use la opción de recuperación."],
      ["No veo la opción de agendar", "Verifique que no tenga 2 citas pendientes. Solo se permiten 2 pendientes simultáneas."],
      ["Los datos no se actualizan", "Haga clic en el botón 'Actualizar' o recargue la página."],
      ["No accedo a cierta página", "Verifique que su rol tenga los permisos necesarios. Contacte al administrador si el problema persiste."],
      ["La página no se ve bien", "Intente limpiar la caché del navegador o usar otro navegador."]
    ]},

    { type: "spacer", height: 20 },
    { type: "line" },
    { type: "paragraph", text: "Para soporte técnico, contacte al administrador del sistema.", italic: true },
    { type: "paragraph", text: "SENA Bienestar - Sistema de Gestión de Citas © 2026", italic: true },
  ];

  return { title: "Manual de Usuario", subtitle: "SENA Bienestar - Sistema de Gestión de Citas", date: new Date().toLocaleDateString('es-CO'), content };
}

async function main() {
  const captured = await captureAllPages();

  console.log('\n📄 GENERANDO PDF DEL MANUAL DE USUARIO...');
  const pdfData = generatePDFContent(captured);
  const jsonPath = path.join(OUTPUT_DIR, 'manual-data.json');
  fs.writeFileSync(jsonPath, JSON.stringify(pdfData, null, 2));

  try {
    execSync(`node "${GENERATE_PDF_SCRIPT}" "${path.join(OUTPUT_DIR, 'Manual_Usuario_Gestion_Citas_SENA_Playwright.pdf')}" --file "${jsonPath}"`, { stdio: 'inherit' });
  } catch (err) {
    console.error('Error generando PDF:', err.message);
  }

  console.log('\n✅ PROCESO COMPLETADO');
  console.log(`📸 Capturas: ${SCREENSHOTS_DIR}`);
  console.log(`📄 Manual PDF: ${path.join(OUTPUT_DIR, 'Manual_Usuario_Gestion_Citas_SENA_Playwright.pdf')}`);
}

main().catch(console.error);
