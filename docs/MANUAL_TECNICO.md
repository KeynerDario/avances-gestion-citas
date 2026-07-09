# Manual Técnico — Sistema de Gestión de Citas de Bienestar SENA

## Índice

1. [Arquitectura del Sistema](#1-arquitectura-del-sistema)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Estructura del Proyecto](#3-estructura-del-proyecto)
4. [Configuración del Entorno](#4-configuración-del-entorno)
5. [Base de Datos (Supabase)](#5-base-de-datos-supabase)
6. [Autenticación y Autorización](#6-autenticación-y-autorización)
7. [Patrón Repository](#7-patrón-repository)
8. [Optimización de Rendimiento](#8-optimización-de-rendimiento)
9. [Testing](#9-testing)
10. [Despliegue](#10-despliegue)
11. [Guía de Desarrollo](#11-guía-de-desarrollo)
12. [Solución de Problemas Comunes](#12-solución-de-problemas-comunes)

---

## 1. Arquitectura del Sistema

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND (React)                  │
├─────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │  Login   │  │ Register │  │  Forgot  │          │
│  │  Page    │  │  Page    │  │ Password │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│                                                     │
│  ┌──────────────────────────────────────────┐      │
│  │         DashboardLayout (Sidebar)         │      │
│  ├──────────────────────────────────────────┤      │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐   │      │
│  │  │Aprendiz │ │  Prof.  │ │ Coord.  │   │      │
│  │  │Dashboard│ │Dashboard│ │Dashboard│   │      │
│  │  └─────────┘ └─────────┘ └─────────┘   │      │
│  │  ┌─────────────────────────────────┐    │      │
│  │  │      Admin Dashboard            │    │      │
│  │  └─────────────────────────────────┘    │      │
│  └──────────────────────────────────────────┘      │
│                                                     │
│  ┌──────────────────────────────────────────┐      │
│  │              Providers                    │      │
│  │  AuthProvider │ ThemeProvider │ ErrorB.  │      │
│  └──────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                  BACKEND (Supabase)                  │
├─────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │   Auth   │  │   DB     │  │ Realtime │          │
│  │  (GoTrue)│  │ (Postgres│  │(WebSocket│          │
│  └──────────┘  └──────────┘  └──────────┘          │
└─────────────────────────────────────────────────────┘
```

### Flujo de Datos

1. **Autenticación:** El usuario se autentica via Supabase Auth
2. **Perfil:** Se carga el perfil del usuario con rol y dependencia
3. **Rutas:** React Router redirige según el rol del usuario
4. **Datos:** Los Repository consultan Supabase directamente
5. **Realtime:** Las citas se actualizan en tiempo real via WebSocket

---

## 2. Stack Tecnológico

| Capa | Tecnología | Versión |
|------|------------|---------|
| Framework | React | 19.2.4 |
| Build Tool | Vite | 8.0.4 |
| Routing | React Router DOM | 7.14.0 |
| Forms | React Hook Form + Zod | 7.72.1 + 4.3.6 |
| UI Icons | Lucide React | 1.8.0 |
| Charts | Recharts | 3.8.1 |
| Toast | Sonner | 2.0.7 |
| Backend | Supabase | 2.103.0 |
| Testing | Vitest + Testing Library | 4.1.8 + 16.3.2 |
| Linting | ESLint | 9.39.4 |

---

## 3. Estructura del Proyecto

```
src/
├── features/                    # Módulos de negocio
│   ├── admin/                   # Administración del sistema
│   │   ├── api/                 # AdminRepository
│   │   ├── components/          # UserManagement, AuditLogViewer, etc.
│   │   ├── hooks/               # useAdmin
│   │   └── pages/               # AdminDashboard
│   ├── appointments/            # Gestión de citas
│   │   ├── api/                 # AppointmentRepository, ProfessionalRepository
│   │   ├── components/          # AppointmentCard, AppointmentForm, DayAgenda, etc.
│   │   ├── hooks/               # useAppointments, useProfessional
│   │   ├── pages/               # AprendizDashboard, ProfessionalDashboard
│   │   └── validations/         # appointment.schema.js (Zod)
│   ├── auth/                    # Autenticación
│   │   └── pages/               # Login, Register, ForgotPassword, UpdatePassword
│   └── dashboard/               # Métricas para coordinación
│       ├── api/                 # DashboardRepository, useDashboard
│       ├── components/          # KPICard, DependencyChart, etc.
│       └── pages/               # CoordinationDashboard
├── shared/                      # Componentes compartidos
│   ├── api/                     # audit.js
│   ├── components/              # DashboardLayout, Modal, ConfirmModal, etc.
│   ├── hooks/                   # useToast
│   ├── styles/                  # CSS (variables, global, auth, layout, etc.)
│   └── utils/                   # useTabKeyboardNav
├── providers/                   # Context Providers
│   ├── AuthContext.js           # Context de autenticación
│   ├── AuthProvider.jsx         # Provider de autenticación
│   ├── ThemeContext.js           # Context de tema
│   └── ThemeProvider.jsx         # Provider de tema
├── routes/                      # Configuración de rutas
│   ├── AppRoutes.jsx            # Definición de rutas
│   └── ProtectedRoute.jsx       # Ruta protegida por rol
├── lib/                         # Configuración
│   └── supabase.js              # Cliente Supabase + request queue
└── test/                        # Configuración de tests
    ├── mocks/                   # Mocks de Supabase
    └── setup.js                 # Setup de Testing Library
```

---

## 4. Configuración del Entorno

### Variables de Entorno

Crear archivo `.env.local`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon
```

### Instalación

```bash
# Instalar dependencias
npm install

# Instalar Playwright (para tests E2E)
npx playwright install chromium

# Iniciar servidor de desarrollo
npm run dev

# Ejecutar tests
npm run test:run

# Build de producción
npm run build
```

---

## 5. Base de Datos (Supabase)

### Tablas Principales

| Tabla | Descripción |
|-------|-------------|
| `profiles` | Perfiles de usuario (extendida de auth.users) |
| `roles` | Roles del sistema (APRENDIZ, PROFESIONAL, COORDINACION, SUPERADMIN) |
| `dependencies` | Dependencias/instituciones |
| `appointments` | Citas de bienestar |
| `professional_schedules` | Horarios de profesionales |
| `clinical_notes` | Notas clínicas de citas |
| `audit_logs` | Registro de auditoría |
| `system_config` | Configuración del sistema |

### Relaciones

```
profiles ──┬── roles (role_id)
           └── dependencies (dependency_id)

appointments ──┬── profiles as user (user_id)
               ├── profiles as professional (professional_id)
               └── dependencies (dependency_id)

professional_schedules ── profiles (professional_id)
clinical_notes ──┬── appointments (appointment_id)
                 └── profiles (professional_id)
```

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado. Las políticas permiten:
- **Lectura:** Los usuarios ven solo datos de su dependencia (o todos si es admin)
- **Escritura:** Los profesionales solo modifican sus propias citas
- **Auditoría:** Solo los admins ven los logs completos

---

## 6. Autenticación y Autorización

### Flujo de Autenticación

```
Usuario → Login → Supabase Auth → Token JWT → Profile Load → Route Guard
```

### roles y Permisos

```javascript
// Provider expone funciones de verificación
const { isAdmin, isCoordination, isProfessional, isAprendiz } = useAuth();

// ProtectedRoute valida el rol antes de renderizar
<ProtectedRoute requiredRoles="APRENDIZ">
  <AprendizDashboard />
</ProtectedRoute>
```

### Protección de Rutas

| Ruta | Roles Permitidos |
|------|------------------|
| `/dashboard` | APRENDIZ |
| `/professional` | PROFESIONAL |
| `/coordination` | COORDINACION, SUPERADMIN |
| `/admin` | SUPERADMIN |

---

## 7. Patrón Repository

Cada módulo usa el patrón Repository para aislar las consultas a Supabase:

```javascript
// appointments.repository.js
export class AppointmentRepository {
  static async fetch(filters) {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("user_id", filters.userId);
    // ...
  }

  static async enrichAppointmentsBatch(appointments) {
    // Batch enrichment para evitar N+1
    const [deps, profiles, profs] = await Promise.all([...]);
    // ...
  }
}
```

### Repositorios

| Repository | Responsabilidad |
|------------|-----------------|
| `AppointmentRepository` | CRUD de citas, enrich batch |
| `ProfessionalRepository` | Horarios, notas clínicas, agenda |
| `AdminRepository` | Usuarios, dependencias, auditoría |
| `DashboardRepository` | KPIs, métricas, reportes |

---

## 8. Optimización de Rendimiento

### Request Queue (`src/lib/supabase.js`)

Para evitar `ERR_INSUFFICIENT_RESOURCES` (límite de ~6 conexiones por dominio):

```javascript
const MAX_CONCURRENT = 5;
let active = 0;
const pending = [];

export function enqueue(fn) {
  return new Promise((resolve, reject) => {
    const run = () => {
      active++;
      fn().then(resolve).catch(reject).finally(() => {
        active--;
        if (pending.length > 0) pending.shift()();
      });
    };
    active < MAX_CONCURRENT ? run() : pending.push(run);
  });
}
```

**Uso:** Solo se aplica `enqueue` en batch enrichment (3+ queries paralelas), no en queries simples.

### Batch Enrichment

Antes (N+1 problem):
```javascript
// 3 queries POR CITA → 3N queries total
for (const apt of appointments) {
  await fetchDependency(apt.dependency_id);
  await fetchProfile(apt.user_id);
  await fetchProfessional(apt.professional_id);
}
```

Después (batch):
```javascript
// 3 queries TOTAL, sin importar N
const depIds = [...new Set(appointments.map(a => a.dependency_id))];
const deps = await supabase.from("dependencies").select("*").in("id", depIds);
```

### Lazy Loading de Rutas

```javascript
const Login = lazy(() => import("../features/auth/pages/Login"));
const AdminDashboard = lazy(() => import("../features/admin/pages/AdminDashboard"));
```

### Debounce en Realtime

```javascript
// Evita re-fetches rápidos en ráfagas de eventos
useEffect(() => {
  let timer = null;
  const channel = supabase.channel("appointments-realtime")
    .on("postgres_changes", { event: "*", table: "appointments" }, () => {
      clearTimeout(timer);
      timer = setTimeout(() => fetchRef.current(), 1000); // 1s debounce
    })
    .subscribe();
  return () => { clearTimeout(timer); supabase.removeChannel(channel); };
}, []);
```

---

## 9. Testing

### Comandos

```bash
npm run test          # Vitest en modo watch
npm run test:run      # Ejecutar todos los tests
npm run test:coverage # Con cobertura de código
```

### Estructura de Tests

```
__tests__/
├── ComponentName.test.jsx    # Tests de componentes
├── useHook.test.jsx          # Tests de hooks
└── repository.test.js        # Tests de repositories
```

### Convenciones

```javascript
describe("ComponentName", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should [comportamiento esperado]", () => {
    // Arrange - Act - Assert
  });
});
```

### Cobertura Actual

| Módulo | Tests | Estado |
|--------|-------|--------|
| appointments | 40 | ✓ |
| admin | 8 | ✓ |
| dashboard | 11 | ✓ |
| shared | 31 | ✓ |
| providers | 5 | ✓ |
| utils | 7 | ✓ |
| auth | 6 | ✓ |
| **Total** | **108** | **✓** |

---

## 10. Despliegue

### Build de Producción

```bash
npm run build
# Genera dist/ con archivos optimizados
```

### Estructura de Build

```
dist/
├── index.html
└── assets/
    ├── index-[hash].js         # Bundle principal (~187KB gzipped ~59KB)
    ├── supabase-[hash].js      # Supabase client (~223KB gzipped ~58KB)
    ├── [feature]-[hash].js     # Chunks por feature (lazy loaded)
    └── index-[hash].css        # Estilos (~133KB gzipped ~20KB)
```

### Deploy

El proyecto está configurado para Vite. Opciones de deploy:

1. **Vercel/Netlify:** Detecta automáticamente Vite
2. **Static hosting:** Subir carpeta `dist/`
3. **Docker:** Servir con nginx

---

## 11. Guía de Desarrollo

### Agregar una Nueva Feature

1. Crear carpeta en `src/features/[nombre]/`
2. Implementar:
   - `api/[nombre].repository.js` — Consultas a Supabase
   - `components/` — Componentes React
   - `hooks/use[Nombre].js` — Custom hooks
   - `pages/[Nombre]Page.jsx` — Página principal
3. Agregar ruta en `AppRoutes.jsx`
4. Agregar protección en `ProtectedRoute.jsx`
5. Crear tests en `__tests__/`

### Agregar un Nuevo Componente Compartido

1. Crear en `src/shared/components/`
2. Exportar desde el archivo
3. Importar donde se necesite

### Estilos

- Usar CSS variables definidas en `variables.css`
- Seguir la nomenclatura BEM o similar
- Los componentes usan clases CSS, no CSS-in-JS

### Commits

```
feat(módulo): descripción corta
fix(módulo): descripción corta
docs: actualizar documentación
test(módulo): agregar tests para X
refactor(módulo): mejorar Y
```

---

## 12. Solución de Problemas Comunes

### `ERR_INSUFFICIENT_RESOURCES`

**Causa:** Demasiadas conexiones simultáneas a Supabase.

**Solución:** El `enqueue()` en `src/lib/supabase.js` limita a 5 conexiones concurrentes. Si el problema persiste, reducir `MAX_CONCURRENT`.

### `Lock was not released within 5000ms`

**Causa:** React Strict Mode ejecuta efectos dos veces en desarrollo.

**Solución:** Es un warning normal en desarrollo. No afecta producción.

### Tests fallan con `act(...)` warning

**Causa:** Actualizaciones de estado asíncronas envueltas en tests.

**Solución:** Envolver interacciones en `act()` o usar `waitFor()`.

### Estilos no se aplican

**Causa:** CSS no importado o especificidad incorrecta.

**Solución:** Verificar que `global.css` se importa en `main.jsx`. Usar CSS variables en vez de valores hardcodeados.

---

*Documento generado automáticamente — Última actualización: Julio 2026*
