# ARCHITECTURE.md

> Documento de referencia para ingenieros y asistentes de IA.
> Describe el propósito del proyecto, su estructura, patrones y convenciones.
> Actualizar este archivo al introducir cambios estructurales significativos.

---

## Quick context for AI assistants

- **App**: Gestión de territorios, grupos y usuarios para visitas organizadas
- **Framework**: Expo (managed workflow) + TypeScript
- **Estilos**: NativeWind (Tailwind CSS para React Native)
- **Base de datos / Auth**: Firebase (Firestore + Authentication)
- **Routing**: Expo Router (file-based, carpeta `app/`)
- **Estructura de rutas**: dos grupos — `(auth)` para sesiones y `(tabs)` para la app principal
- **Estado global**: Context API (`src/context/`)
- **Lógica de negocio**: encapsulada en `src/hooks/` y `src/services/`
- **No usar**: `fetch` directo en componentes, lógica de negocio dentro de pantallas, estilos inline salvo casos triviales

---

## 1. ¿Qué es este proyecto?

Aplicación móvil de gestión de territorios para organizaciones que realizan visitas ordenadas por zonas geográficas. Permite administrar territorios, asignarlos a grupos de usuarios, registrar visitas y llevar un historial de actividad por zona.

**Usuarios principales:**
- **Administradores**: gestionan territorios, grupos y usuarios
- **Visitantes**: consultan territorios asignados y registran visitas

**Stack:**
- Expo (managed) · TypeScript · NativeWind · Firebase · Expo Router

---

## 2. Estructura de directorios

```
.
├── app/                        # Rutas de la app (Expo Router, file-based)
│   ├── (auth)/                 # Rutas públicas: login, registro, recuperar contraseña
│   └── (tabs)/                 # Rutas protegidas con tab navigator
│       └── admin/              # Sección de administración
│           └── group/          # Gestión de grupos dentro de admin
│
├── assets/                     # Imágenes, íconos y fuentes estáticas
│
├── components/                 # Componentes UI reutilizables, sin lógica de negocio
│   ├── Admin/                  # Componentes exclusivos de la sección admin
│   ├── Buttons/                # Botones reutilizables (primario, secundario, icono, etc.)
│   ├── Map/                    # Componentes de mapa y visualización de territorios
│   └── TerritoryDetails/       # Componentes de detalle de un territorio individual
│
└── src/                        # Lógica de la aplicación
    ├── config/                 # Configuración de Firebase, constantes globales y env
    ├── context/                # Context API: estado global compartido entre pantallas
    ├── hooks/                  # Custom hooks: lógica reutilizable con estado local o global
    ├── services/               # Llamadas a Firebase/Firestore, sin estado propio
    ├── types/                  # Tipos e interfaces TypeScript compartidos
    └── utils/                  # Funciones puras auxiliares (formateo, validaciones, etc.)
```

---

## 3. Responsabilidades por capa

| Capa | Responsabilidad | No debe |
|---|---|---|
| `app/` | Definir rutas y layout de navegación | Contener lógica de negocio ni llamadas a Firebase |
| `components/` | Renderizar UI, recibir props, emitir eventos | Llamar a servicios directamente ni manejar estado global |
| `src/services/` | Comunicarse con Firebase (leer/escribir) | Tener estado, hooks o lógica de UI |
| `src/hooks/` | Orquestar servicios + estado local/global | Renderizar JSX |
| `src/context/` | Compartir estado global entre pantallas | Contener lógica de negocio compleja |
| `src/types/` | Definir interfaces y tipos compartidos | Importar desde `components/` |
| `src/utils/` | Funciones puras sin efectos secundarios | Llamar a servicios ni usar hooks |

---

## 4. Convenciones y patrones

### Nombrado de archivos
- **Componentes**: `PascalCase` → `TerritoryCard.tsx`
- **Hooks**: `camelCase` con prefijo `use` → `useTerritories.ts`
- **Servicios**: `camelCase` con sufijo `Service` → `territoryService.ts`
- **Tipos**: `PascalCase` con sufijo según corresponda → `Territory.ts`, `UserRole.ts`
- **Utilidades**: `camelCase` descriptivo → `formatDate.ts`

### TypeScript
- Siempre tipar props de componentes con una `interface` o `type` explícito
- Nunca usar `any`; preferir `unknown` con narrowing cuando el tipo es incierto
- Los tipos compartidos viven en `src/types/`, los locales pueden vivir en el mismo archivo

### Estilos (NativeWind)
- Usar clases de Tailwind directamente en `className`
- No mezclar `StyleSheet.create` con NativeWind en el mismo componente
- Para estilos condicionales usar la utilidad `cn()` o template literals

### Firebase
- Toda interacción con Firestore pasa por `src/services/`
- Las pantallas y componentes nunca importan `firebase` directamente
- La configuración de Firebase vive en `src/config/`

### Estado global
- El estado global se gestiona con Context API en `src/context/`
- Para estado local de una pantalla, usar `useState` / `useReducer` dentro de un hook
- Si un estado se necesita en más de dos pantallas, moverlo a un context

---

## 5. Flujo de datos

```
Pantalla (app/)
  └── llama a → Hook (src/hooks/)
                  ├── lee/escribe en → Service (src/services/) → Firebase
                  └── lee/actualiza → Context (src/context/)
```

Los componentes reciben datos únicamente por props o leyendo un context. Nunca llaman a servicios directamente.

---

## 6. Cómo extender el proyecto

### Agregar una nueva pantalla
1. Crear el archivo en `app/(tabs)/mi-pantalla.tsx` (o dentro del grupo correspondiente)
2. Expo Router la registra automáticamente como ruta
3. Si necesita datos, crear un hook en `src/hooks/useMiPantalla.ts`
4. Si el hook necesita Firebase, agregar la función en el service correspondiente de `src/services/`

### Agregar un nuevo componente
1. Crear `components/MiCarpeta/MiComponente.tsx`
2. Definir sus props con una `interface` en la parte superior del archivo
3. El componente no importa servicios ni Firebase directamente

### Agregar un nuevo tipo de dato
1. Crear o editar el archivo correspondiente en `src/types/`
2. Exportar el tipo e importarlo donde se necesite

### Agregar una nueva colección en Firestore
1. Definir el tipo en `src/types/`
2. Crear `src/services/miColeccionService.ts` con las operaciones CRUD
3. Crear `src/hooks/useMiColeccion.ts` que consuma el service
4. Si el dato es global, agregar al context correspondiente en `src/context/`

---

## 7. Decisiones de arquitectura

### ADR-01: Expo managed workflow
**Contexto:** Proyecto enfocado en funcionalidad, sin necesidad de módulos nativos personalizados por ahora.
**Decisión:** Expo managed para reducir fricción de configuración y mantener actualizaciones simples.
**Consecuencia:** Si en el futuro se necesita código nativo custom, se requiere `expo prebuild` para migrar a bare workflow.

### ADR-02: Firebase como backend
**Contexto:** Necesidad de autenticación, base de datos en tiempo real y hosting sin servidor propio.
**Decisión:** Firebase (Auth + Firestore) por su integración con Expo y rapidez de prototipado.
**Consecuencia:** Acoplamiento al ecosistema de Google; toda la lógica de datos debe pasar por `src/services/` para facilitar una eventual migración.

### ADR-03: Context API sobre Zustand/Redux
**Contexto:** App de complejidad media con pocos estados verdaderamente globales.
**Decisión:** Context API nativa para evitar dependencias adicionales de estado.
**Consecuencia:** Si el estado global crece significativamente en complejidad, evaluar migración a Zustand.

### ADR-04: NativeWind para estilos
**Contexto:** Necesidad de consistencia visual y velocidad de desarrollo.
**Decisión:** NativeWind (Tailwind en RN) para mantener un sistema de diseño coherente con clases utilitarias.
**Consecuencia:** Requiere familiaridad con Tailwind; no mezclar con `StyleSheet.create`.

### ADR-05: Expo Router (file-based routing)
**Contexto:** Preferencia por estructura de rutas declarativa y mantenible.
**Decisión:** Expo Router en lugar de React Navigation manual, aprovechando la estructura de carpetas como definición de rutas.
**Consecuencia:** La navegación es más predecible pero requiere respetar las convenciones de nombres de archivo de Expo Router.

---

## 8. Dependencias clave

| Librería | Rol | Notas |
|---|---|---|
| `expo` | Framework base | Managed workflow, gestiona el build |
| `expo-router` | Navegación file-based | Las rutas se definen por la estructura de `app/` |
| `firebase` | Auth + Firestore | Solo usar desde `src/services/` y `src/config/` |
| `nativewind` | Sistema de estilos | Tailwind CSS para React Native |
| `typescript` | Tipado estático | Nunca usar `any` |

---

## 9. Patrón Offline-First

La app está diseñada para funcionar sin conexión a internet. Los usuarios pueden seguir interactuando con territorios, editar datos, y todo se sincroniza cuando vuelve la conexión.

### 9.1 ¿Cómo funciona?

**Flujo:**
```
Usuario offline
  ↓
Intenta obtener datos
  ├→ SWR + AsyncStorage: devuelve cache local si existe
  └→ useOfflineSWR cachea automáticamente todo fetch exitoso
  ↓
Usuario realiza cambios
  ├→ Guardados PRIMERO en local (AsyncStorage)
  ├→ Se actualiza el UI inmediatamente (optimistic update)
  └→ Si hay internet: sync automático a Firestore
  ↓
Vuelve internet
  ├→ useNetworkStatus lo detecta
  ├→ territoryService.syncAll() sube pendientes
  └→ Descargas datos frescos de Firestore
```

### 9.2 Componentes clave

| Componente | Ubicación | Responsabilidad |
|---|---|---|
| `useNetworkStatus` | `src/hooks/` | Monitorea estado de conexión (online/offline/unknown) y detecta transiciones |
| `useOfflineSWR` | `src/hooks/` | Wrapper de SWR que cachea en AsyncStorage con TTL configurable. Fetcher falla → devuelve cache |
| `localDB` | `src/services/` | API simple para CRUD en AsyncStorage. Helpers `getCollection()`, `saveCollection()` |
| `offlineTerritoryService` | `src/services/` | Sincronización de territorios: `loadTerritories()`, `syncWithRemote()`, `subscribeToRemote()` |
| `territoryService` | `src/services/` | Operaciones CRUD con fallback: checkea NetInfo antes de escribir, fallback a local si falla |
| `offlineCache` | `src/utils/` | Helpers para limpiar caches: `clearOfflineCache(key)`, `clearAllOfflineCache()` |
| `useTerritory` | `src/hooks/` | Orquesta todo: consume `useOfflineSWR`, maneja estado de edit/sync, expone métodos del service |

### 9.3 Estrategia de almacenamiento

```
AsyncStorage
  ├─ local_territories        → Array de Territory (actualizado por offlineTerritoryService)
  ├─ firestore:territories    → Cache SWR con timestamp + TTL (24h por defecto)
  ├─ local_houses             → Array de House (bajo demanda por territorio)
  └─ ... otras colecciones
```

**TTL (Time To Live):** Si cache tiene > 24h, se descarta al fallar el fetch → fuerza una nueva solicitud cuando hay internet.

**Persistencia de Auth:** Firebase Auth usa AsyncStorage automáticamente (`getReactNativePersistence`), así el usuario no se desloguea.

### 9.4 Flujo real: `useTerritory` + `territoryService`

1. **Inicialización (primera vez):**
   - `useTerritory` llama a `territoriesFetcher()` dentro de `useOfflineSWR`
   - Si hay internet: trae de Firestore, cachea en AsyncStorage + SWR
   - Si NO hay internet: devuelve cache si existe, sino array vacío

2. **Usuario edita territorio:**
   ```typescript
   await updateTerritory(territoryId, { name: 'Nuevo nombre' })
   // Internamente:
   // 1. Actualiza local: localDB.saveCollection()
   // 2. Mutate SWR para refrescar UI
   // 3. Checkea NetInfo
   // 4. Si online: updateDoc en Firestore (marca synced: true)
   // 5. Si offline: marca synced: false, se syncroniza luego
   ```

3. **Vuelve conexión:**
   - `useNetworkStatus` detecta transición a 'online'
   - Trigger `territoryService.syncAll()`:
     - Sube cambios pendientes (synced: false)
     - Descarga datos frescos de Firestore
     - Actualiza AsyncStorage y SWR

4. **Cambios en tiempo real (Firestore listeners):**
   - `offlineTerritoryService.subscribeToRemote()` establece un listener
   - Cambios remotos actualizan AsyncStorage automáticamente
   - UI se refresca vía SWR

### 9.5 Reglas prácticas

✅ **SÍ hacer:**
- Siempre usar `useOfflineSWR` para datos que se cachen
- Checkear `useNetworkStatus.isOnline` antes de operaciones críticas
- Usar `localDB.getCollection()` como fallback en servicios
- Marcar operaciones con `synced: boolean` en documentos editables

❌ **NO hacer:**
- Llamar a `territoryService` directamente desde componentes (usa el hook)
- Hacer `fetch` directo sin pasar por `useOfflineSWR`
- Confiar en que hay internet sin checkear `NetInfo`
- Guardar datos en AsyncStorage sin usar `localDB`

### 9.6 Checklist: Agregar nueva colección con offline support

Cuando agregues `miColeccion`:

- [ ] Crear tipo en `src/types/MiColeccion.ts`
- [ ] Crear `src/services/miColeccionService.ts` con:
  - `saveItem()` → checkea NetInfo
  - `updateItem()` → actualiza local + sync si online
  - `syncAll()` → sube pendientes, descarga remotos
  - `subscribeToRemote()` → listener en tiempo real (opcional)
- [ ] Crear `src/hooks/useMiColeccion.ts` que:
  - Consume `useOfflineSWR` con un fetcher
  - Expone los métodos del service
  - Maneja estado local (loading, error, etc.)
- [ ] En el service, usar `localDB.getCollection()` para leer local
- [ ] Agregar clave en AsyncStorage (ej: `local_miColeccion`)
- [ ] Documentar TTL y estrategia de sync (bajo demanda vs global)

### 9.7 Consideraciones y mejoras futuras

⚠️ **Puntos abiertos a resolver:**

| Tema | Estado | Notas |
|---|---|---|
| **Resolución de conflictos** | 🔴 No definido | ¿Client-wins o server-wins? ¿Merge automático? ¿Log de cambios? |
| **Sincronización selectiva** | 🟡 Parcial | Territories se syncan globales, houses bajo demanda. ¿Patrón consistente? |
| **Compresión / Límites** | 🔴 No definido | AsyncStorage tiene ~5-10MB límite. ¿Archiving de datos antiguos? |
| **Auditoría de cambios** | 🔴 No definido | ¿Trackear quién cambió qué y cuándo offline? |
| **Versionamiento de datos** | 🟡 Parcial | Si estructura de `Territory` cambia, ¿migrar docs en AsyncStorage? |
| **Cancelación de operaciones** | 🔴 No definido | Si sync tarda mucho, ¿permitir cancelar? |
| **Notificaciones de sync** | 🟡 Parcial | ¿Notificar usuario cuándo termina sync o hay errores? |

---

## 10. Variables de entorno

Las variables sensibles (API keys de Firebase, etc.) se manejan con `app.config.ts` y el sistema de `extra` de Expo, **nunca hardcodeadas en el código fuente**.

Acceder a ellas desde `src/config/` únicamente.

---

*Última actualización: 2026 — mantener este documento sincronizado con cambios estructurales del proyecto.*
