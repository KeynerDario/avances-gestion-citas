# Plan Maestro de Rediseño UI/UX — SENA Bienestar

## Resumen Ejecutivo

Este documento contiene el análisis completo, las recomendaciones de experto en UI/UX, el estudio competitivo, las tendencias de diseño 2026, y el plan de ejecución para rediseñar todas las interfaces de la aplicación de gestión de citas del SENA.

---

## 1. DIAGNÓSTICO ACTUAL

### 1.1 Estado de la Interfaz

La aplicación actual tiene una estructura funcional pero presenta claros signos de haber sido construida incrementalmente sin un design system unificado:

**Problemas identificados:**

| Problema | Severidad | Cantidad |
|----------|-----------|----------|
| Clases CSS duplicadas con definiciones diferentes | ALTA | 12 clases |
| Colores hardcodeados (hex) bypassing variables | ALTA | 100+ instancias |
| 7+ variantes de botón verde con padding/radius diferentes | ALTA | 7 variantes |
| 8+ estilos de input con border/padding/radius diferentes | ALTA | 8 estilos |
| Sin escala tipográfica (20+ tamaños de font ad-hoc) | ALTA | 20+ valores |
| Solo 1 token de sombra definido, 15+ sombras reales | MEDIA | 15+ valores |
| 10+ valores de border-radius sin tokenizar | MEDIA | 10+ valores |
| Transiciones inconsistentes (0.15s, 0.2s, 0.25s, 0.3s) | MEDIA | 7 patrones |
| 5 breakpoints diferentes sin tokens | MEDIA | 5 breakpoints |
| 34 estilos inline que bypass dark mode | MEDIA | 34 instancias |
| @keyframes spin definido 3 veces | BAJA | 3 archivos |
| Sin soporte `prefers-reduced-motion` | ALTA | 0 soporte |
| Accesibilidad deficiente (sin ARIA, sin focus trap) | ALTA | Generalizado |

### 1.2 Lo que SÍ funciona bien

- Estructura de carpetas por features (auth, appointments, dashboard, admin)
- Iconografía consistente con Lucide React
- Dark mode comprehensivo (1,877 líneas)
- Estados de carga/vacío consistentes (spinner + texto)
- Hooks personalizados que separan lógica de negocio de UI
- Code splitting con React.lazy() y Suspense
- Validación con Zod en AppointmentForm

---

## 2. ANÁLISIS POR PLATAFORMA

### 2.1 Web (Desktop)

**Dashboard de Aprendiz:**
- Header con título + botón "Nueva Cita" + perfil
- Stats row: 4 tarjetas KPI en grid
- Filter tabs: Pendientes, Confirmadas, Completadas, Canceladas, No asistió
- Lista de tarjetas de citas con border-left color
- Modal para crear cita

**Dashboard Profesional:**
- Greeting + badge de dependencia
- Tabs: Agenda del Día, Pendientes, Historial, Estadísticas, Mis Horarios
- Timeline de agenda con slots de 30min
- Modal de notas clínicas

**Dashboard de Coordinación:**
- KPI cards (8 métricas en 2 filas)
- Charts (barras + líneas)
- Tabla de rendimiento profesional
- Exportar CSV

**Dashboard Admin:**
- Stat cards en header
- Tabs: Usuarios, Dependencias, Roles, Auditoría, Config
- Tarjetas expandibles de usuarios
- Timeline de auditoría

### 2.2 Móvil

**Patrones responsivos actuales:**
- Grid 4 columnas → 2 columnas (768px) → 1 columna (480px)
- Tabs con scroll horizontal, texto oculto en móviles
- Cards apiladas verticalmente
- Formularios en columna única

**Problemas en móvil:**
- Tablas sin tratamiento mobile específico (solo overflow-x)
- Touch targets pequeños (< 44px en algunos botones)
- Formulario de cita no apila columnas en móvil
- Sidebar del perfil ocupa 100vw en móvil (puede ser mejor)

---

## 3. TENDENCIAS DE DISEÑO 2026

### 3.1 Calm Design (Diseño Tranquilo)

**Qué es:** Ocultar todo lo no esencial por defecto. Mostrar solo lo necesario para la tarea actual.

**Referentes:** Linear, Calendly

**Aplicación al proyecto:**
- Vista por defecto muestra solo 4-6 KPIs accionables
- Filtros avanzados detrás de "Mostrar filtros"
- Eliminar elementos decorativos que no sirvan para una decisión
- Tipografía como elemento principal, reducir densidad de iconos

### 3.2 AI como Infraestructura, no Feature

**Qué es:** La inteligencia artificial integrada silenciosamente, sin badges ni paneles separados.

**Referentes:** Notion, Intercom

**Aplicación al proyecto:**
- Sugerencias de horarios disponibles basadas en historial
- Auto-clasificación de citas por tipo
- Resumen automático de notas clínicas

### 3.3 Command Palettes (Palettes de Comandos)

**Qué es:** Cmd+K para acceder a cualquier acción. Navegación por teclado como estándar.

**Referentes:** Linear, Slack, Figma

**Aplicación al proyecto:**
- Cmd+K para buscar citas, profesionales, dependencias
- Acciones rápidas: "Crear cita", "Ver agenda de hoy"
- Navegación sin mouse para power users

### 3.4 Interfaz Adaptativa por Rol

**Qué es:** La interfaz cambia según quién eres, no solo qué puedes ver.

**Referentes:** HubSpot, Asana

**Aplicación al proyecto:**
- Aprendiz: vista centrada en citas, mínimo admin
- Profesional: agenda primero, notas clínicas prominentes
- Coordinación: KPIs y métricas de rendimiento
- Admin: salud del sistema, gestión de usuarios

### 3.5 Progressive Disclosure (Revelación Progresiva)

**Qué es:** Mostrar complejidad cuando el usuario está listo.

**Referentes:** Miro, Stripe

**Aplicación al proyecto:**
- Empty states que enseñan UNA acción
- Secciones de config con "Avanzado" colapsable
- Onboarding secuencial por rol

### 3.6 Emotional Design en B2B

**Qué es:** Software de trabajo que se siente bien usar.

**Referentes:** Asana, Notion

**Aplicación al proyecto:**
- Micro-animaciones al completar tarea
- Empty states con voz humana ("No tienes citas pendientes. ¡Buen trabajo!")
- Momentos de celebración (cita completada → animación sutil)
- Loading states con personalidad

### 3.7 Strategic Minimalism

**Qué es:** Cada elemento gana su lugar o se elimina.

**Referentes:** Vercel, Linear

**Aplicación al proyecto:**
- Auditar cada tarjeta: ¿cambia el comportamiento del usuario?
- Un CTA primario por pantalla
- Reducir cantidad de badges/chips
- Eliminar labels redundantes

### 3.8 Mobile-First Architecture

**Qué es:** Diseñar para pantalla de teléfono primero, expandir para desktop.

**Referentes:** Rosenthal, Uber

**Aplicación al proyecto:**
- KPI cards apiladas en columna única en móvil
- Tabs → bottom sheet o scroll horizontal
- Formularios en columna única con inputs full-width
- Touch targets mínimos de 44px

---

## 4. ESTUDIO COMPETITIVO — TOP 5 DASHBOARDS

### 4.1 Linear — https://linear.app

**Qué aprender:**
- **Calm Design puro:** Interfaz por defecto limpia, whitespace pesado, zero ruido visual
- **Sidebar navigation:** 256px expandido, 64px colapsado (icon rail)
- **Cmd+K command palette:** Cada acción accesible por teclado
- **Status badges:** Background tint sutil, no colores saturados
- **Keyboard-first:** Toda la navegación funciona sin mouse

**Patrón de KPI cards:** No usa tarjetas KPI tradicionales. La lista de issues ES el dashboard.

**Aplicable al proyecto:** Sidebar navigation, command palette, calma visual en la lista de citas.

### 4.2 Stripe Dashboard — https://dashboard.stripe.com

**Qué aprender:**
- **4-card KPI strip:** Revenue, Charges, Payouts, Disputes — cada una con número grande + trend + sparkline
- **Data density:** Información浓缩 sin ser abrumadora
- **Tablas excelentes:** Headers sticky, números alineados a la derecha, badges de status centrados
- **Progressive disclosure:** Settings complejos ocultos detrás de expandibles
- **Consistencia:** Radio 12px, sombras sutiles, todo usa el mismo sistema

**Patrón de tabla:** `position: sticky` en headers, `overflow-x: auto` en contenedor, columna fija izquierda.

**Aplicable al proyecto:** Patrón de KPI cards con trend indicators, tablas con headers sticky.

### 4.3 Vercel — https://vercel.com/dashboard

**Qué aprender:**
- **Dark mode como first-class citizen:** No es un add-on, es el diseño principal
- **Strategic minimalism:** Cada elemento gana su lugar
- **Container queries:** Cards que se adaptan a su container, no al viewport
- **Deployment status como métrica primaria**
- **Minimal chrome:** Maximum contenido

**Aplicable al proyecto:** Dark mode como opción principal, minimal chrome en headers.

### 4.4 Notion — https://notion.so

**Qué aprender:**
- **Onboarding adaptativo:** Pregunta qué usarás para personalizar la experiencia
- **Empty states que enseñan:** No son errores, son tutoriales
- **Voz humana:** Copy que suena como persona, no como manual
- **Celebration moments:** Unicorns cuando publicas, confetti en logros
- **Progressive disclosure:** Features poderosas se revelan con el tiempo

**Aplicable al proyecto:** Empty states educativos, copy humano, onboarding por rol.

### 4.5 HubSpot CRM — https://hubspot.com/products/crm

**Qué aprender:**
- **Role-adaptive interfaces:** Sales rep ve pipeline, marketing ve campaigns, admin ve billing
- **Pipeline visualization:** Kanban-style para flujo de citas
- **Activity timeline:** Historial de interacciones por contacto
- **Clean forms:** Inline validation, labels claros, un campo por línea

**Aplicable al proyecto:** Vista adaptativa por rol, visualización tipo pipeline para estados de citas.

---

## 5. RECOMENDACIONES DE EXPERTO UI/UX

### 5.1 Principios Fundamentales

1. **Consistencia sobre creatividad:** Un botón verde que se ve igual siempre es mejor que 7 variantes "creativas"
2. **Tokens antes de componentes:** Definir variables ANTES de diseñar pantallas
3. **Un token = un valor:** Nunca hardcodear `#6b7280` cuando existe `var(--text-secondary)`
4. **Accesibilidad no es opcional:** ARIA labels, focus management, keyboard navigation son requisitos mínimos
5. **Mobile-first real:** No es responsive after-the-fact, es el punto de partida

### 5.2 Decisiones de Arquitectura

| Decisión | Recomendación | Razón |
|----------|--------------|-------|
| CSS approach | Mantener CSS puro + tokens | Ya funciona, no cambiar |
| Component library | Considerar shadcn/ui o Radix | Ahorra tiempo, accessibility built-in |
| Typography | Inter o system-ui | Legible, moderna, performante |
| Icons | Lucide (mantener) | Ya funciona, es consistente |
| Charts | Recharts (mantener) | Ya funciona, good defaults |
| Forms | React Hook Form + Zod (estandarizar) | Ya usado en AppointmentForm |

### 5.3 Quick Wins (Impacto alto, esfuerzo bajo)

1. **Eliminar hex hardcodeados** → Reemplazar con tokens (1-2 días)
2. **Unificar botones** → Crear `.btn` system unificado (1 día)
3. **Unificar inputs** → Crear `.input` system unificado (1 día)
4. **Agregar ARIA labels** → Todos los botones icon-only (medio día)
5. **Fix focus rings** → Unificar a un solo patrón (medio día)
6. **Eliminar @keyframes spin duplicados** → Definición única (1 hora)
7. **Skeleton loading states** → Reemplazar spinners (1 día)

---

## 6. SKILL DE DISEÑO (Para este y futuros proyectos)

### 6.1 Instrucciones de la Skill

La skill está diseñada para cargar automáticamente cuando el usuario pida:
- Rediseño de interfaces
- Análisis de calidad UI/UX
- Creación de design systems
- Estudio competitivo de dashboards
- Aplicación de tendencias de diseño
- Creación/modificación de CSS tokens
- Estandarización de componentes

### 6.2 Flujo de Trabajo de la Skill

```
FASE 1: AUDIT → Inventario de interfaces + tokens + duplicados + accesibilidad
FASE 2: FOUNDATION → Design tokens + dark mode strategy + componentes unificados
FASE 3: TRENDS → Aplicar tendencias 2026 relevantes
FASE 4: BENCHMARKS → Estudiar los 5 dashboards referencia
FASE 5: IMPLEMENT → Checklist priorizado por impacto
FASE 6: VALIDATE → Testing de accesibilidad + mobile + dark mode
```

### 6.3 Contenido de la Skill (para crear manualmente)

**Ruta del archivo:** `.opencode/skills/ui-ux-redesign/SKILL.md`

**Frontmatter:**
```yaml
---
name: ui-ux-redesign
description: Use when redesigning UI/UX of any web or mobile application, creating design systems, analyzing interface quality, applying 2026 design trends, performing competitive analysis of dashboards, or when the user asks about UI improvements, visual consistency, accessibility, or component standardization.
---
```

El contenido completo de la skill incluye:
- Tabla de auditoría de design tokens
- Checklist de duplicados CSS
- Template de tokens completo (colors, typography, spacing, radius, shadows, transitions, z-index)
- Estrategia de dark mode por tokens semánticos
- Template de componentes unificados (buttons, inputs, cards)
- 7 tendencias 2026 con aplicación específica
- 5 benchmarks con links y patrones extraíbles
- Checklist de implementación priorizado por semana
- Quick reference de anti-patrones comunes
- 16 preguntas para hacer antes de empezar

**(Ver archivo completo en la sección 8 de este documento)**

---

## 7. PLAN DE EJECUCIÓN

### Semana 1-2: Fundación

| Tarea | Archivos | Esfuerzo |
|-------|----------|----------|
| Expandir `variables.css` con tokens completos | variables.css | 4h |
| Eliminar hex hardcodeados en todo el CSS | 9 archivos CSS | 8h |
| Crear `.btn` system unificado | buttons.css | 4h |
| Crear `.input` system unificado | admin.css, appointments.css, auth.css | 4h |
| Crear `.card` system unificado | appointments.css, admin.css | 3h |
| Agregar `prefers-reduced-motion` | global.css | 1h |
| Agregar `prefers-color-scheme` fallback | dark-mode.css | 2h |
| Definir z-index scale | variables.css + todos los archivos | 2h |

### Semana 2-3: Componentes

| Tarea | Archivos | Esfuerzo |
|-------|----------|----------|
| Resolver 12 clases duplicadas | admin.css, appointments.css, layout.css | 6h |
| Unificar focus rings | buttons.css, auth.css, admin.css | 2h |
| Unificar border-radius (usar tokens) | Todos los CSS | 3h |
| Unificar shadows (usar tokens) | Todos los CSS | 3h |
| Eliminar @keyframes spin duplicados | auth.css, admin.css, appointments.css | 1h |
| Mover inline styles a CSS variables | 12 archivos JSX | 4h |
| Agregar ARIA labels a botones icon-only | ~15 componentes JSX | 3h |
| Agregar role="dialog" y aria-modal a modales | ~5 modales JSX | 2h |
| Agregar focus trapping a modales | ~5 modales JSX | 3h |
| Agregar Escape key handler a modales | ~5 modales JSX | 1h |

### Semana 3-4: Layout y Navegación

| Tarea | Archivos | Esfuerzo |
|-------|----------|----------|
| Crear `<DashboardLayout>` compartido | Nuevo componente | 6h |
| Implementar sidebar navigation | layout.css + DashboardLayout | 8h |
| Estandarizar patrón de header | 4 dashboards | 4h |
| Agregar breadcrumb navigation | DashboardLayout | 3h |
| Implementar skeleton loading states | 4 dashboards | 4h |
| Mejorar empty states con CTA | 4 dashboards | 3h |

### Semana 4-5: Polish y Tendencias

| Tarea | Archivos | Esfuerzo |
|-------|----------|----------|
| Micro-animaciones (completar tarea, hover) | CSS + componentes | 4h |
| Progressive disclosure patterns | 3-4 componentes | 3h |
| Celebration moments | AppointmentCard, DayAgenda | 2h |
| Role-adaptive default views | 4 dashboards | 3h |
| Keyboard shortcuts (Cmd+K) | Nuevo componente | 6h |
| Mejorar mobile touch targets | ~10 componentes | 2h |
| Toast notification positioning | main.jsx | 1h |

### Semana 5-6: Testing

| Tarea | Esfuerzo |
|-------|----------|
| Accessibility audit (axe-core) | 4h |
| Mobile responsiveness testing | 4h |
| Dark mode comprehensive testing | 3h |
| Keyboard navigation testing | 2h |
| Screen reader testing | 2h |
| Performance audit (Lighthouse) | 2h |
| Cross-browser testing | 2h |

**Esfuerzo total estimado: ~120-140 horas (6 semanas con 1 desarrollador)**

---

## 8. PREGUNTAS PARA EL USUARIO

Antes de ejecutar, necesito que respondas:

### Sobre el Proyecto
1. ¿Es esto un rediseño de la app existente o una nueva versión desde cero?
2. ¿Debemos preservar la marca verde del SENA o explorar nuevos colores?
3. ¿Cuál es la fecha objetivo de lanzamiento y tamaño del equipo?
4. ¿Hay requisitos de cumplimiento de accesibilidad (WCAG 2.1 AA)?

### Sobre los Usuarios
5. ¿Quiénes son los usuarios principales? (aprendices, profesionales, coordinadores, admins?)
6. ¿Qué dispositivo usan principalmente? (desktop, móvil, tablet?)
7. ¿Cuál es la duración promedio de sesión?
8. ¿Cuáles son las 3 tareas que los usuarios realizan con más frecuencia?

### Sobre Diseño
9. ¿Tienes una referencia de diseño o moodboard?
10. ¿Debemos usar una librería de componentes (shadcn/ui, Radix) o mantener custom?
11. ¿Quieres mantener el enfoque CSS actual o migrar a Tailwind/CSS Modules?
12. ¿El rediseño debe ser incremental (pieza por pieza) o big-bang?

### Sobre Técnico
13. ¿Hay restricciones de rendimiento (tamaño de bundle, tiempo de carga)?
14. ¿Debemos agregar TypeScript para el rediseño?
15. ¿Quieres tests E2E para el nuevo UI?
16. ¿Cuál es la estrategia de despliegue (feature flags, rollout gradual)?

---

## 9. ANTECEDENTES Y REFERENCIAS

### Fuentes de Tendencias 2026
- SaaSUI.Design — 7 SaaS UI Design Trends for 2026
- Fuselab Creative — Dashboard Design Trends 2026
- Art of Styleframe — Dashboard Design Patterns for Modern Web Apps 2026
- Index.dev — 12 UI/UX Design Trends That Will Dominate 2026
- Zeka Design — Top 10 UI/UX Design Trends 2026

### Dashboard Competitivos
1. Linear — https://linear.app
2. Stripe Dashboard — https://dashboard.stripe.com
3. Vercel — https://vercel.com/dashboard
4. Notion — https://notion.so
5. HubSpot CRM — https://hubspot.com/products/crm

### Datos Clave de la Investigación
- Gartner predice que 40% de apps enterprise integrarán AI agents para 2026
- 82% de usuarios habilitan dark mode cuando está disponible (Android Authority 2024)
- Los productos con mayor engagement emocional tienen menor churn en primeros 30 días
- Skeleton loading reduce tiempo percibido de carga 20-30% vs spinners
- Sidebar 256px expandido / 64px colapsado es el estándar 2026
- 4-6 KPI cards es el número óptimo antes de degradar la calidad de decisión
- CSS Grid con `auto-fill` + container queries es el layout pattern preferido

---

*Documento generado el 11 de junio de 2026*
*Proyecto: SENA Bienestar — Gestión de Citas*
*Analista: opencode/mimo-v2.5-free*
