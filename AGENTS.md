# AGENTS.md - Convenciones del Proyecto

## Arquitectura

### Estructura de Carpetas

```
src/
├── features/           # Módulos de negocio
│   ├── [feature]/
│   │   ├── api/        # Repositorios y servicios
│   │   ├── components/ # Componentes específicos del módulo
│   │   ├── hooks/      # Custom hooks
│   │   ├── pages/      # Páginas/rutas
│   │   └── validations/ # Esquemas Zod
├── shared/             # Componentes y utilidades compartidas
│   ├── api/            # APIs globales (audit, etc.)
│   ├── components/     # Componentes reutilizables
│   ├── styles/         # Estilos globales
│   └── utils/          # Funciones auxiliares
├── providers/          # Context providers (Auth, Theme)
├── routes/             # Configuración de rutas
└── lib/                # Configuración de servicios (Supabase)
```

### Convenciones de Nomenclatura

- **Archivos**: `camelCase` para JS, `PascalCase` para componentes JSX
- **Componentes**: `PascalCase` (ej: `AppointmentCard.jsx`)
- **Hooks**: Prefijo `use` (ej: `useAppointments.js`)
- **Repositories**: Sufijo `Repository` (ej: `AppointmentRepository.js`)
- **Contexts**: Sufijo `Context` y `Provider` (ej: `AuthContext.js`, `AuthProvider.jsx`)
- **Tests**: Mismo nombre + `.test.js` (ej: `appointments.repository.test.js`)

## Código

### Estilo

- Usar `const` por defecto, `let` solo cuando sea necesario
- Functions flecha para callbacks y métodos internos
- Functions declarativas para componentes React
- Desestructurar props y state
- Early returns para condiciones de guardia

### React

- Functional components exclusivamente
- Custom hooks para lógica reutilizable
- React.memo solo cuando sea necesario (medir performance)
- Lazy loading para routes (ya implementado)

### Manejo de Estado

- Local state con `useState` para UI
- Context para auth y theme
- Repository pattern para datos (Supabase)

### Errores

- Toast notifications para errores de usuario
- ErrorBoundary para errores de render
- Console.error para debugging (solo desarrollo)

## Testing

### Estructura

```javascript
describe("Componente/Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should [comportamiento esperado]", () => {
    // Arrange - Act - Assert
  });
});
```

### Convenciones

- Nombrar tests con "should" al inicio
- Un test por comportamiento
- Mockear servicios externos (Supabase, APIs)
- Usar `renderHook` para hooks
- Verificar llamadas a mocks con `toHaveBeenCalledWith`

## Base de Datos

### Supabase

- Usar Repository pattern para queries
- Siempre manejar errores con try/catch
- Enrichment de datos en el repository (no en componentes)
- Audit logging para acciones CRUD

### Roles

- `APRENDIZ`: Usuario estándar
- `PROFESIONAL`: Profesional de salud
- `COORDINACION`: Coordinador de dependencia
- `SUPERADMIN`: Administrador del sistema

## Seguridad

- Variables de entorno en `.env.local` (nunca commitear)
- `.env.example` para documentar variables requeridas
- RLS (Row Level Security) habilitado en Supabase
- Validación de permisos en cada ruta protegida

## Git

### Commits

- Formato: `tipo(corto): descripción`
- Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Ejemplo: `feat(appointments): add cancel appointment functionality`

### Ramas

- `main`: Producción
- `develop`: Desarrollo
- `feature/*`: Nuevas funcionalidades
- `fix/*`: Correcciones de bugs

## Performance

- Lazy loading en routes (ya implementado)
- Evitar re-renders innecesarios con `useMemo` y `useCallback`
- Pagination para listados grandes
- Debounce en búsquedas

## Accesibilidad

- Componentes semánticos (button, nav, main)
- `aria-labels` en botones de acción
- Navegación por teclado
- Contraste WCAG AA
