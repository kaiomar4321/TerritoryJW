# ARCHITECTURE.md

> Documento maestro de referencia. Para detalle específico en cada tema, ver documentación en `docs/`.
> Actualizar este archivo al introducir cambios estructurales significativos.

---

## Quick context for AI assistants

- **App**: Gestión de territorios, grupos y usuarios para visitas organizadas
- **Framework**: Expo (managed workflow) + TypeScript
- **Estilos**: NativeWind (Tailwind CSS para React Native)
- **Base de datos / Auth**: Firebase (Firestore + Authentication)
- **Routing**: Expo Router (file-based, carpeta `app/`)
- **Estructura de rutas**: dos grupos — `(auth)` para sesiones y `(tabs)` para la app principal
- **Tema (UI)**: NativeWind + ThemeContext (`src/context/ThemeContext.tsx`) — light/dark/system
- **Lógica de negocio**: encapsulada en `src/hooks/` y `src/services/`
- **No usar**: `fetch` directo en componentes, lógica de negocio dentro de pantallas, estilos inline salvo casos triviales

---

## 📚 Documentación Detallada

La arquitectura está documentada en detalle en archivos separados para fácil referencia:

| Tema | Documento | Descripción |
|---|---|---|
| **Autenticación** | [docs/auth-flow.md](docs/auth-flow.md) | Sesión, roles, rutas, ciclo de vida de autenticación |
| **Base de datos** | [docs/firestore-schema.md](docs/firestore-schema.md) | Colecciones, relaciones, esquema de datos |
| **Hooks** | [docs/hooks.md](docs/hooks.md) | Catálogo de todos los hooks y cuándo usarlos |
| **Patrones** | [docs/patterns.md](docs/patterns.md) | Patrones de código, convenciones, mejores prácticas |
| **Offline/Sync** | [docs/offline-sync.md](docs/offline-sync.md) | Estrategia de caché, sincronización, persistencia |
| **Mapas** | [docs/map-territories.md](docs/map-territories.md) | Lógica geográfica, polígonos, renderizado |
| **Componentes** | [docs/components.md](docs/components.md) | Catálogo de componentes reutilizables |
| **Permisos** | [docs/permissions.md](docs/permissions.md) | Roles, Firestore rules, validación de acceso |
| **Extender** | [docs/extending-collections.md](docs/extending-collections.md) | Guía paso a paso para agregar nueva colección |
| **Dev/Prod** | [docs/development-deployment.md](docs/development-deployment.md) | Setup local, testing, debugging, deployment a producción |

---

## Estructura de Directorios

```
.
├── app/                        # Rutas de la app (Expo Router, file-based)
│   ├── (auth)/                 # Rutas públicas: login, registro, recuperar contraseña
│   └── (tabs)/                 # Rutas protegidas con tab navigator
│       └── admin/              # Sección de administración
│
├── components/                 # Componentes UI reutilizables, sin lógica de negocio
│   ├── Admin/                  # Componentes exclusivos de la sección admin
│   ├── Buttons/                # Botones reutilizables
│   ├── Map/                    # Componentes de mapa y visualización
│   └── TerritoryDetails/       # Componentes de detalle de territorio
│
├── docs/                       # 📚 Documentación detallada por tema
│   ├── auth-flow.md            # Autenticación y roles
│   ├── firestore-schema.md     # Esquema de base de datos
│   ├── hooks.md                # Catálogo de hooks
│   ├── patterns.md             # Patrones de código
│   ├── offline-sync.md         # Cache y sincronización
│   ├── map-territories.md      # Lógica geográfica
│   ├── components.md           # Catálogo de componentes
│   ├── permissions.md          # Roles y reglas Firestore
│   ├── extending-collections.md # Guía para agregar colecciones
│   └── development-deployment.md # Dev local, testing, producción
│
└── src/                        # Lógica de la aplicación
    ├── config/                 # Configuración de Firebase
    ├── context/                # Context API (ThemeContext, etc.)
    ├── hooks/                  # Custom hooks: lógica reutilizable
    ├── services/               # Llamadas a Firebase/Firestore
    ├── types/                  # Tipos e interfaces TypeScript
    └── utils/                  # Funciones puras auxiliares
```

---

## Capas de la Arquitectura

| Capa | Responsabilidad | Ubicación |
|---|---|---|
| **Routing** | Definir rutas y navegación | `app/` |
| **UI** | Renderizar componentes, recibir props, emitir eventos | `components/` |
| **Lógica** | Orquestar servicios, estado local/global | `src/hooks/` |
| **Datos** | Comunicarse con Firebase, sin estado propio | `src/services/` |
| **Tipos** | Interfaces y tipos compartidos | `src/types/` |
| **Contexto** | Estado compartido (tema, preferencias) | `src/context/` |
| **Utilidades** | Funciones puras sin efectos secundarios | `src/utils/` |

---

## Flujo de Datos

```
Pantalla (app/) 
  → Hook (src/hooks/)
      → Service (src/services/)
          → Firebase
```

**Regla de oro:** Los componentes reciben datos únicamente por props o leyendo un context. Nunca llaman a servicios directamente.

---

## Convenciones Clave

### Nombrado
- **Componentes**: `PascalCase` → `TerritoryCard.tsx`
- **Hooks**: `camelCase` + `use` → `useTerritory.ts`
- **Servicios**: `camelCase` + `Service` → `territoryService.ts`
- **Tipos**: `PascalCase` → `Territory.ts`
- **Utilidades**: `camelCase` → `formatDate.ts`

### Estilos
- ✅ Usar clases de Tailwind directamente en `className`
- ❌ No mezclar `StyleSheet.create` con NativeWind

### TypeScript
- ✅ Siempre tipar con `interface` o `type`
- ❌ Nunca usar `any`; preferir `unknown` con narrowing

---

## Stack Tecnológico

- **Framework:** Expo (managed workflow)
- **Lenguaje:** TypeScript
- **Estilos:** NativeWind (Tailwind CSS para React Native)
- **Routing:** Expo Router (file-based)
- **Base de datos:** Firebase (Firestore + Authentication)
- **Estado:** Hooks + Context API
- **Cache:** AsyncStorage + SWR
- **Offline:** Sincronización local con Firestore

---

## 🚀 Primeros Pasos

### Setup Rápido

```bash
# 1. Clonar repositorio
git clone <repo>
cd TerritoryJW

# 2. Instalar dependencias
npm install

# 3. Configurar variables de ambiente
cp .env.example .env
# Llenar credenciales Firebase en .env

# 4. Iniciar desarrollo
npm start
```

### Scripts Disponibles

| Script | Propósito |
|---|---|
| `npm start` | Inicia Metro bundler (Expo) |
| `npm test` | Ejecuta Jest tests |
| `npm run lint` | Verifica estilo de código (ESLint) |
| `npm run type-check` | Verifica tipos TypeScript |

### Archivos de Configuración Clave

- **app.json** — Configuración de Expo (permisos, versión, nombre, etc.)
- **firestore.rules** — Reglas de seguridad de Firestore
- **eas.json** — Configuración de builds y deployment
- **.env.example** — Plantilla de variables de ambiente (copiar a `.env`)
- **tsconfig.json** — Configuración de TypeScript
- **.eslintrc.js** — Reglas de linting

### Verificar Setup

```bash
# Ver versión de Node.js (debe ser 18+)
node --version

# Verificar que Expo está OK
npx expo doctor
```

**Para más detalles:** → [docs/development-deployment.md](docs/development-deployment.md)

---

## Cómo Empezar

1. **Para entender autenticación:** → [docs/auth-flow.md](docs/auth-flow.md)
2. **Para ver estructura de datos:** → [docs/firestore-schema.md](docs/firestore-schema.md)
3. **Para desarrollar un nuevo hook:** → [docs/hooks.md](docs/hooks.md)
4. **Para escribir un componente:** → [docs/components.md](docs/components.md)
5. **Para entender patrones:** → [docs/patterns.md](docs/patterns.md)
6. **Para entender offline:** → [docs/offline-sync.md](docs/offline-sync.md)
7. **Para ver permisos:** → [docs/permissions.md](docs/permissions.md)
8. **Para trabajar con mapas:** → [docs/map-territories.md](docs/map-territories.md)
9. **Para agregar una colección nueva:** → [docs/extending-collections.md](docs/extending-collections.md)
10. **Para desarrollo/testing/producción:** → [docs/development-deployment.md](docs/development-deployment.md)
