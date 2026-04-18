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

## 5.1 Flujo de Autenticación

### Sistema de roles
La aplicación distingue **tres niveles de acceso:**

| Rol | Permisos | Casos de uso |
|---|---|---|
| **user** | Leer territorios asignados, registrar visitas, ver su perfil | Visitadores de territorios |
| **admin** | Crear/editar/eliminar territorios y grupos, asignar territorios, promover usuarios a admin | Gestores de la congregación |
| **superadmin** | Acceso total + cambiar roles entre cualquier nivel + auditoría | Administrador principal o soporte |

### 5.1.1 Ciclo de vida de una sesión

```
┌─ INICIAL (No autenticado)
│
├─ LOGIN FLOW
│  ├─ Usuario entra email + password
│  ├─ authService.loginUser() valida en Firebase Auth
│  ├─ Si éxito: se obtiene el rol desde Firestore
│  ├─ Datos guardados en AsyncStorage (persistencia)
│  ├─ useUser.userData se actualiza vía mutate()
│  └─ Se navega a (tabs)/* automáticamente
│
├─ REGISTRO FLOW
│  ├─ Usuario crea email + password + nombre + rol (default: 'user')
│  ├─ createUserWithEmailAndPassword en Auth
│  ├─ Se crea doc en Firestore: users/{uid}
│  ├─ Datos cacheados en AsyncStorage
│  └─ Auto-login o redirige a login según flujo
│
├─ SESIÓN ACTIVA
│  ├─ auth.currentUser persiste automáticamente vía AsyncStorage
│  ├─ usePermissions() valida rol en cada boot de la app
│  ├─ Acceso a rutas (tabs)/* restringido a usuarios autenticados
│  └─ CRUD de datos respeta roles en el cliente y servidor
│
├─ LOGOUT
│  ├─ authService.logout() → signOut(auth)
│  ├─ AsyncStorage limpia datos de sesión
│  ├─ territorios y estado global se resetean
│  └─ Se navega a (auth)/login
│
└─ RECUPERACIÓN DE CONTRASEÑA
   ├─ Usuario ingresa email
   ├─ sendPasswordResetEmail() de Firebase
   ├─ Firebase envía email con link
   ├─ Usuario clickea link y resetea offline (en web/app)
   └─ Vuelve a login con nueva contraseña
```

### 5.1.2 Rutas públicas vs protegidas

```
Públicas (app/(auth)/)
├─ /login              → Entrada principal sin autenticación
├─ /register           → Crear nueva cuenta
├─ /forgot-password    → Recuperar contraseña
├─ /welcome            → Splash inicial (opcional)
└─ /splash             → Loading inicial

Protegidas (app/(tabs)/)
├─ / (index.tsx)       → Territorios asignados (todos los usuarios)
├─ /profile            → Perfil del usuario (todos)
├─ /territories        → Gestión de territorios (admin+)
├─ /admin/
│  ├─ /groups          → Gestión de grupos (admin+)
│  ├─ /users           → Gestión de usuarios y roles (admin+)
│  └─ /group/[id]      → Detalle de grupo (admin+)
└─ [catch-all]         → 404 dentro de la app
```

**Protección en código:**
```typescript
// app/(tabs)/_layout.tsx - debe chequear auth
const { isAdmin } = usePermissions();
const user = auth.currentUser;

if (!user) {
  // Redirigir a login (Expo Router lo hace automáticamente si no hay user)
  return <Redirect href="/(auth)/login" />;
}

// Las rutas /admin/* deben chequear isAdmin
if (pathname.startsWith('/admin') && !isAdmin) {
  return <Redirect href="/(tabs)" />;
}
```

### 5.1.3 Gestión de sesión

**Persistencia (automática via Firebase):**
```typescript
// En src/config/firebase.ts
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
// ✅ El usuario NO se desloguea aunque cierre la app
```

**Datos de usuario en cliente:**
```typescript
// useUser.ts - obtiene datos extendidos (rol, perfil, etc.)
const { data: userData } = useOfflineSWR(`user/${uid}`, async () => {
  // Cache offline + datos frescos de Firestore
  const snap = await getDoc(doc(db, 'users', uid));
  return { uid, ...snap.data() };
});
```

**Invalidación de sesión (casos especiales):**
- ⚠️ **Password reset:** El usuario sigue logueado, pero su contraseña cambió en el backend
- ⚠️ **Rol revocado:** El admin quita acceso pero usuario sigue logueado localmente
- ⚠️ **Cuenta desactivada:** Se requiere chequeo en _layout.tsx

### 5.1.4 Cambio de roles

**Admin promoviendo a usuario:**
```typescript
// userService.ts - changeUserRole()
// ✅ Admin puede: user → admin
// ❌ Admin NO puede: admin → superadmin ni cambios complejos

// superadmin puede cualquier cambio
```

**Lado del usuario:**
```typescript
// Cuando el rol cambia en Firestore:
// 1. usePermissions() re-valida en el siguiente render
// 2. El UI se actualiza automáticamente
// ⚠️ Si pierde acceso, redirige automáticamente de /admin a /
```

### 5.1.5 Manejo de errores de autenticación

| Error | Causa | Acción |
|---|---|---|
| `auth/user-not-found` | Email no existe | Sugerir registro |
| `auth/wrong-password` | Contraseña incorrecta | Opción: recuperar contraseña |
| `auth/email-already-in-use` | Email duplicado al registrar | Pedir otro email |
| `auth/weak-password` | Password < 6 caracteres | Mostrar requisitos |
| `auth/too-many-requests` | Rate limiting de Firebase | Esperar 15-30 minutos |
| `auth/invalid-email` | Formato incorrecto | Validar antes de enviar |
| `Network error` | Sin conexión | Mostrar banner offline |

**Implementación:**
```typescript
// useUser.ts - loginUser() captura y traduce errores
try {
  await signInWithEmailAndPassword(auth, email, password);
} catch (error: any) {
  // Traducir error.code → mensaje usuario
  if (error.code === 'auth/wrong-password') {
    Alert.alert('Error', '¿Olvidaste tu contraseña?');
  }
}
```

### 5.1.6 Estructura de código: Autenticación en capas

**Archivos clave involucrados:**

```
✅ src/config/firebase.ts
   └─ Inicializa auth con persistencia en AsyncStorage
   
✅ src/services/authService.ts
   ├─ getUserRole(uid)  → Obtiene rol desde Firestore
   ├─ getCurrentUser()   → Retorna user de Firebase Auth
   ├─ logout()           → Limpia sesión y estado global
   └─ Helpers: isAdmin(), isSuperAdmin()

✅ src/services/userService.ts
   └─ changeUserRole()   → Cambiar rol (con validaciones)

✅ src/hooks/useUser.ts
   ├─ userData          → Estado local del usuario (con caché offline)
   ├─ registerUser()    → Crear cuenta + documento Firestore
   ├─ loginUser()       → Iniciar sesión (carga rol + datos)
   ├─ updateUser()      → Editar perfil (optimistic update)
   └─ resetPassword()   → Recuperar contraseña

✅ src/hooks/useUsers.ts
   ├─ users             → Array de todos los usuarios (admin view)
   ├─ updateUser()      → Cambiar usuario (admin)
   └─ deleteUser()      → Eliminar usuario en Firestore (no Auth)

✅ src/hooks/usePermissions.ts
   ├─ isAdmin           → Booleano de permisos
   └─ isLoading         → Estado de carga

✅ app/(auth)/*.tsx
   ├─ login.tsx         → Pantalla de inicio de sesión
   ├─ register.tsx      → Pantalla de registro (recibe rol si es admin)
   ├─ forgot-password.tsx → Recuperación de contraseña
   ├─ welcome.tsx       → Pantalla de bienvenida
   └─ splash.tsx        → Splash inicial (loading ~2.5s)

✅ app/(tabs)/_layout.tsx
   └─ Protección de ruta: chequea auth.currentUser + usePermissions()

✅ app/(tabs)/admin/* 
   └─ Secciones solo para admin, validadas en _layout y componentes
```

### 5.1.7 Flujo detallado: Registro con rol

```typescript
// Paso 1: Usuario completa el formulario
registerUser(email, password, displayName, role = 'user')

// Paso 2: Crear cuenta en Firebase Auth
createUserWithEmailAndPassword(auth, email, password)
│
└─ Paso 3: Crear documento en Firestore/users/{uid}
   {
     uid, email, displayName, role,
     createdAt: new Date()
   }
   │
   └─ Paso 4: Cache en AsyncStorage para offline
      └─ Paso 5: mutate() para actualizar UI

// Resultado: Usuario existe en Auth + Firestore con rol asignado
```

**Nota:** Si es admin creando otro usuario, puede asignar rol desde el inicio. Si es auto-registro, rol = 'user'.

---

## 5.2 Protección de operaciones por rol

### Checklist de control de acceso

Cada operación crítica debe validar el rol **en DOS lugares:**

1️⃣ **Cliente (UX):** No mostrar botones si usuario no tiene permiso
```typescript
// components/TerritoryActions.tsx
const { isAdmin } = usePermissions();

return (
  <>
    {isAdmin && <Button onPress={handleDelete} text="Eliminar" />}
    {/* Si no es admin, el botón no aparece */}
  </>
);
```

2️⃣ **Servidor (Firestore Rules):** Rechazar operaciones no autorizadas
```
// firestore.rules (PENDIENTE: completar - ver 7.1)
match /territories/{doc=**} {
  allow read: if request.auth != null;
  allow write: if hasRole('admin');
  allow delete: if hasRole('superadmin');
}
```

### Operaciones con restricción por rol

| Operación | user | admin | superadmin | Ubicación |
|---|---|---|---|---|
| Ver territorios asignados | ✅ | ✅ | ✅ | `(tabs)` / index |
| Registrar visita | ✅ | ✅ | ✅ | House component |
| Editar territorios | ❌ | ✅ | ✅ | `(tabs)/territories` |
| Crear grupo | ❌ | ✅ | ✅ | `(tabs)/admin/groups` |
| Asignar territorio a grupo | ❌ | ✅ | ✅ | AssignTerritoryModal |
| Cambiar rol usuario | ❌ | ✅* | ✅ | `(tabs)/admin/users` (*solo a admin) |
| Eliminar usuario | ❌ | ❌ | ✅ | `(tabs)/admin/users` |
| Ver logs de auditoría | ❌ | ❌ | ✅ | `(tabs)/admin/logs` (PENDIENTE) |

---

## 6. Estructura de datos en Firestore

### 6.1 Diagrama de colecciones y relaciones

```
┌─────────────────────────────────────────────────────────────┐
│                     FIRESTORE DATABASE                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐   ┌──────────────┐  │
│  │   users      │      │ territories  │   │   groups     │  │
│  │ (Auth)       │      │              │   │              │  │
│  ├──────────────┤      ├──────────────┤   ├──────────────┤  │
│  │ uid (PK)     │◄─────┤ id (PK)      │   │ id (PK)      │  │
│  │ email        │      │ name         │──►│ name         │  │
│  │ role         │      │ number       │   │ description  │  │
│  │ name         │      │ color        │   │ territoryIds │  │
│  │ createdAt    │      │ coordinates[]│   │ updatedAt    │  │
│  │ congregation │      │ createdBy    │   │              │  │
│  │   Id         │      │ groupId      │   └──────────────┘  │
│  └──────────────┘      │ createdAt    │         ▲            │
│         ▲               │ lastModified │         │ (1:many)   │
│         │               │ synced       │         │            │
│         │ (createdBy)   │ status       │         │            │
│         └───────────────┤              │─────────┘            │
│                         └──────────────┘                       │
│                              ▲                                 │
│                              │ (1:many)                        │
│                         ┌────▼────────────┐                   │
│                         │  avoidHouses    │                   │
│                         │  (colección)    │                   │
│                         ├─────────────────┤                   │
│                         │ id (PK)         │                   │
│                         │ territoryId (FK)│                   │
│                         │ address         │                   │
│                         │ reason          │                   │
│                         │ coordinates     │                   │
│                         │ createdBy       │                   │
│                         │ createdAt       │                   │
│                         │ updatedAt       │                   │
│                         └─────────────────┘                   │
│                                                               │
│  ┌──────────────────┐                                         │
│  │  congregations   │                                         │
│  │                  │                                         │
│  ├──────────────────┤                                         │
│  │ id (PK)          │                                         │
│  │ name             │                                         │
│  │ country          │                                         │
│  │ region           │                                         │
│  └──────────────────┘                                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Definición de colecciones

#### 📋 `users` — Información de usuarios y autenticación
**Storage:** Firebase Auth + Firestore (sync)
**Propósito:** Almacenar perfil, rol y permisos de usuarios

| Campo | Tipo | Requerido | Descripción | Índice |
|---|---|---|---|---|
| `uid` | `string` | ✅ | ID de Firebase Auth (PK) | Primary |
| `email` | `string` | ✅ | Email único del usuario | Unique |
| `role` | `'user' \| 'admin' \| 'superadmin'` | ✅ | Nivel de acceso | ❌ |
| `name` | `string` | ✅ | Nombre completo | ❌ |
| `congregationId` | `string` | ❌ | FK a congregations | ✅ |
| `createdAt` | `Date` | ✅ | Timestamp de creación | ❌ |
| `updatedAt` | `Date` | ❌ | Última actualización | ❌ |
| `isActive` | `boolean` | ❌ | Si el usuario está activo (def: true) | ❌ |
| `lastLogin` | `Date` | ❌ | Último acceso | ❌ |

**Ejemplo:**
```json
{
  "uid": "gN4xQ9kL2z1mP...",
  "email": "maria@congregation.org",
  "role": "admin",
  "name": "María González",
  "congregationId": "cong_001",
  "createdAt": 1713427200,
  "isActive": true,
  "lastLogin": 1713513600
}
```

**Operaciones (Service):** `userService.ts`
- `changeUserRole(targetUserId, newRole)` — Cambiar rol (validado por rol actual)

---

#### 🗺️ `territories` — Zonas geográficas a visitar
**Storage:** Firestore (con sincronización offline local)
**Propósito:** Almacenar polígonos geográficos y metadata de territorios

| Campo | Tipo | Requerido | Descripción | Índice |
|---|---|---|---|---|
| `id` | `string` | ✅ | Document ID autogenerado (PK) | Primary |
| `name` | `string` | ✅ | Nombre del territorio | ✅ |
| `number` | `number` | ✅ | Número de identificación | ✅ |
| `coordinates` | `Array<{lat: number, lng: number}>` | ✅ | Puntos del polígono (mín 3) | Geo |
| `color` | `string` | ✅ | Color RGBA para mapa (def: "rgba(255,0,0,0.8)") | ❌ |
| `groupId` | `string` | ❌ | FK a groups (asignación) | ✅ |
| `status` | `'available' \| 'assigned' \| 'completed'` | ❌ | Estado del territorio | ✅ |
| `createdBy` | `string` | ✅ | FK a users (uid del creador) | ❌ |
| `createdAt` | `Date` | ✅ | Timestamp de creación | ❌ |
| `lastModified` | `number` | ❌ | Timestamp de última modificación | ❌ |
| `synced` | `boolean` | ❌ | Si está sincronizado con Firestore | ❌ |

**Ejemplo:**
```json
{
  "id": "terr_001",
  "name": "Centro Histórico",
  "number": 42,
  "coordinates": [
    {"lat": 40.7128, "lng": -74.0060},
    {"lat": 40.7138, "lng": -74.0050},
    {"lat": 40.7118, "lng": -74.0070}
  ],
  "color": "rgba(0, 150, 255, 0.8)",
  "groupId": "group_001",
  "status": "assigned",
  "createdBy": "gN4xQ9kL2z1mP...",
  "createdAt": 1713427200,
  "synced": true
}
```

**Operaciones (Service):** `territoryService.ts`
- `saveTerritory(coordinates, userId)` — Crear territorio
- `updateTerritory(id, updates)` — Actualizar
- `deleteTerritory(id)` — Eliminar
- `syncAll()` — Sincronizar local ↔ Firestore
- `getLocalTerritories()` — Leer caché local

---

#### 👥 `groups` — Grupos de visitadores
**Storage:** Firestore (con caché local)
**Propósito:** Agrupar usuarios y asignar territorios a grupos

| Campo | Tipo | Requerido | Descripción | Índice |
|---|---|---|---|---|
| `id` | `string` | ✅ | Document ID autogenerado (PK) | Primary |
| `name` | `string` | ✅ | Nombre del grupo | ✅ |
| `description` | `string` | ❌ | Descripción (propósito o zona) | ❌ |
| `territoryIds` | `Array<string>` | ❌ | FK array a territories | ❌ |
| `memberIds` | `Array<string>` | ❌ | FK array a users (uids) | ❌ |
| `createdBy` | `string` | ✅ | FK a users (uid del creador) | ❌ |
| `createdAt` | `Date` | ✅ | Timestamp de creación | ❌ |
| `updatedAt` | `Date` | ❌ | Última actualización | ❌ |

**Ejemplo:**
```json
{
  "id": "group_001",
  "name": "Grupo Centro",
  "description": "Responsables del territorio centro histórico",
  "territoryIds": ["terr_001", "terr_002", "terr_003"],
  "memberIds": ["uid_maria", "uid_juan"],
  "createdBy": "gN4xQ9kL2z1mP...",
  "createdAt": 1713427200,
  "updatedAt": 1713513600
}
```

**Operaciones (Service):** `groupService.ts`
- `getRemoteGroups()` / `getLocalGroups()` — Leer grupos
- `saveGroup(group)` — Crear grupo
- `updateGroup(id, updates)` — Actualizar
- `deleteGroup(id)` — Eliminar
- `assignTerritory(groupId, territoryId)` — Asignar territorio a grupo
- `unassignTerritory(groupId, territoryId)` — Desasignar territorio
- `syncAll()` — Sincronizar

---

#### 🏠 `avoidHouses` — Casas a evitar (motivos especiales)
**Storage:** Firestore
**Propósito:** Registrar casas con restricciones (mascotas, peligrosas, rechazos, etc.)

| Campo | Tipo | Requerido | Descripción | Índice |
|---|---|---|---|---|
| `id` | `string` | ✅ | Document ID autogenerado (PK) | Primary |
| `territoryId` | `string` | ✅ | FK a territories | ✅ |
| `address` | `string` | ✅ | Dirección de la casa | ✅ |
| `reason` | `string` | ✅ | Motivo de restricción (ej: "Perro agresivo") | ❌ |
| `coordinates` | `{latitude: number, longitude: number}` | ✅ | Ubicación GPS | Geo |
| `createdBy` | `string` | ✅ | FK a users (uid quien la registró) | ❌ |
| `createdAt` | `Date` | ✅ | Fecha de registro | ✅ |
| `updatedAt` | `Date` | ❌ | Última modificación | ❌ |

**Ejemplo:**
```json
{
  "id": "house_001",
  "territoryId": "terr_001",
  "address": "Calle Principal 123, Apartamento 4B",
  "reason": "Perro grande y agresivo",
  "coordinates": {"latitude": 40.7128, "longitude": -74.0060},
  "createdBy": "uid_maria",
  "createdAt": 1713427200,
  "updatedAt": 1713513600
}
```

**Operaciones (Service):** `houseService.ts`
- `getHousesByTerritory(territoryId)` — Leer casas de un territorio
- `addHouse(territoryId, address, reason, userId, coordinates)` — Registrar casa
- `updateHouse(houseId, updates)` — Actualizar info
- `deleteHouse(houseId)` — Eliminar
- `subscribeToHousesByTerritory(territoryId, callback)` — Suscribirse a cambios en tiempo real

---

#### ⛪ `congregations` — Organizaciones (iglesias, grupos, etc.)
**Storage:** Firestore
**Propósito:** Múltiples organizaciones independientes usando la app

| Campo | Tipo | Requerido | Descripción | Índice |
|---|---|---|---|---|
| `id` | `string` | ✅ | Document ID autogenerado (PK) | Primary |
| `name` | `string` | ✅ | Nombre de la congregación | ✅ |
| `country` | `string` | ❌ | País | ❌ |
| `region` | `string` | ❌ | Región / Estado | ❌ |
| `createdAt` | `Date` | ✅ | Timestamp de creación | ❌ |

**Ejemplo:**
```json
{
  "id": "cong_001",
  "name": "Congregación Centro",
  "country": "España",
  "region": "Comunidad de Madrid",
  "createdAt": 1713427200
}
```

**Operaciones (Service):** `congregationService.ts`
- `getAll()` — Listar todas las congregaciones
- `getById(id)` — Obtener una por ID
- `create(data)` — Crear nueva
- `update(id, data)` — Actualizar

---

### 6.3 Relaciones entre colecciones

| Relación | De | A | Tipo | Campo | Nota |
|---|---|---|---|---|---|
| Usuario → Territorio | `users` | `territories` | 1:many | `territories.createdBy` | Un usuario crea múltiples territorios |
| Territorio → Grupo | `territories` | `groups` | many:many | `territories.groupId` / `groups.territoryIds` | Un territorio puede estar en un grupo; un grupo puede tener múltiples territorios |
| Grupo → Usuario | `groups` | `users` | many:many | `groups.memberIds` | Un grupo tiene múltiples usuarios; un usuario puede estar en múltiples grupos |
| Casa → Territorio | `avoidHouses` | `territories` | many:1 | `avoidHouses.territoryId` | Múltiples casas por territorio |
| Casa → Usuario | `avoidHouses` | `users` | many:1 | `avoidHouses.createdBy` | Quién registró la restricción |
| Usuario → Congregación | `users` | `congregations` | many:1 | `users.congregationId` | Múltiples usuarios por congregación |

---

### 6.4 Índices recomendados para Firestore

**Índices simples (Auto-creados):**
```
✅ users:        email, role, congregationId
✅ territories:  name, number, status, groupId
✅ groups:       name
✅ avoidHouses:  territoryId, createdAt, coordinates (GEO)
✅ congregations: name
```

**Índices compuestos (Crear manualmente si hay queries complejas):**
```
territories:   (createdBy, status)
avoidHouses:   (territoryId, createdAt)  ← si quieres ordenar casas por territorio y fecha
groups:        (createdBy, createdAt)    ← si quieres historiales por creador
```

> **Nota:** Firestore sugiere automáticamente índices cuando consultas las requieren. Monitorear Firestore Console → Indexes.

---

### 6.5 Relación Service → Colección

| Colección | Service Principal | Fetcher | Caché Local |
|---|---|---|---|
| `users` | `userService.ts` | — | ❌ AsyncStorage (solo sesión) |
| `territories` | `territoryService.ts` | `territoriesFetcher` | ✅ `localDB` (sincronización) |
| `groups` | `groupService.ts` | — | ✅ `localDB` (sincronización) |
| `avoidHouses` | `houseService.ts` | `housesFetcher` | ❌ SWR en memoria |
| `congregations` | `congregationService.ts` | — | ❌ SWR en memoria |

---

### 6.6 Patrones de sincronización y hooks customizados

#### 🔄 El patrón `useOfflineSWR` — Cache offline + sincronización

**Propósito:** Hook genérico que combina SWR (stale-while-revalidate) con persistencia offline en AsyncStorage.

**Características:**
```typescript
const { data, isLoading, error, mutate } = useOfflineSWR<T>(
  key: string,                          // Clave única (ej: "firestore:territories")
  fetcher: async () => T,               // Función que obtiene datos de Firebase
  {
    ttl: number,                        // Time-to-live del cache en ms (ej: 24h)
    // Hereda opciones estándar de SWR: revalidateOnFocus, errorRetryCount, etc.
  }
);
```

**Beneficios:**
- ✅ Datos en caché mientras se revalida en background
- ✅ Funciona offline: devuelve AsyncStorage si fetch falla
- ✅ TTL configurable: cache expira después de N ms
- ✅ Integrado con SWR: hereda deduplicación y revalidación

**Ejemplo de uso:**
```typescript
// En useTerritory.ts
const { data: territories = [], mutate } = useOfflineSWR<Territory[]>(
  'firestore:territories',              // Clave única
  territoriesFetcher,                   // Función async que trae datos
  {
    ttl: 1000 * 60 * 60 * 24,          // 24 horas de cache
  }
);
```

---

#### 🔐 Sincronización inicial única con `useRef`

**Problema:** Sin control, `useEffect` puede ejecutar sincronización múltiples veces en development.

**Solución:** Flag en ref para garantizar una sola sincronización:

```typescript
// En useTerritory.ts
let hasInitializedSync = false;  // Variable global
const isSyncingRef = useRef(false);

useEffect(() => {
  if (hasInitializedSync || isSyncingRef.current) return;
  isSyncingRef.current = true;

  (async () => {
    // 1️⃣ Cargar desde caché local primero (instantáneo)
    const local = await territoryService.getLocalTerritories();
    mutateTerritories(local, false);

    // 2️⃣ Sincronizar en background con Firestore
    try {
      const synced = await territoryService.syncAll();
      mutateTerritories(synced, false);
      hasInitializedSync = true;
    } catch (error) {
      console.warn('Sincronización fallida (offline?):', error);
    }
  })();
}, []);
```

**Resultado:** UX rápido (muestra datos locales instantáneamente) + datos frescos en background.

---

#### 🎯 Operaciones batch

**Cuando cambiar múltiples documentos a la vez:**

```typescript
// En useTerritory.ts
const markAllReady = async () => {
  setIsBatchLoading(true);
  try {
    // ⚡ Ejecuta múltiples updateTerritory en paralelo
    await territoryService.markAllAsReady(territories);
    await refreshTerritories();
  } catch (error) {
    setBatchError('No se pudieron marcar como listos');
  } finally {
    setIsBatchLoading(false);
  }
};

// En territoryService.ts
async updateMultipleTerritories(updates: Partial<Territory>[]) {
  const promises = updates.map((u) => this.updateTerritory(u.id!, u));
  return Promise.all(promises);  // Paralelo, no secuencial
}
```

---

#### 📝 Optimistic updates (actualizar UI antes de confirmar)

**Patrón:** Actualizar estado local inmediatamente, revertir si falla:

```typescript
// En useTerritory.ts
const updateTerritory = useCallback(
  async (id: string, updates: Partial<Territory>) => {
    // 1️⃣ Actualización optimista (instantáneo para UI)
    await mutateTerritories(
      async (current) => {
        const newData = current.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        );
        // 2️⃣ Confirmar en Firestore en background
        await territoryService.updateTerritory(id, updates);
        return newData;
      },
      { revalidate: false }  // No revalidar, usamos la data que pasamos
    );
  },
  [mutateTerritories]
);
```

**Resultado:** El usuario ve el cambio al instante. Si falla, SWR revalida automáticamente.

---

#### 🔗 Relaciones bidireccionales: Mantener sincronización

**Problema:** `territories.groupId` y `groups.territoryIds` deben estar sincronizadas.

**Solución:** Actualizar AMBOS lados en cada operación:

```typescript
// En useGroup.ts
const assignTerritory = useCallback(
  async (groupId: string, territoryId: string) => {
    // 1️⃣ Actualizar el grupo
    await groupService.assignTerritory(groupId, territoryId);
    
    // 2️⃣ Actualizar el territorio (relación inversa)
    await updateTerritory(territoryId, { groupId });
    
    // 3️⃣ Actualizar estado local
    const updated = groups.map(g =>
      g.id === groupId && !g.territoryIds.includes(territoryId)
        ? { ...g, territoryIds: [...g.territoryIds, territoryId] }
        : g
    );
    mutate(updated, false);
  },
  [groups, mutate, updateTerritory]
);
```

**Patrón aplicable:** Siempre que haya FK en ambos lados, actualizar ambas colecciones.

---

#### 📡 Suscripciones en tiempo real (Real-time listeners)

**Cuándo usar:** Datos que cambian frecuentemente y necesitan actualización instantáneainstantánea sin polling (ej: casas, cambios en grupo, etc.)

```typescript
// En houseService.ts
subscribeToHousesByTerritory(territoryId: string, callback) {
  const q = query(
    collection(db, 'avoidHouses'),
    where('territoryId', '==', territoryId)
  );

  // Escuchar cambios en Firestore en tiempo real
  return onSnapshot(q, (snapshot) => {
    const houses = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    // Actualizar estado local + caché de SWR
    callback(houses);
    mutate(getHousesKey(territoryId), houses, false);
  });
}

// En useHouses.ts
useEffect(() => {
  if (!territoryId) return;

  // Suscribirse y escuchar cambios
  const unsubscribe = houseService.subscribeToHousesByTerritory(
    territoryId,
    (houses) => console.log('Casas actualizadas:', houses)
  );

  // Limpiar al desmontar
  return () => unsubscribe();
}, [territoryId]);
```

**Ventaja:** Datos siempre frescos sin polling.  
**Costo:** Requiere conexión; se desuscribe automáticamente si hay error.

**Cuándo NO usar:** Para operaciones CRUD simples (use optimistic updates). Para datos que se actualizan raramente (use SWR normal).

---

#### 🏗️ Mapa de hooks → Responsabilidades

| Hook | Propósito | Caché | Sincronización |
|---|---|---|---|
| `useUser()` | Auth + perfil actual | ✅ AsyncStorage | Sesión |
| `useUsers()` | Listar todos los usuarios (admin) | ✅ AsyncStorage | Sincronización inicial |
| `useGroup()` | CRUD grupos + asignaciones | ✅ localDB | Sincronización bidireccional |
| `useTerritory()` | CRUD territorios + operaciones batch | ✅ localDB | Sincronización inicial única |
| `useHouses()` | CRUD casas + suscripción RT | ❌ SWR en memoria | Suscripción en tiempo real |
| `useCongregation()` | Listar congregaciones | ❌ En memoria | Recarga manual |

**Regla de oro:** Si el dato es crítico y se usa offline → `localDB + sincronización`. Si es solo para lectura → `SWR en memoria`.

---

#### ⚠️ Manejo de errores y estados de carga

**Estados comunes en hooks:**
```typescript
// Estructura recomendada para todo hook
const {
  // Datos
  data,
  
  // Estados de carga
  isLoading,
  isFetching,      // Revalidando en background
  
  // Errores
  error,
  batchError,      // Error en operaciones batch
  
  // Funciones
  mutate,          // Para actualizar manualmente
  refresh,         // Para revalidar
} = useHook();
```

**Ejemplo de manejo robusto:**
```typescript
// En useTerritory.ts
const markAllReady = async () => {
  setIsBatchLoading(true);        // Mostrar spinner
  setBatchError(null);             // Limpiar error previo

  try {
    await territoryService.markAllAsReady(territories);
    await refreshTerritories();
    // ✅ Éxito: mostrar toast/banner
  } catch (error) {
    setBatchError('No se pudieron marcar como listos');
    // ❌ Error: mostrar alerta
  } finally {
    setIsBatchLoading(false);      // Esconder spinner
  }
};

// En componente
{isBatchLoading && <Spinner />}
{batchError && <AlertError message={batchError} />}
```

**Mejores prácticas:**
- ✅ Mostrar spinner mientras `isLoading` o `isFetching`
- ✅ Deshabilitar botones durante operaciones (`isLoading`, `isBatchLoading`)
- ✅ Mostrar errores claros al usuario
- ✅ Permitir reintentos cuando hay error
- ✅ Usar `try/catch` con `finally` para garantizar limpiar estados

---

## 7. Cómo extender el proyecto

### Agregar una nueva colección en Firestore
1. **Definir tipo en `src/types/MiEntidad.ts`**
   ```typescript
   export interface MiEntidad {
     id: string;
     nombre: string;
     // ... campos
   }
   ```

2. **Crear `src/services/miEntidadService.ts`** con CRUD básico
   ```typescript
   export const miEntidadService = {
     async getAll() { /* getDocs */ },
     async getById(id) { /* getDoc */ },
     async create(data) { /* addDoc */ },
     async update(id, data) { /* updateDoc */ },
     async delete(id) { /* deleteDoc */ },
   };
   ```

3. **Crear `src/hooks/useMiEntidad.ts`** 
   - Si los datos son críticos offline: usar `localDB` + `sync()`
   - Si son solo lectura: usar `useOfflineSWR` con fetcher

4. **Consumir en pantalla:**
   ```typescript
   // app/(tabs)/mi-pantalla.tsx
   import { useMiEntidad } from '~/hooks/useMiEntidad';

   export default function MiPantalla() {
     const { items, isLoading, createItem } = useMiEntidad();
     // Usar datos y funciones
   }
   ```

### Decisión rápida: ¿Qué tipo de hook crear?

| Necesidad | Tipo de Hook | Caché | Ejemplo |
|---|---|---|---|
| **Leer datos online (lectura única)** | SWR simple | ❌ En memoria | `useCongregation()` |
| **CRUD + datos críticos offline** | `useOfflineSWR` + `localDB` | ✅ localDB | `useTerritory()`, `useGroup()` |
| **Autenticación + sesión** | `useOfflineSWR` + `AsyncStorage` | ✅ AsyncStorage | `useUser()` |
| **Cambios en tiempo real** | `useOfflineSWR` + `onSnapshot` | ✅ SWR + listeners | `useHouses()` |
| **Listar + admin (no offline)** | SWR simple | ❌ En memoria | `useUsers()` |

---

## 6.7 Patrones de Validación y Manejo de Errores

### Validación de Formularios

#### 🎯 Validación en capas (cliente + servidor)

Toda validación de formularios se realiza en **DOS lugares** para máxima robustez:

**1️⃣ Cliente (UX inmediata):**
```typescript
// components/CustomTextInput.tsx - Validación mientras el usuario escribe
export interface CustomTextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  error?: string;  // Mostrar error debajo del input
  placeholder?: string;
}

export function CustomTextInput({ value, onChangeText, error }: CustomTextInputProps) {
  return (
    <View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        className={cn(
          'px-4 py-2 rounded border',
          error ? 'border-red-500' : 'border-gray-300'
        )}
      />
      {error && <Text className="text-red-500 text-sm mt-1">{error}</Text>}
    </View>
  );
}
```

**2️⃣ Servidor (Firestore Rules + Cloud Functions):**
```firestore
// firestore.rules - Validar estructura de datos
match /users/{userId} {
  allow create: if 
    request.resource.data.email is string &&
    request.resource.data.email.size() > 0 &&
    request.resource.data.name is string &&
    request.resource.data.name.size() > 0 &&
    request.resource.data.role in ['user', 'admin', 'superadmin'];
}
```

#### 📋 Esquema de validación con Yup/Zod

Se recomienda usar **Yup** (más legible) o **Zod** (más seguro en tipos) para definir esquemas reutilizables:

```typescript
// src/utils/validationSchemas.ts
import * as yup from 'yup';

export const loginSchema = yup.object().shape({
  email: yup
    .string()
    .email('Correo inválido')
    .required('El correo es requerido'),
  password: yup
    .string()
    .min(6, 'Mínimo 6 caracteres')
    .required('La contraseña es requerida'),
});

export const territorySchema = yup.object().shape({
  name: yup
    .string()
    .required('El nombre es requerido')
    .min(3, 'Mínimo 3 caracteres')
    .max(50, 'Máximo 50 caracteres'),
  number: yup
    .number()
    .required('El número es requerido')
    .positive('Debe ser un número positivo'),
  color: yup
    .string()
    .matches(/^rgba?\(/, 'Color inválido'),
});

export const groupSchema = yup.object().shape({
  name: yup
    .string()
    .required('El nombre es requerido')
    .min(3, 'Mínimo 3 caracteres'),
  description: yup
    .string()
    .optional()
    .max(200, 'Máximo 200 caracteres'),
});

export const houseSchema = yup.object().shape({
  address: yup
    .string()
    .required('La dirección es requerida')
    .min(5, 'Mínimo 5 caracteres'),
  reason: yup
    .string()
    .optional()
    .max(200, 'Máximo 200 caracteres'),
});
```

#### 🔄 Integración con `useForm()` Hook (sin validación integrada)

**Nota:** El hook `useForm()` es básico y **NO tiene validación integrada**. Validar con esquema Yup/Zod en el componente o custom hook.

```typescript
// app/(auth)/login.tsx - Validación manual con Yup
import { useForm } from '~/hooks/useForm';
import * as yup from 'yup';

const loginSchema = yup.object().shape({
  email: yup.string().email('Correo inválido').required('Requerido'),
  password: yup.string().min(6, 'Mínimo 6 caracteres').required('Requerido'),
});

export default function LoginScreen() {
  const { form, handleChange, resetForm } = useForm({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setIsLoading(true);
    try {
      // Validar manualmente
      await loginSchema.validate(form);
      
      // Ejecutar login
      await loginUser(form.email, form.password);
      // Navegar a home
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View>
      {error && <AlertError message={error} />}
      
      <CustomTextInput
        placeholder="Correo"
        value={form.email}
        onChangeText={(text) => handleChange('email', text)}
      />
      <CustomTextInput
        placeholder="Contraseña"
        value={form.password}
        onChangeText={(text) => handleChange('password', text)}
        secureTextEntry
      />
      <CustomButton
        onPress={handleSubmit}
        text="Iniciar sesión"
        loading={isLoading}
        disabled={isLoading}
      />
    </View>
  );
}
```

#### ✅ Validaciones personalizadas

Para lógica más compleja, agregar validadores custom:

```typescript
// src/utils/customValidators.ts
export const validateEmailUnique = async (email: string) => {
  // Verificar si el email ya existe en Firestore
  const existingUser = await userService.getUserByEmail(email);
  if (existingUser) {
    throw new Error('El correo ya está registrado');
  }
};

export const validateTerritoryCoordinates = (coordinates: Coordinate[]) => {
  if (coordinates.length < 3) {
    throw new Error('Se requieren al menos 3 puntos para crear un territorio');
  }
  
  // Validar que no sean colineales (todos en línea recta)
  const area = calculatePolygonArea(coordinates);
  if (area < 100) {  // Área mínima en metros cuadrados
    throw new Error('El territorio es muy pequeño');
  }
};

// Uso en validación:
export const registerSchema = yup.object().shape({
  email: yup
    .string()
    .email()
    .required()
    .test('unique-email', 'Este correo ya está registrado', 
      async (value) => {
        if (!value) return true;
        try {
          await validateEmailUnique(value);
          return true;
        } catch {
          return false;
        }
      }
    ),
});
```

---

### Comunicación de Errores al Usuario

#### 🎨 Componentes de Error

**1. AlertError (para errores críticos):**
```typescript
// components/AlertError.tsx
interface AlertErrorProps {
  message: string;
  onDismiss?: () => void;
  retryAction?: () => void;
}

export function AlertError({ message, onDismiss, retryAction }: AlertErrorProps) {
  return (
    <View className="bg-red-100 border-l-4 border-red-500 p-4 mb-4">
      <View className="flex-row justify-between items-start">
        <Text className="text-red-800 flex-1">{message}</Text>
        <Pressable onPress={onDismiss}>
          <Text className="text-red-800 font-bold">✕</Text>
        </Pressable>
      </View>
      
      {retryAction && (
        <Pressable onPress={retryAction} className="mt-2">
          <Text className="text-red-700 font-semibold underline">Reintentar</Text>
        </Pressable>
      )}
    </View>
  );
}
```

**2. Toast (para notificaciones rápidas):**
```typescript
// No requiere componente, usar Alert.alert de React Native o librería
Alert.alert('Error', 'No se pudo guardar el territorio');
```

**3. Banner de conexión (para estado offline):**
```typescript
// components/NetworkStatusBanner.tsx
export function NetworkStatusBanner() {
  const { isOffline } = useNetworkStatus();
  
  if (!isOffline) return null;
  
  return (
    <View className="bg-yellow-100 border-b-2 border-yellow-500 p-3">
      <Text className="text-yellow-800">
        📡 Sin conexión. Los cambios se sincronizarán cuando haya internet.
      </Text>
    </View>
  );
}
```

#### 📊 Mapeo de errores: Código → Mensaje amigable

```typescript
// src/utils/errorMessages.ts
export const getErrorMessage = (error: any): string => {
  // Firebase Auth errors
  if (error.code === 'auth/user-not-found') {
    return 'Este correo no está registrado. ¿Quieres crear una cuenta?';
  }
  if (error.code === 'auth/wrong-password') {
    return 'Contraseña incorrecta. ¿Olvidaste tu contraseña?';
  }
  if (error.code === 'auth/email-already-in-use') {
    return 'Este correo ya está registrado. Intenta con otro.';
  }
  if (error.code === 'auth/weak-password') {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  if (error.code === 'auth/too-many-requests') {
    return 'Demasiados intentos fallidos. Intenta más tarde.';
  }
  
  // Firestore errors
  if (error.code === 'permission-denied') {
    return 'No tienes permiso para realizar esta acción.';
  }
  if (error.code === 'not-found') {
    return 'El elemento no existe o fue eliminado.';
  }
  if (error.code === 'unavailable') {
    return 'El servicio no está disponible. Intenta más tarde.';
  }
  
  // Network errors
  if (error.message?.includes('Network')) {
    return 'Error de conexión. Verifica tu internet.';
  }
  
  // Default
  return 'Algo salió mal. Por favor intenta de nuevo.';
};

// Uso en hooks:
export function useTerritory() {
  const [error, setError] = useState<string | null>(null);
  
  const updateTerritory = async (id: string, updates: Partial<Territory>) => {
    try {
      await territoryService.updateTerritory(id, updates);
    } catch (err) {
      setError(getErrorMessage(err));  // ← Mensaje amigable
    }
  };
  
  return { error, updateTerritory };
}
```

#### 🎯 Estrategia de mostrar/ocultar errores

```typescript
// components/FormWithErrors.tsx
export function LoginForm() {
  const { values, errors, touched } = useForm({...});
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  return (
    <ScrollView>
      {/* Error general del submit */}
      {submitError && <AlertError message={submitError} onDismiss={() => setSubmitError(null)} />}
      
      {/* Errores de campo (solo si fue tocado) */}
      <CustomTextInput
        error={touched.email ? errors.email : undefined}
        {...}
      />
      
      {/* Errores adicionales de contexto */}
      {batchError && (
        <View className="bg-red-50 p-3 rounded border border-red-200">
          <Text className="text-red-800">{batchError}</Text>
        </View>
      )}
    </ScrollView>
  );
}
```

---

### Estados de Carga y Error en Operaciones

#### ⏳ Estados básicos en cada operación

Todo hook debe exponer **estados claros** para que el componente sepa qué mostrar:

```typescript
export function useTerritories() {
  return {
    // Carga
    isLoading,      // Primera carga (mostrar skeleton o spinner)
    isFetching,     // Revalidando en background (No mostrar spinner, mantener UI)
    isSyncing,      // Sincronizando offline → Firestore
    
    // Errores
    error,          // Error en fetch
    syncError,      // Error en sync
    validationError,// Error de validación
    
    // Éxito
    successMessage, // Mensaje de confirmación
  };
}
```

#### 🎬 Mostrar estados apropiados en UI

```typescript
// app/(tabs)/territories.tsx
export default function TerritoriesScreen() {
  const { 
    territories, 
    isLoading,      // Primera carga
    isFetching,     // Revalidando
    error, 
    successMessage 
  } = useTerritory();
  
  if (isLoading) {
    return <SkeletonLoader />;  // Mostrar mientras carga inicial
  }
  
  return (
    <ScrollView>
      {/* Mostrar banner si falla la sincronización (pero no bloquea) */}
      {isFetching && <Text>Actualizando territorios...</Text>}
      
      {/* Mostrar error si hay */}
      {error && (
        <AlertError 
          message={error} 
          retryAction={() => refreshTerritories()}
        />
      )}
      
      {/* Mostrar confirmación exitosa */}
      {successMessage && (
        <Toast type="success" message={successMessage} />
      )}
      
      {/* Contenido principal */}
      <TerritoryList territories={territories} />
    </ScrollView>
  );
}
```

#### 🔄 Ciclo de un formulario con validación + error

```typescript
// components/AddTerritoryForm.tsx
export function AddTerritoryForm() {
  const { values, errors, touched, isSubmitting, handleChange, handleSubmit } = useForm({
    initialValues: { name: '', number: 0, color: '' },
    validationSchema: territorySchema,
    onSubmit: async (values) => {
      // 1. Validación ya hecha (antes de llegar aquí)
      
      // 2. Intenta crear
      try {
        await createTerritory(values);
        
        // 3. Éxito: mostrar confirmación
        Alert.alert('Éxito', 'Territorio creado correctamente');
        resetForm();
        
      } catch (error) {
        // 4. Error: mapear y mostrar
        const friendlyError = getErrorMessage(error);
        setSubmitError(friendlyError);
      }
    },
  });
  
  return (
    <View>
      {submitError && <AlertError message={submitError} />}
      
      <CustomTextInput
        placeholder="Nombre"
        value={values.name}
        onChangeText={(text) => handleChange('name', text)}
        error={touched.name ? errors.name : undefined}
      />
      
      <CustomButton
        onPress={handleSubmit}
        text="Crear"
        loading={isSubmitting}  // Desabilitar durante submit
      />
    </View>
  );
}
```

---

### Validación de Roles y Permisos

#### 🔐 Validación de permisos en componentes

```typescript
// components/AdminButton.tsx - No renderizar si no es admin
interface AdminButtonProps {
  onPress: () => void;
  text: string;
}

export function AdminButton({ onPress, text }: AdminButtonProps) {
  const { isAdmin } = usePermissions();
  
  if (!isAdmin) {
    return null;  // No renderizar para usuarios normales
  }
  
  return <CustomButton onPress={onPress} text={text} />;
}
```

#### 📋 Validación de permisos antes de operaciones

```typescript
// src/hooks/useTerritory.ts
const deleteTerritory = async (id: string) => {
  // 1. Validar permiso en cliente
  const { isAdmin } = usePermissions();
  if (!isAdmin) {
    throw new Error('No tienes permiso para eliminar territorios');
  }
  
  // 2. Ejecutar operación (servidor valida de nuevo)
  try {
    await territoryService.deleteTerritory(id);
  } catch (error) {
    if (error.code === 'permission-denied') {
      // Tu permiso cambió o se revocó
      setError('Tu rol cambió. Recarga la app.');
    }
  }
};
```

---

### Manejo de Errores de Red

#### 📡 Detección y recuperación automática

```typescript
// En hooks que hacen fetch (useTerritory, useGroup, etc):
export function useTerritory() {
  const { isOnline } = useNetworkStatus();
  
  useEffect(() => {
    // Cuando vuelve la conexión, revalidar automáticamente
    if (isOnline) {
      refreshTerritories();
    }
  }, [isOnline]);
  
  const updateTerritory = async (id: string, updates) => {
    if (!isOnline) {
      // Offline: guardar localmente y marcar para sync
      await localDB.saveTerritory({ ...updates, synced: false });
      return;
    }
    
    // Online: ejecutar y guardar
    await territoryService.updateTerritory(id, updates);
  };
}
```

#### 🔁 Reintentos exponenciales para operaciones críticas

```typescript
// src/utils/retryWithBackoff.ts
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  initialDelayMs = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;  // Última tentativa: fallar
      }
      
      // Esperar con backoff exponencial
      const delay = initialDelayMs * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Failed after max attempts');
}

// Uso:
const updateTerritory = async (id: string, updates) => {
  return await retryWithBackoff(
    () => territoryService.updateTerritory(id, updates),
    3,     // Máximo 3 intentos
    1000   // Empezar con 1 segundo, luego 2, 4, etc.
  );
};
```

---

### ✅ Resumen: Checklist de Validación y Manejo de Errores

Cuando crees un nuevo formulario o realizas una operación que requiera validación y manejo de errores, verifica este checklist:

#### 📋 Validación de Formularios

- [ ] **Esquema definido:** Existe un `validationSchema` en `src/utils/validationSchemas.ts`
- [ ] **Validación cliente:** Validar en tiempo real mientras el usuario escribe (debouncing opcional)
- [ ] **Validación servidor:** Firestore Rules + Cloud Functions validan los mismos campos
- [ ] **Mensajes claros:** Los errores son específicos y accionables (no "Error")
- [ ] **Errores mostrados:** Solo se muestran errores de campos que el usuario ha tocado (`touched`)
- [ ] **Permisos validados:** Si es operación sensible, validar rol ANTES de intentar

#### 🎨 Comunicación de Errores

- [ ] **Componentes apropiadosustrados:** Usar `AlertError`, `Toast`, o `Banner` según contexto
- [ ] **Mensajes traducidos:** Mapear `error.code` → `getErrorMessage()` para mensajes amigables
- [ ] **Botón Reintentar:** Si hay conexión o errores transitoriostransitorios, ofrecer reintentar
- [ ] **Contexto claro:** El usuario sabe POR QUÉ falló y QUÉ puede hacer

#### ⏳ Estados de Carga

- [ ] **Estados expuestos:** Hook expone `isLoading`, `isFetching`, `isSyncing`, etc.
- [ ] **UI apropiada:** 
  - `isLoading` → Mostrar esqueleto/spinner (bloquea UI)
  - `isFetching` → Banner discreto (no bloquea)
  - `isSyncing` → Indicador de fondo
- [ ] **Botones deshabilitados:** Durante `isSubmitting`, deshabilitar para evitar múltiples clicks
- [ ] **Timeout:** Operaciones largas tienen timeout configurado

#### 🔐 Validación de Permisos

- [ ] **Ocultamiento de UI:** Si el usuario no tiene permiso, no mostrar el botón/opción
- [ ] **Validación doble:** Cliente valida para UX, servidor valida para seguridad
- [ ] **Manejo de revocación:** Si un admin te quita acceso, redirigir de `/admin` a `/`
- [ ] **Mensajes específicos:** "No tienes permiso" en lugar de error genérico

#### 📡 Manejo de Errores de Red

- [ ] **Detección de conexión:** Usar `useNetworkStatus()` para saber si hay internet
- [ ] **Fallback offline:** Si falla un fetch y hay cache, mostrar cache
- [ ] **Sincronización automática:** Cuando vuelve internet, sincronizar cambios pendientes
- [ ] **Reintentos:** Para operaciones críticas, usar `retryWithBackoff()`
- [ ] **Banner de estado:** Mostrar "📡 Sin conexión" cuando es offline

#### 🧪 Testing recomendado

```typescript
// Casos a validar:
✓ Formulario válido → submit exitoso
✓ Formulario inválido → mostrar errores
✓ Error de validación servidor → mostrar error al usuario
✓ Error de permiso → mostrar "No autorizado"
✓ Error de red → mostrar "Sin conexión" + opción reintentar
✓ Cambios offline → guardar localmente + sincronizar al conectar
✓ Usuario pierde conexión durante operación → manejar gracefully
✓ User role changed during session → redirigir si pierde acceso
```

---

### Agregar una nueva pantalla
1. Crear archivo en `app/(tabs)/mi-pantalla.tsx` o estructura de carpetas
2. Expo Router la registra automáticamente
3. Si es admin-only: agregar validación en `_layout.tsx`
4. Usar un hook existente o crear uno nuevo si la lógica es compleja

### Agregar un nuevo componente
1. Crear en `components/MiCarpeta/MiComponente.tsx`
2. Definir props con `interface` 
3. **Nunca** importar servicios directamente (recibir datos por props)
4. Emitir eventos via `onPress`, `onChange`, etc.

---

## 8. Decisiones de arquitectura

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

## 9. Seguridad y Firestore Rules

### 7.1 Reglas de Firestore (Implementadas - En mejora)

✅ **Estado:** Las Firestore Rules **ya están parcialmente implementadas**. Sin embargo, requieren optimización y estandarización.

#### Problemas actuales identificados:

| Problema | Severidad | Impacto | Acción |
|---|---|---|---|
| **Regla temporal expirada** | 🔴 CRÍTICO | Toda la DB rechazará acceso en ago 2025 (ya ocurrió) | Remover `timestamp.date(2025, 8, 17)` |
| **Duplicación de rules** | 🟠 IMPORTANTE | `match /territories/{territory}` aparece 2x, la 2ª anula la 1ª | Consolidar en una sola regla |
| **Verificaciones de rol repetidas** | 🟡 IMPORTANTE | `get(/databases/.../users/...)` se ejecuta múltiples veces por request | Refactorizar a función reutilizable |
| **`groups` muy permisiva** | 🟠 IMPORTANTE | Cualquier usuario autenticado puede escribir | Restringir a `admin` solo |
| **`avoidHouses` poco clara** | 🟡 IMPORTANTE | ¿Por qué cualquiera puede CRUD? | Documentar propósito y restringir si aplica |
| **Falta colección `houses`** | 🟠 IMPORTANTE | No hay rules para la colección `houses` | Agregar rules explícitas |
| **Falta auditoría** | 🔴 CRÍTICO | No hay colección `audit_logs` definida | Crear y documentar |

#### Reglas optimizadas (Recomendadas):

```firestore
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
  
    // ===== FUNCIONES HELPERS =====
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserRole(uid) {
      return get(/databases/$(database)/documents/users/$(uid)).data.role;
    }
    
    function isAdmin(uid) {
      return getUserRole(uid) in ['admin', 'superadmin'];
    }
    
    function isSuperAdmin(uid) {
      return getUserRole(uid) == 'superadmin';
    }
    
    function isOwner(uid) {
      return request.auth.uid == uid;
    }

    // ===== COLECCIÓN: users =====
    
    match /users/{userId} {
      // El propio usuario puede leer su documento
      allow read: if isOwner(userId);
      
      // Admin y superadmin pueden leer TODOS los usuarios
      allow read: if isAdmin(request.auth.uid);
      
      // El usuario puede actualizar su propio perfil (excepto rol)
      allow update: if isOwner(userId) && 
        !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role']);
      
      // Superadmin puede cambiar el rol de cualquiera
      allow update: if isSuperAdmin(request.auth.uid);
      
      // Superadmin puede crear (nuevos usuarios - usualmente vía signup)
      allow create: if isSuperAdmin(request.auth.uid) || 
        (request.auth.uid == userId); // O el nuevo usuario a sí mismo
      
      // Solo superadmin puede eliminar usuarios
      allow delete: if isSuperAdmin(request.auth.uid);
    }

    // ===== COLECCIÓN: territories =====
    
    match /territories/{territoryId} {
      // Todos los autenticados pueden LEER territorios
      allow read: if isAuthenticated();
      
      // Admin+ pueden CREAR territorios
      allow create: if isAdmin(request.auth.uid);
      
      // Admin+ pueden EDITAR territorios (excepto si cambia assignedUserId sin permisos)
      allow update: if isAdmin(request.auth.uid) &&
        // Si intenta cambiar assignedUserId, solo superadmin puede hacerlo
        (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['assignedUserId']) ||
         isSuperAdmin(request.auth.uid));
      
      // Solo superadmin puede ELIMINAR
      allow delete: if isSuperAdmin(request.auth.uid);
    }

    // ===== COLECCIÓN: groups =====
    
    match /groups/{groupId} {
      // Todos los autenticados pueden LEER grupos
      allow read: if isAuthenticated();
      
      // Solo admin+ pueden CREAR, EDITAR, ELIMINAR
      allow create: if isAdmin(request.auth.uid);
      allow update: if isAdmin(request.auth.uid);
      allow delete: if isSuperAdmin(request.auth.uid);
    }

    // ===== COLECCIÓN: houses =====
    
    match /houses/{houseId} {
      // Todos los autenticados pueden LEER
      allow read: if isAuthenticated();
      
      // Admin+ pueden CREAR
      allow create: if isAdmin(request.auth.uid);
      
      // Admin+ pueden EDITAR
      allow update: if isAdmin(request.auth.uid);
      
      // Superadmin+ pueden ELIMINAR
      allow delete: if isSuperAdmin(request.auth.uid);
    }

    // ===== COLECCIÓN: avoidHouses =====
    // NOTA: Revisar propósito de esta colección
    // Actual: Usuarios registran casas para evitar (quizá por comportamiento)
    
    match /avoidHouses/{houseId} {
      // Todos pueden LEER
      allow read: if isAuthenticated();
      
      // Todos pueden CREAR (registrar casa a evitar)
      allow create: if isAuthenticated();
      
      // Todos pueden EDITAR su propio registro (si tienes ownership)
      // PENDIENTE: Definir structure - ¿tiene userUid? ¿hasMany records?
      allow update: if isAuthenticated();
      
      // Superadmin puede ELIMINAR
      allow delete: if isSuperAdmin(request.auth.uid);
    }

    // ===== COLECCIÓN: audit_logs (NUEVA) =====
    // Para trackear cambios críticos: cambios de rol, eliminaciones, etc.
    
    match /audit_logs/{logId} {
      // Admin+ pueden LEER logs
      allow read: if isAdmin(request.auth.uid);
      
      // Solo sistema puede escribir (via Cloud Functions)
      // Bloqueamos writes directas desde el cliente
      allow write: if false;
    }

    // ===== COLECCIÓN: visitNotes (SUGERIDA) =====
    // Si existe, agregar rules para notas de visitas
    
    match /visitNotes/{noteId} {
      allow read: if isAuthenticated();
      allow create, update: if isAuthenticated(); // Cada usuario sus notas
      allow delete: if isSuperAdmin(request.auth.uid);
    }
  }
}
```

#### Cambios respecto a lo que tenías:

| Cambio | Razón |
|---|---|
| Remover regla con `timestamp.date(2025, 8, 17)` | Ya expiró; expone la BD |
| Consolidar 2x `match /territories` | Evita conflictos y confusión |
| Crear funciones helper | Reduce duplicación y mejora legibilidad |
| Restringir `groups` a admin | Mayor seguridad |
| Clarificar `avoidHouses` | Revisar si el acceso debe ser tan abierto |
| Agregar `houses` rules explícitas | Falta en tu config actual |
| Agregar `audit_logs` | Para cumplir P4 (auditoría) |

**Nota:** Estas reglas aún no usan **Custom Claims** de Firebase Auth (ver 7.2). El enfoque actual hace GET al documento `/users/{uid}` cada vez, lo que consume lecturas. Para producción, considera implementar Custom Claims.

### 7.2 Custom Claims (FUTURO - Recomendado para optimizar)

Actualmente, los roles se almacenan en Firestore (`users/{uid}.role`). Esto funciona, pero cada validación en Firestore Rules hace un GET adicional a la BD.

**Alternativa: Custom Claims en Firebase Auth**

Los roles en Firebase Custom Claims ofrecen ventajas en producción:

```typescript
// Cloud Function (ejecutarse con admin SDK)
// functions/src/triggers/setUserRole.ts
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const setUserRole = functions.https.onCall(async (data, context) => {
  const { targetUserId, newRole } = data;
  
  // Solo superadmin puede cambiar roles
  const caller = await admin.auth().getUser(context.auth!.uid);
  if (caller.customClaims?.role !== 'superadmin') {
    throw new functions.https.HttpsError('permission-denied', 'No autorizado');
  }
  
  // Validar rol válido
  if (!['user', 'admin', 'superadmin'].includes(newRole)) {
    throw new functions.https.HttpsError('invalid-argument', 'Rol inválido');
  }
  
  // Establecer custom claim
  await admin.auth().setCustomUserClaims(targetUserId, { role: newRole });
  
  // TAMBIÉN actualizar en Firestore para consistency
  await admin.firestore().collection('users').doc(targetUserId).update({ 
    role: newRole,
    roleUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  return { success: true, message: `Rol actualizado a ${newRole}` };
});
```

**Ventajas:**
- ✅ Los roles en el token JWT → no requiere GET adicional en Rules
- ✅ Más rápido y eficiente en operaciones batch
- ✅ Más seguro: rol verificado por Firebase directamente

**Desventajas:**
- ❌ Requiere Cloud Functions (costo adicional)
- ❌ Cambios de rol tardan ~1 minuto en propagarse al token

**Recomendación:** Implementar cuando escale a producción con múltiples usuarios.

---

## 8. Decisiones aún pendientes

Estos temas requieren seguimiento y optimización:


| # | Tema | Estado | Impacto | Sugerencias | Responsable |
|---|---|---|---|---|---|
| **P1** | **Firestore Rules** | 🟢 PARCIAL | 🟡 IMPORTANTE | Implementadas pero necesitan optimización (ver 7.1) | Backend |
| **P2** | **Remover regla temporal expirada** | 🔴 CRÍTICO | 🔴 CRÍTICO | Remove `timestamp.date(2025, 8, 17)` inmediatamente | URGENTE |
| **P3** | **Custom Claims / Cloud Functions** | 🔴 FUTURO | 🟠 IMPORTANTE | Optimizar roles en producción (ver 7.2) | Backend |
| **P4** | **Implementar auditoría** | 🔴 NO INICIADO | 🟠 IMPORTANTE | Crear colección `audit_logs` + Cloud Function para trackear cambios | Backend |
| **P5** | **Revisar colección `avoidHouses`** | 🟡 ACTIVA | 🟡 IMPORTANTE | Documentar propósito y validar permisos | Product |
| **P6** | **Expiración de sesión** | 🔴 NO DEFINIDO | 🟠 IMPORTANTE | ¿Timeout de inactividad? Actualmente: nunca expira | Security |
| **P7** | **Rate limiting en login** | 🔴 NO IMPLEMENTADO | 🟠 IMPORTANTE | Evitar brute force (Firebase tiene limitaciones) | Backend |
| **P8** | **2FA / Verificación de email** | 🟡 FUTURO | 🟡 IMPORTANTE | ¿Email verificado obligatorio? ¿Autenticador? | Security |
| **P9** | **Encriptar datos offline** | 🟡 FUTURO | 🟡 IMPORTANTE | ¿Encriptar AsyncStorage? Ver: `expo-secure-store` | Security |
| **P10** | **Revocar sesión remotamente** | 🟡 FUTURO | 🟡 IMPORTANTE | Si cuenta se compromete, ¿logout desde backend? | Security |
| **P11** | **Estructura de `avoidHouses`** | 🟡 REVISAR | 🟡 IMPORTANTE | ¿Tiene `userUid`? ¿Multiple records per house? Documentar modelo | Product |

### Checklist inmediato (Antes de producción)

- [ ] **🔴 URGENTE:** Remover regla con `timestamp.date(2025, 8, 17)` de Firestore Rules
- [ ] **Consolidar rules** de `territories` (hay duplicación)
- [ ] **Documentar propósito** de `avoidHouses` colección
- [ ] **Rate limiting** en Firebase Auth (investigar opciones)
- [ ] **Auditoría básica** de cambios de rol + eliminaciones
- [ ] **Validaciones** en cliente AND servidor
- [ ] **Tests de seguridad** (inyección, CORS, auth edge cases)

### Checklist pre-productivo

- [ ] **Custom Claims** implementados en Cloud Function (opcional pero recomendado)
- [ ] **Email verification** requerida (si aplica)
- [ ] **Timeout de sesión** configurado (si es que aplica)
- [ ] **Documentación** de roles y permisos en README
- [ ] **Audit trail** funcional para cambios críticos

---

## 9. Dependencias clave

| Librería | Rol | Notas |
|---|---|---|
| `expo` | Framework base | Managed workflow, gestiona el build |
| `expo-router` | Navegación file-based | Las rutas se definen por la estructura de `app/` |
| `firebase` | Auth + Firestore | Solo usar desde `src/services/` y `src/config/` |
| `nativewind` | Sistema de estilos | Tailwind CSS para React Native |
| `typescript` | Tipado estático | Nunca usar `any` |

---

## 10. Patrón Offline-First

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

### 10.7 Consideraciones y mejoras futuras

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

## 11. Hooks Especializados

Documentación detallada de cada hook en `src/hooks/` y su propósito específico.

### 11.1 `useUser()` — Autenticación y perfil actual

**Propósito:** Gestionar la sesión del usuario, autenticación y datos personales.

**Estado:**
```typescript
const {
  userData,           // { uid, email, name, role, congregationId, ... }
  isLoading,          // Cargando datos iniciales
  error,              // Error si falló la autenticación
  isAuthenticated,    // Booleano de sesión activa
  registerUser(),     // async (email, password, name, role?) → crear cuenta
  loginUser(),        // async (email, password) → iniciar sesión
  logoutUser(),       // async () → cerrar sesión
  updateUser(),       // async (updates) → editar perfil
  resetPassword(),    // async (email) → enviar email de recuperación
} = useUser();
```

**Características:**
- ✅ Persistencia automática vía `getReactNativePersistence(AsyncStorage)`
- ✅ Caché con `AsyncStorage` (sesión no se pierde al cerrar app)
- ✅ Sincronización bidireccional: Auth + Firestore
- ✅ Manejo robusto de errores de Firebase Auth
- ✅ Integración con `usePermissions()` para validar rol

**Uso:**
```typescript
// app/(tabs)/_layout.tsx - Proteger rutas
const { isAuthenticated } = useUser();
if (!isAuthenticated) {
  return <Redirect href="/(auth)/login" />;
}

// app/(tabs)/profile.tsx - Mostrar perfil del usuario
const { userData, updateUser } = useUser();
<Text>{userData?.name}</Text>
```

**Notas:**
- El hook detecta cambios en `auth.currentUser` automáticamente
- Los datos de usuario (rol, perfil extendido) se sincronizaban desde Firestore
- La persistencia de sesión es transparente (usuario se logea una sola vez)

---

### 11.2 `useUsers()` — Listar y administrar usuarios (Admin)

**Propósito:** Gestionar la lista completa de usuarios (solo para admin+).

**Estado:**
```typescript
const {
  users,              // Array de User[]
  isLoading,          // Cargando lista
  error,              // Error al traer usuarios
  updateUser(),       // async (uid, updates) → cambiar datos del usuario
  deleteUser(),       // async (uid) → eliminar usuario (superadmin)
  changeUserRole(),   // async (uid, newRole) → cambiar rol (validado)
  mutate,             // Para revalidar manualmente
} = useUsers();
```

**Características:**
- ✅ Solo accesible para `isAdmin` (validado en componente)
- ✅ Caché con `useOfflineSWR` + `AsyncStorage`
- ✅ Cambio de rol validado (admin solo puede → admin; superadmin puede cualquier cambio)
- ✅ Operaciones batch: cambiar múltiples usuarios paralelo

**Uso:**
```typescript
// app/(tabs)/admin/users.tsx - Panel de administración de usuarios
const { users, changeUserRole, isLoading } = useUsers();

users.map(user => (
  <UserRow
    key={user.uid}
    user={user}
    onRoleChange={(newRole) => changeUserRole(user.uid, newRole)}
  />
))
```

**Validaciones de rol:**
- ❌ `user` NO puede cambiar roles
- ✅ `admin` puede cambiar `user` → `admin` (no a superadmin)
- ✅ `superadmin` puede cambiar cualquier rol

---

### 11.3 `useTerritory()` — CRUD de territorios + sync

**Propósito:** Gestionar la lectura, creación, edición y sincronización de territorios. Es el **hook más crítico** para la app.

**Estado:**
```typescript
const {
  territories,        // Array de Territory[]
  isLoading,          // Cargando inicial
  isFetching,         // Revalidando en background
  error,              // Error en fetch
  syncError,          // Error en sincronización
  isSyncing,          // Sincronizando con Firestore
  
  // Operaciones CRUD
  createTerritory(),  // async (coords, color?, name?, number?) → crear
  updateTerritory(),  // async (id, updates) → editar con optimistic update
  deleteTerritory(),  // async (id) → eliminar
  
  // Operaciones batch
  markAllAsReady(),   // async () → marcar todos como listos
  assignToGroup(),    // async (territoryId, groupId) → asignar a grupo
  
  // Sincronización manual
  syncNow(),          // async () → forzar sync con Firestore
  mutate,             // Para actualizar estado manualmente
} = useTerritory();
```

**Características:**
- ✅ **Soporte offline-first:** Cache en `localDB` (AsyncStorage)
- ✅ **Sincronización única:** Se sincroniza una sola vez al iniciar (`useRef` para evitar duplicados)
- ✅ **Optimistic updates:** UI se actualiza al instante, confirma en background
- ✅ **Detección automática de reconexión:** Cuando vuelve internet, sincroniza automáticamente
- ✅ **Sincronización bidireccional de relaciones:** `territories.groupId` ↔ `groups.territoryIds`

**Caché:**
```
AsyncStorage
  ├─ local_territories      → Array completo (sincronizado)
  ├─ firestore:territories  → Cache SWR (TTL: 24h)
  └─ ... otros datos
```

**Sincronización:**
```
1. Inicialización:
   ├─ Lee local_territories (instantáneo)
   ├─ Muestra en UI inmediatamente
   └─ Sincroniza background (carga cambios remotos)

2. Usuario edita:
   ├─ Actualiza local_territories
   ├─ Mutate SWR (UI se refresca)
   ├─ Si online: uploadToFirestore() paralelo
   ├─ Si offline: marca synced: false

3. Vuelve internet:
   ├─ useNetworkStatus detecta transición
   ├─ Sincroniza cambios pendientes (synced: false)
   ├─ Descarga cambios remotos
   └─ Mutate SWR (UI se actualiza)
```

**Uso:**
```typescript
// app/(tabs)/index.tsx - Ver territorios asignados
const { territories, isLoading } = useTerritory();
<TerritoryList territories={territories} loading={isLoading} />

// app/(tabs)/territories.tsx - Editar territorios (admin)
const { createTerritory, updateTerritory } = useTerritory();
await createTerritory(coordinates, color, name, number);
await updateTerritory(territoryId, { name: 'Nuevo nombre' });
```

**Notas:**
- El hook **NO sincroniza en cada render** (usa `useRef` para prevenir duplicados)
- Las operaciones son **idempotentes**: ejecutarlas múltiples veces da el mismo resultado
- La sincronización es **bidireccional**: cambios locales ↔ Firestore

---

### 11.4 `useGroup()` — CRUD de grupos + asignaciones de territorios

**Propósito:** Gestionar grupos de visitadores y la asignación de territorios a grupos.

**Estado:**
```typescript
const {
  groups,             // Array de Group[]
  isLoading,          // Cargando lista
  isSyncing,          // Sincronizando
  error,              // Error en fetch/sync
  
  // Operaciones CRUD
  createGroup(),      // async (name, description?) → crear grupo
  updateGroup(),      // async (id, updates) → editar grupo
  deleteGroup(),      // async (id) → eliminar grupo
  
  // Asignaciones de territorios
  assignTerritory(),  // async (groupId, territoryId) → asignar territorio a grupo
  unassignTerritory(),// async (groupId, territoryId) → desasignar
  
  mutate,             // Para actualizar manualmente
} = useGroup();
```

**Características:**
- ✅ **Sincronización bidireccional:** `groups.territoryIds` ↔ `territories.groupId` se mantienen sincronizadas
- ✅ **Caché offline:** `localDB` para persistencia
- ✅ **Operaciones batch:** Asignar múltiples territorios paralelo
- ✅ **Validación de relaciones:** Previene asignaciones duplicadas

**Caché:**
```
AsyncStorage
  ├─ local_groups        → Array de grupos
  └─ firestore:groups    → Cache SWR (TTL: 24h)
```

**Sincronización de relaciones:**
```typescript
// Cuando asignas un territorio a un grupo:
assignTerritory(groupId, territoryId)
  ├─ Actualiza groups[groupId].territoryIds += territoryId
  ├─ Actualiza territories[territoryId].groupId = groupId
  ├─ Guarda ambas relaciones en Firestore
  └─ Mutate ambos hooks (territories + groups)
```

**Uso:**
```typescript
// app/(tabs)/admin/groups.tsx - Gestionar grupos
const { groups, createGroup, assignTerritory } = useGroup();

groups.map(group => (
  <GroupCard
    key={group.id}
    group={group}
    onAssign={(territoryId) => assignTerritory(group.id, territoryId)}
  />
))
```

---

### 11.5 `useHouses()` — CRUD de casas y suscripción en tiempo real

**Propósito:** Gestionar casas dentro de un territorio, incluidas casas a evitar y visitas.

**Estado:**
```typescript
const {
  houses,             // Array de House[]
  isLoading,          // Cargando
  error,              // Error
  
  // Operaciones CRUD
  addHouse(),         // async (address, reason?, coordinates?) → agregar casa
  updateHouse(),      // async (houseId, updates) → editar casa
  deleteHouse(),      // async (houseId) → eliminar casa
  
  mutate,             // Para actualizar manualmente
} = useHouses(territoryId);
```

**Características:**
- ✅ **Suscripción en tiempo real** (`onSnapshot`): cambios remotos se reflejan instantáneamente
- ✅ **Caché en SWR** (no en `localDB` porque es lectura/cambios rápidos)
- ✅ **Bajo demanda:** Se carga por territorio, no global
- ✅ **Deduplicación:** No registra la misma casa dos veces

**Caché:**
```
SWR en memoria
  └─ houses_${territoryId} → Cache con TTL configurable
     (NO persiste en AsyncStorage)
```

**Suscripción:**
```typescript
// En houseService:
onSnapshot(query(...), (snapshot) => {
  // Se ejecuta cuando cambia en Firestore
  const houses = snapshot.docs.map(d => ({...}));
  callback(houses);  // Actualiza UI instantáneamente
});
```

**Uso:**
```typescript
// components/TerritoryDetails.tsx - Ver casas de un territorio
const { houses, isLoading } = useHouses(territoryId);
<HouseList houses={houses} loading={isLoading} />

// Agregar casa a evitar
const { addHouse } = useHouses(territoryId);
await addHouse('Calle Principal 123', 'Perro agresivo', { lat, lng });
```

---

### 11.6 `usePermissions()` — Validar rol y permisos

**Propósito:** Determinar qué acciones puede hacer el usuario actual basado en su rol.

**Estado:**
```typescript
const {
  role,               // 'user' | 'admin' | 'superadmin' | null
  isLoading,          // Cargando rol
  isAdmin,            // role === 'admin' || role === 'superadmin'
  isSuperAdmin,       // role === 'superadmin'
  canEdit,            // Alias para isAdmin
  canDelete,          // Alias para isSuperAdmin
  canManageUsers,     // Alias para isAdmin
} = usePermissions();
```

**Características:**
- ✅ Re-valida rol en cada sesión (obtiene del documento user en Firestore)
- ✅ Auto-detecta cambios de rol (si admin te lo quita, te redirige fuera de /admin)
- ✅ Integrado con `useUser()` (lee del contexto)

**Uso:**
```typescript
// app/(tabs)/_layout.tsx - Proteger rutas admin
const { isAdmin } = usePermissions();
if (pathname === '/admin' && !isAdmin) {
  return <Redirect href="/(tabs)" />;
}

// components/TerritoryActions.tsx - Mostrar/ocultar botones
const { isAdmin } = usePermissions();
return (
  <>
    {isAdmin && <Button onPress={handleEdit} text="Editar" />}
    {/* El botón solo aparece para admin+ */}
  </>
);
```

---

### 11.7 `useNetworkStatus()` — Detectar conexión a internet

**Propósito:** Monitorear el estado de la conexión de red y detectar transiciones (online ↔ offline).

**Estado:**
```typescript
const {
  isOnline,           // boolean: true si hay conexión
  isOffline,          // boolean: true si NO hay conexión
  isConnecting,       // boolean: estado intermedio
  status,             // 'online' | 'offline' | 'unknown'
} = useNetworkStatus();
```

**Características:**
- ✅ Usa `@react-native-community/netinfo` para detección confiable
- ✅ Se dispara automaticamente en transiciones (online → offline, offline → online)
- ✅ Integrado con `useTerritory()` para sincronización automática

**Uso:**
```typescript
// components/NetworkStatusBanner.tsx
const { isOffline } = useNetworkStatus();
return (
  <>{isOffline && <Banner text="Sin conexión a internet" />}</>
);

// src/hooks/useTerritory.ts - Trigger sync cuando vuelve conexión
const { isOnline } = useNetworkStatus();
useEffect(() => {
  if (isOnline) {
    syncWithFirestore();
  }
}, [isOnline]);
```

---

### 11.8 `useOfflineSWR()` — Wrapper de SWR con caché offline

**Propósito:** Hook genérico para datos con soporte offline, caché inteligente y sincronización automática.

**Estado:**
```typescript
const {
  data,               // T | undefined
  isLoading,          // Primer fetch en progreso
  isFetching,         // Revalidando en background
  error,              // Error en fetch
  
  mutate,             // Actualizar estado manualmente
  refresh,            // Forzar revalidación
} = useOfflineSWR<T>(
  key: string,                              // Clave única (ej: "firestore:territories")
  fetcher: async () => T,                   // Función que trae datos
  {
    ttl: number,                            // Tiempo de vida del cache en ms (ej: 86400000 = 24h)
    // Opciones estándar de SWR heredadas: revalidateOnFocus, errorRetryCount, etc.
  }
);
```

**Características:**
- ✅ Cache offline en `AsyncStorage` con timestamp
- ✅ Deduplicación automática (no ejecuta 2x el fetcher simultáneamente)
- ✅ Revalidación inteligente (en background sin bloquear UI)
- ✅ Fallback a cache si fetcher falla (modo offline)
- ✅ Expiración de cache (TTL)

**Caché:**
```
AsyncStorage[key] = {
  data: T,
  timestamp: number,   // Cuándo se guardó
  ttl: number,        // Tiempo de vida (ms)
}
```

**Lógica:**
```
1. Fetch solicitado
   ├─ Si hay cache válido (dentro de TTL):
   │  ├─ Devuelve cache al instante (UI rápida)
   │  └─ Revalida en background (actualizar si hay cambios)
   │
   └─ Si NO hay cache o expiró:
      ├─ Intenta fetcher()
      ├─ Si éxito: guarda en cache
      └─ Si falla: devuelve cache antiguo (offline)

2. Internet vuelve
   ├─ useNetworkStatus detecta cambio
   └─ Revalida (intenta fetch nuevamente)
```

**Uso:**
```typescript
// En src/hooks/useTerritory.ts
const { data: territories } = useOfflineSWR<Territory[]>(
  'firestore:territories',
  async () => {
    return await territoriesFetcher();
  },
  {
    ttl: 1000 * 60 * 60 * 24,  // 24 horas
  }
);
```

---

### 11.9 `useCongregation()` — Listar congregaciones

**Propósito:** Obtener la lista de congregaciones disponibles en la app (solo lectura).

**Estado:**
```typescript
const {
  congregations,      // Array de Congregation[]
  isLoading,          // Cargando lista
  error,              // Error en fetch
} = useCongregation();
```

**Características:**
- ✅ Lectura simple (no hay CRUD)
- ✅ Caché en SWR (en memoria, no persistente)
- ✅ Datos estáticos (rara vez cambian)

**Uso:**
```typescript
// app/(auth)/register.tsx - Seleccionar congregación
const { congregations } = useCongregation();
<Picker items={congregations} />
```

---

### 11.10 `useForm()` — Manejo básico de formularios

**Propósito:** Hook básico para manejar estado de formularios y cambios de valores. **No incluye validación integrada.**

**Estado:**
```typescript
const {
  form,               // { [fieldName]: value } - estado actual del formulario
  
  // Handlers
  handleChange(),     // (fieldName, value) → actualizar valor
  setForm(),          // Establecer formulario completo
  resetForm(),        // Resetear al estado inicial
} = useForm(initialState);
```

**Características:**
- ✅ Estado simple y reutilizable
- ✅ Sin dependencias adicionales
- ✅ Manejo de cambios eficiente con `useCallback`
- ✅ Nota: Validaciones deben hacerse en el componente o custom hook extendido

**Uso:**
```typescript
// app/(auth)/login.tsx
const { form, handleChange, resetForm } = useForm({
  email: '',
  password: '',
});

<CustomTextInput
  value={form.email}
  onChangeText={(text) => handleChange('email', text)}
/>
<CustomButton 
  onPress={async () => {
    try {
      await loginUser(form.email, form.password);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }} 
  text="Iniciar sesión" 
/>
```

---

### 11.11 `useFilterSort()` — Gestionar filtros y ordenamiento

**Propósito:** Mantener estado de filtros y opciones de ordenamiento para listas.

**Estado:**
```typescript
const {
  filters,            // { [filterName]: value }
  sortBy,             // 'name' | 'date' | 'status' | ...
  sortOrder,          // 'asc' | 'desc'
  
  // Handlers
  setFilter(),        // (name, value) → actualizar filtro
  setSortBy(),        // (field) → cambiar ordenamiento
  toggleSortOrder(),  // Cambiar asc ↔ desc
  clearFilters(),     // Resetear todos los filtros
} = useFilterSort();
```

**Características:**
- ✅ Persistencia opcional en AsyncStorage
- ✅ Validación de valores válidos
- ✅ Integración con `FilterBottomSheet` componentes

**Uso:**
```typescript
// app/(tabs)/territories.tsx - Filtrar territorios
const { filters, setFilter, sortBy } = useFilterSort();

const filtered = territories
  .filter(t => !filters.status || t.status === filters.status)
  .sort((a, b) => sortBy === 'name' ? a.name.localeCompare(b.name) : 0);

<FilterButtons
  onFilterChange={(name, value) => setFilter(name, value)}
/>
```

---

### 11.12 `useLocation()` — Obtener ubicación GPS del usuario

**Propósito:** Acceder a la ubicación actual del dispositivo (GPS).

**Estado:**
```typescript
const {
  location,           // { latitude: number, longitude: number }
  isLoading,          // Obteniendo ubicación
  error,              // Error de permisos o GPS
  hasPermission,      // ¿Permiso de ubicación otorgado?
  requestPermission(),// Pedir permisos al usuario
} = useLocation();
```

**Características:**
- ✅ Manejo automático de permisos (iOS/Android)
- ✅ Ubicación en tiempo real (opcional suscripción continua)
- ✅ Fallback a ubicación cacheda si falla

**Uso:**
```typescript
// components/Map/TerritoryPolygons.tsx - Mostrar usuario en mapa
const { location } = useLocation();
<MapView>
  {location && <Marker coordinate={location} />}
  {/* Territorios como polígonos */}
</MapView>
```

---

### 11.13 `useTerritoriesAdmin()` — Gestión básica de territorios (Admin)

**Propósito:** Hook especializado para operaciones administrativas de territorios (CRUD básico).

**Estado:**
```typescript
const {
  // Operaciones CRUD básicas
  createTerritory(),  // Crear territorio
  updateTerritory(),  // Actualizar territorio
  deleteTerritory(),  // Eliminar territorio
  assignUser(),       // Asignar usuario a territorio (FUTURO)
} = useTerritoriesAdmin();
```

**Nota:** Operaciones batch (marcar todos, reassign, CSV) son **FUTURO**, no implementadas aún.

**Características:**
- ✅ CRUD directo sin cache (similar a useTerritory() pero sin sync offline)
- ✅ Validaciones de rol en cliente
- ✅ Manejo de errores básico

**Uso:**
```typescript
// app/(tabs)/admin/ - Crear/editar/eliminar territorios
const { createTerritory, updateTerritory, deleteTerritory } = useTerritoriesAdmin();

await createTerritory({ name: 'Nuevo', zone: 'Centro' });
await deleteTerritory(territoryId);
```

**Nota:** Para operaciones complejas (batch, CSV), se recomienda usar `useTerritory()` + `territoryService` directamente.

---

## 12. Variables de entorno

Las variables sensibles (API keys de Firebase, etc.) se manejan con `app.config.ts` y el sistema de `extra` de Expo, **nunca hardcodeadas en el código fuente**.

Acceder a ellas desde `src/config/` únicamente.

---

*Última actualización: 2026 — mantener este documento sincronizado con cambios estructurales del proyecto.*
