# Catálogo de Hooks

Referencia rápida de todos los hooks personalizados.

---

## Hooks de Autenticación y Usuario

### `useUser()` — Estado y funciones del usuario actual
**Ubicación:** `src/hooks/useUser.ts`

```typescript
const {
  userData,                  // Objeto del usuario actual
  isLoading,                 // Cargando datos?
  error,                     // Error si ocurrió
  registerUser,              // async (email, pwd, name) => void
  loginUser,                 // async (email, pwd) => void
  updateUser,                // async (updates) => void
  resetPassword,             // async (email) => void
  mutate,                    // Actualizar manualmente
  refresh,                   // Revalidar datos
} = useUser();
```

**Usar cuando:** Necesitas datos del usuario actual, registrarse, loginear o actualizar perfil.

**Caché:** ✅ AsyncStorage (persistencia de sesión)

---

### `usePermissions()` — Validación de acceso y roles
**Ubicación:** `src/hooks/usePermissions.ts`

```typescript
const {
  isAdmin,                   // ¿Es admin o superadmin?
  isSuperAdmin,              // ¿Es superadmin?
  hasPermission,             // (action) => boolean
  isLoading,                 // Validando?
} = usePermissions();
```

**Usar cuando:** Necesitas chequear si el usuario tiene cierto nivel de acceso.

**Caché:** ❌ En memoria (se re-valida en cada pantalla)

---

### `useUsers()` — Listar todos los usuarios (admin)
**Ubicación:** `src/hooks/useUsers.ts`

```typescript
const {
  users,                     // Array de usuarios
  isLoading,                 // Cargando?
  error,                     // Error si ocurrió
  updateUser,                // async (userId, updates) => void
  deleteUser,                // async (userId) => void
  changeUserRole,            // async (userId, newRole) => void
  mutate,                    // Actualizar manualmente
} = useUsers();
```

**Usar cuando:** Panel de admin para listar y gestionar usuarios.

**Caché:** ✅ AsyncStorage (sincronización inicial)

---

## Hooks de Territorios

### `useTerritory()` — CRUD de territorios + operaciones batch
**Ubicación:** `src/hooks/useTerritory.ts`

```typescript
const {
  territories,               // Array de territorios
  isLoading,                 // Cargando inicial?
  isFetching,                // Revalidando en background?
  error,                     // Error si ocurrió
  createTerritory,           // async (data) => void
  updateTerritory,           // async (id, updates) => void
  deleteTerritory,           // async (id) => void
  markAllReady,              // async () => void (batch)
  isBatchLoading,            // ¿Operación batch en curso?
  batchError,                // Error de operación batch
  mutate,                    // Actualizar manualmente
  refresh,                   // Revalidar datos
} = useTerritory();
```

**Usar cuando:** Necesitas CRUD de territorios o operaciones en múltiples a la vez.

**Caché:** ✅ localDB (sincronización local + persistencia)

**Características:**
- Optimistic updates (UI se actualiza al instante)
- Sincronización bidireccional con groups
- Soporte para operaciones batch

---

### `useTerritoriesAdmin()` — Territorios desde vista de admin
**Ubicación:** `src/hooks/useTerritoriesAdmin.ts`

```typescript
const {
  territories,               // Array de territorios (vista admin)
  isLoading,                 // Cargando?
  // ... métodos similares a useTerritory()
} = useTerritoriesAdmin();
```

**Usar cuando:** Panel de admin con vista completa de territorios.

---

## Hooks de Grupos

### `useGroup()` — CRUD de grupos + asignaciones
**Ubicación:** `src/hooks/useGroup.ts`

```typescript
const {
  groups,                    // Array de grupos
  isLoading,                 // Cargando?
  error,                     // Error si ocurrió
  createGroup,               // async (data) => void
  updateGroup,               // async (id, updates) => void
  deleteGroup,               // async (id) => void
  assignTerritory,           // async (groupId, territoryId) => void
  unassignTerritory,         // async (groupId, territoryId) => void
  mutate,                    // Actualizar manualmente
  refresh,                   // Revalidar datos
} = useGroup();
```

**Usar cuando:** Gestión de grupos y asignación de territorios.

**Caché:** ✅ localDB (sincronización bidireccional)

**Características:**
- Mantiene sincronización bidireccional con territories
- Validaciones de asignación

---

## Hooks de Casas

### `useHouses()` — CRUD de casas + suscripción en tiempo real
**Ubicación:** `src/hooks/useHouses.ts`

```typescript
const {
  houses,                    // Array de casas del territorio
  isLoading,                 // Cargando?
  error,                     // Error si ocurrió
  addHouse,                  // async (address, reason, coords) => void
  updateHouse,               // async (houseId, updates) => void
  deleteHouse,               // async (houseId) => void
  refresh,                   // Revalidar datos
  mutate,                    // Actualizar manualmente
} = useHouses(territoryId);
```

**Usar cuando:** Necesitas casas de un territorio específico.

**Caché:** ✅ SWR en memoria (suscripción en tiempo real)

**Características:**
- Sincronización en tiempo real con `onSnapshot`
- Datos siempre frescos sin polling

---

## Hooks de Datos Globales

### `useCongregation()` — Listar congregaciones
**Ubicación:** `src/hooks/useCongregation.ts`

```typescript
const {
  congregations,             // Array de congregaciones
  isLoading,                 // Cargando?
  error,                     // Error si ocurrió
  currentCongregation,       // Congregación actual (si aplica)
} = useCongregation();
```

**Usar cuando:** Necesitas listar o seleccionar congregaciones.

**Caché:** ❌ En memoria (SWR simple)

---

### `useNetworkStatus()` — Estado de conectividad
**Ubicación:** `src/hooks/useNetworkStatus.ts`

```typescript
const {
  isConnected,               // ¿Hay conexión a internet?
  networkType,               // 'wifi' | '4g' | '3g' | 'unknown'
  isConnecting,              // Conectando en este momento?
} = useNetworkStatus();
```

**Usar cuando:** Necesitas mostrar banner de offline o adaptar comportamiento.

**Caché:** ❌ En memoria (listener de estado del dispositivo)

---

### `useLocation()` — Ubicación GPS del usuario
**Ubicación:** `src/hooks/useLocation.ts`

```typescript
const {
  location,                  // {latitude, longitude, accuracy}
  isLoading,                 // Obteniendo ubicación?
  error,                     // Error si ocurrió
  requestLocationPermission, // async () => boolean
} = useLocation();
```

**Usar cuando:** Necesitas ubicación GPS (para mapa, crear territorios, etc.)

**Características:**
- Solicita permisos al usuario
- Actualización continua de posición

---

## Hooks de Interfaz

### `useForm()` — Gestión simplificada de formularios
**Ubicación:** `src/hooks/useForm.ts`

```typescript
const form = useForm(
  {
    name: '',                // Valores iniciales
    email: '',
  },
  async (values) => {        // Callback onSubmit
    // validar y enviar
  }
);

const {
  values,                    // Valores actuales del form
  errors,                    // Errores de validación
  touched,                   // Campos que fueron tocados
  isSubmitting,              // Enviando?
  handleChange,              // (fieldName) => (value) => void
  handleBlur,                // (fieldName) => () => void
  handleSubmit,              // () => void
  resetForm,                 // () => void
} = form;
```

**Usar cuando:** Necesitas un formulario con validación y manejo de errores.

---

### `useFilterSort()` — Filtrado y ordenamiento de datos
**Ubicación:** `src/hooks/useFilterSort.ts`

```typescript
const {
  filteredData,              // Datos después de filtros/sort
  filters,                   // Objeto con filtros activos
  setFilters,                // Actualizar filtros
  sort,                      // Orden actual
  setSort,                   // Actualizar orden
  resetFilters,              // Limpiar todos
} = useFilterSort(data, filterConfig);
```

**Usar cuando:** Necesitas aplicar filtros y ordenamiento a una lista.

---

## Patrón `useOfflineSWR()` — Cache offline + sincronización

**Ubicación:** `src/hooks/useOfflineSWR.ts`

```typescript
const {
  data,                      // Datos del cache o Firestore
  isLoading,                 // Cargando inicial?
  isFetching,                // Revalidando en background?
  error,                     // Error si ocurrió
  mutate,                    // Actualizar manualmente
} = useOfflineSWR<T>(
  key,                       // Clave única (string)
  fetcher,                   // async () => T
  { ttl: 1000 * 60 * 60 * 24 }  // Opciones (ttl en ms)
);
```

**Características:**
- ✅ Cache offline en AsyncStorage
- ✅ Sincronización en background
- ✅ TTL configurable
- ✅ Integrado con SWR (deduplicación, revalidación)

**Usar cuando:** Necesitas datos que funcionen offline pero que se sincronicen con Firestore.

---

## Matriz de Decisión

| Necesidad | Hook a Usar | Caché | Sincronización |
|---|---|---|---|
| Autenticación + sesión | `useUser()` | ✅ AsyncStorage | Sesión |
| Validar acceso | `usePermissions()` | ❌ | Re-valida cada pantalla |
| Listar usuarios (admin) | `useUsers()` | ✅ AsyncStorage | Inicial única |
| CRUD territorios | `useTerritory()` | ✅ localDB | Local + sincronización |
| CRUD grupos | `useGroup()` | ✅ localDB | Local + sincronización |
| Listar casas | `useHouses()` | ✅ SWR | Tiempo real con `onSnapshot` |
| Estado de red | `useNetworkStatus()` | ❌ | Listener en tiempo real |
| Ubicación GPS | `useLocation()` | ❌ | Listener continuo |
| Congregaciones | `useCongregation()` | ❌ | SWR simple |
| Formularios | `useForm()` | N/A | Local |
| Filtros/Sort | `useFilterSort()` | ❌ | Local |
