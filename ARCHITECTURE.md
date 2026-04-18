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
   ├─ userData          → Estado local del usuario
   ├─ registerUser()    → Crear cuenta
   ├─ loginUser()       → Iniciar sesión
   ├─ updateUser()      → Editar perfil
   └─ resetPassword()   → Recuperar contraseña

✅ src/hooks/usePermissions.ts
   ├─ isAdmin           → Booleano de permisos
   └─ isLoading         → Estado de carga

✅ app/(auth)/*.tsx
   ├─ login.tsx         → Pantalla de inicio de sesión
   ├─ register.tsx      → Pantalla de registro
   ├─ forgot-password.tsx → Recuperación de contraseña
   └─ splash.tsx        → Splash inicial (opcional)

✅ app/(tabs)/_layout.tsx
   └─ Protección de ruta: chequea auth.currentUser + usePermissions()

✅ app/(tabs)/admin/* 
   └─ Secciones solo para admin, validadas en _layout y componentes
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
   └─ splash.tsx        → Splash inicial (opcional)

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

**Propósito:** Hook genérico que combina SWR (stale-while-revalidate) con persistencia offline y sincronización automática.

**Características:**
```typescript
const { data, isLoading, error, mutate } = useOfflineSWR<T>(
  key: string,                          // Clave única (ej: "firestore:territories")
  fetcher: async () => T,               // Función que obtiene datos de Firebase
  {
    revalidateOnFocus: boolean,         // ¿Revalidar al enfocar la app?
    revalidateOnReconnect: boolean,     // ¿Revalidar cuando vuelve conexión?
    dedupingInterval: number,           // ms para deduplicar requests idénticas
    ttl: number,                        // Time-to-live del cache (ms)
    errorRetryCount: number             // Reintentos en caso de error
  }
);
```

**Beneficios:**
- ✅ Datos en caché mientras se revalida en background
- ✅ Funciona offline: muestra caché aunque no haya internet
- ✅ Auto-sincroniza cuando reconecta
- ✅ Deduplicación automática de requests duplicados

**Ejemplo de uso:**
```typescript
// En useTerritory.ts
const { data: territories = [], mutate } = useOfflineSWR<Territory[]>(
  TERRITORIES_KEY,                      // "firestore:territories"
  territoriesFetcher,                   // Función async que trae datos
  {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
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

## 11. Variables de entorno

Las variables sensibles (API keys de Firebase, etc.) se manejan con `app.config.ts` y el sistema de `extra` de Expo, **nunca hardcodeadas en el código fuente**.

Acceder a ellas desde `src/config/` únicamente.

---

*Última actualización: 2026 — mantener este documento sincronizado con cambios estructurales del proyecto.*
