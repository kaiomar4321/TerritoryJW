# Roles y Reglas de Firestore

Sistema de permisos y validación de acceso en cliente y servidor.

---

## Sistema de Tres Roles

```
┌─────────────┐
│  superadmin │  ← Acceso total + auditoría
└─────────────┘
      ▲
      │ puede promover a
      ▼
┌─────────────┐
│    admin    │  ← Gestión de datos
└─────────────┘
      ▲
      │ puede promover a
      ▼
┌─────────────┐
│    user     │  ← Solo lectura + registrar visitas
└─────────────┘
```

---

## Matriz de Permisos

### Por Operación

| Operación | user | admin | superadmin |
|---|---|---|---|
| Ver territorios asignados | ✅ | ✅ | ✅ |
| Registrar visita | ✅ | ✅ | ✅ |
| Ver perfil propio | ✅ | ✅ | ✅ |
| Editar perfil propio | ✅ | ✅ | ✅ |
| **Crear territorio** | ❌ | ✅ | ✅ |
| **Editar territorio** | ❌ | ✅ | ✅ |
| **Eliminar territorio** | ❌ | ❌ | ✅ |
| **Crear grupo** | ❌ | ✅ | ✅ |
| **Asignar territorio a grupo** | ❌ | ✅ | ✅ |
| **Ver todos los usuarios** | ❌ | ✅ | ✅ |
| **Cambiar role a user** | ❌ | ✅ | ✅ |
| **Cambiar role a admin** | ❌ | ❌ | ✅ |
| **Eliminar usuario** | ❌ | ❌ | ✅ |
| **Ver logs de auditoría** | ❌ | ❌ | ✅ |

---

### Por Ruta

| Ruta | Acceso | Validación |
|---|---|---|
| `/(auth)/*` | Público | Sin sesión activa |
| `/(tabs)` | Autenticado | `auth.currentUser` existe |
| `/(tabs)/territories` | admin+ | `usePermissions().isAdmin` |
| `/(tabs)/admin/*` | admin+ | `usePermissions().isAdmin` |
| `/(tabs)/admin/users` | admin+ | `usePermissions().isAdmin` |
| `/(tabs)/admin/groups` | admin+ | `usePermissions().isAdmin` |

---

## Protección de Rutas con Expo Router

### Concepto: `href: null` vs `href: undefined`

En Expo Router, las rutas se registran automáticamente basándose en la estructura de archivos. Para controlar su visibilidad en el tab bar:

**`href: null`** ➜ La ruta existe pero **NO se muestra** en el tab bar
```typescript
<Tabs.Screen name="admin/users" options={{ href: null }} />
// ✅ Ruta interna (puede ser accedida, pero no visible)
```

**`href: undefined`** (o no especificar `href`) ➜ La ruta **SÍ se muestra** en el tab bar
```typescript
<Tabs.Screen name="admin/users" options={{ href: undefined }} />
// ✅ Ruta visible como tab
```

### Implementación con Permisos

```typescript
// app/(tabs)/_layout.tsx
const isAdmin = userData.role === 'admin' || userData.role === 'superadmin';

<Tabs.Screen
  name="admin/users"
  options={{
    title: 'Usuarios',
    href: isAdmin ? undefined : null,  // ← Clave: condicional
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="people-outline" size={size} color={color} />
    ),
  }}
/>
```

**Flujo:**
- Si `isAdmin: true` → `href: undefined` → **Tab visible** ✅
- Si `isAdmin: false` → `href: null` → **Tab oculto** ✅

### Rutas Internas (Nunca visibles)

Rutas que existen pero nunca deben aparecer en el tab bar:

```typescript
<Tabs.Screen
  name="admin/group/[id]"
  options={{
    href: null,  // Siempre oculto
  }}
/>
```

---

## Validación en Cliente

### Hook `usePermissions()`

```typescript
const {
  isAdmin,        // ¿Es admin o superadmin?
  isSuperAdmin,   // ¿Es superadmin específicamente?
  isLoading,      // Validando rol?
} = usePermissions();
```

**Implementación:**
```typescript
// En usePermissions.ts
const { userData } = useUser();

const isAdmin = userData?.role === 'admin' || userData?.role === 'superadmin';
const isSuperAdmin = userData?.role === 'superadmin';
```

---

### Protección de Rutas

```typescript
// app/(tabs)/_layout.tsx
export default function TabsLayout() {
  const { userData, loading, isFetching } = useUser();

  // Esperar a que userData esté completamente cargado
  if (loading || isFetching || !userData || !userData.role) {
    return null;
  }

  const isAdmin = userData.role === 'admin' || userData.role === 'superadmin';

  return (
    <Tabs>
      {/* Tabs públicos (todos ven) */}
      <Tabs.Screen name="index" options={{ title: 'Mapa' }} />
      <Tabs.Screen name="territories" options={{ title: 'Territorios' }} />

      {/* Tabs admin (condicionales) */}
      <Tabs.Screen
        name="admin/users"
        options={{
          title: 'Usuarios',
          href: isAdmin ? undefined : null,  // ← Ocultado si no eres admin
        }}
      />
      <Tabs.Screen
        name="admin/groups"
        options={{
          title: 'Grupos',
          href: isAdmin ? undefined : null,  // ← Ocultado si no eres admin
        }}
      />

      {/* Rutas internas (nunca visibles) */}
      <Tabs.Screen
        name="admin/group/[id]"
        options={{ href: null }}
      />

      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
```

**Beneficios:**
1. ✅ **Seguridad visual:** Si no eres admin, no ves los tabs
2. ✅ **Simplicidad:** No necesitas `if` condicionales para renderizar
3. ✅ **Protección en ruta:** Las pantallas `admin/*` aún validan permisos internally
4. ✅ **UX clara:** El usuario no ve tabs que no puede usar

---

### Ocultamiento de UI

```typescript
// components/TerritoryActions.tsx
const TerritoryActions = ({ territory }) => {
  const { isAdmin, isSuperAdmin } = usePermissions();

  return (
    <View>
      {isAdmin && (
        <Button
          text="Editar"
          onPress={handleEdit}
        />
      )}

      {isSuperAdmin && (
        <Button
          text="Eliminar definitivamente"
          onPress={handleDelete}
        />
      )}
    </View>
  );
};
```

---

## Validación en Servidor (Firestore Rules)

### Estructura de Rules

**Ubicación:** `firestore.rules` (en raíz del proyecto)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Función auxiliar para verificar rol
    function hasRole(role) {
      return request.auth.token.role == role;
    }

    function isUser() {
      return request.auth != null;
    }

    function isAdmin() {
      return hasRole('admin') || hasRole('superadmin');
    }

    function isSuperAdmin() {
      return hasRole('superadmin');
    }

    // Reglas por colección...
  }
}
```

---

### Reglas por Colección

#### Users

```
match /users/{userId} {
  // Leer: solo el usuario mismo o admin
  allow read: if isUser() && (request.auth.uid == userId || isAdmin());

  // Crear: auth service (backend)
  allow create: if false;  // Delegado a Firebase Auth + Cloud Functions

  // Actualizar: solo el usuario mismo
  allow update: if request.auth.uid == userId;

  // Eliminar: solo superadmin
  allow delete: if isSuperAdmin();
}
```

---

#### Territories

```
match /territories/{territoryId} {
  // Leer: todos los autenticados
  allow read: if isUser();

  // Crear: solo admin+
  allow create: if isAdmin() && 
    request.resource.data.createdBy == request.auth.uid;

  // Actualizar: admin+ o creador
  allow update: if isAdmin() || 
    resource.data.createdBy == request.auth.uid;

  // Eliminar: solo superadmin
  allow delete: if isSuperAdmin();
}
```

---

#### Groups

```
match /groups/{groupId} {
  // Leer: todos los autenticados
  allow read: if isUser();

  // Crear: solo admin+
  allow create: if isAdmin();

  // Actualizar: admin+
  allow update: if isAdmin();

  // Eliminar: solo superadmin
  allow delete: if isSuperAdmin();
}
```

---

#### AvoidHouses (casas a evitar)

```
match /avoidHouses/{houseId} {
  // Leer: todos los autenticados
  allow read: if isUser();

  // Crear: cualquier usuario autenticado
  allow create: if isUser() && 
    request.resource.data.createdBy == request.auth.uid;

  // Actualizar: creador o admin
  allow update: if resource.data.createdBy == request.auth.uid || 
    isAdmin();

  // Eliminar: creador o admin
  allow delete: if resource.data.createdBy == request.auth.uid || 
    isAdmin();
}
```

---

#### Congregations

```
match /congregations/{congId} {
  // Leer: todos los autenticados
  allow read: if isUser();

  // Escribir: solo superadmin
  allow write: if isSuperAdmin();
}
```

---

## Flujo de Validación de Permisos

```
                    ┌──────────────────────┐
                    │  Usuario ejecuta     │
                    │  acción (ej: borrar) │
                    └──────────────────────┘
                            │
                    ┌───────▼─────────┐
                    │ 1. CLIENTE      │
                    │ usePermissions()│
                    │ ¿Tiene permiso? │
                    └───────┬─────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
       NO ❌                                   SÍ ✅
        │                                       │
        │                            ┌──────────▼──────────┐
        │                            │ 2. SERVIDOR        │
        │                            │ Firestore Rules    │
        │                            │ ¿Válido según rol? │
        │                            └──────────┬──────────┘
        │                                       │
        │                    ┌──────────────────┴──────────────────┐
        │                    │                                     │
        │                   NO ❌                                SÍ ✅
        │                    │                                     │
    ┌──▼────────┐         ┌──▼──────┐                        ┌────▼──────┐
    │ No mostrar │         │ Error   │                        │ Operación │
    │ botón en UI│         │ 403     │                        │ exitosa   │
    └───────────┘         │ Permission│                       └───────────┘
                           │ Denied   │
                           └──────────┘
```

---

## Cambio de Rol (Restricciones)

**Admin puede promover a user → admin:**
```typescript
const canChangeRole = (currentRole: string, targetRole: string) => {
  // ✅ Admin: user → admin
  if (currentRole === 'admin' && targetRole === 'admin') return true;
  
  // ❌ Admin: no puede cambiar a superadmin
  if (targetRole === 'superadmin') return false;
  
  // ✅ Superadmin: cualquier cambio
  if (currentRole === 'superadmin') return true;
  
  return false;
};
```

**En Firestore Rules:**
```
match /users/{userId} {
  allow update: if request.auth.token.role == 'superadmin' ||
                   (request.auth.token.role == 'admin' &&
                    request.resource.data.role in ['user', 'admin']);
}
```

---

## Auditoría (Futuro)

**Propuesta de colección `auditLogs`:**

```typescript
{
  id: "log_001",
  action: "DELETE_TERRITORY",
  userId: "uid_admin",
  targetId: "terr_001",      // Qué se modificó
  timestamp: 1713427200,
  changes: {
    before: { status: "active" },
    after: { status: "deleted" }
  }
}
```

**Acceso:**
- ❌ user
- ❌ admin
- ✅ superadmin

---

## Testing de Permisos

### Validar protección de rutas

```typescript
// En test
test('usuario normal no puede acceder a /admin', () => {
  const { getByText } = render(<App />);
  // Renderizar con rol 'user'
  // Intenta navegar a /admin
  // Debe redirigir a /
});

test('admin puede acceder a /admin', () => {
  // Renderizar con rol 'admin'
  // Navega a /admin
  // Debe mostrar contenido
});
```

### Validar Firestore Rules

**Usar emulator de Firebase:**
```bash
firebase emulators:start --only firestore
```

**Probar reglas:**
```typescript
// En test
it('user no puede eliminar territorio', async () => {
  await expectFirebaseError(
    () => deleteDoc(doc(db, 'territories', 'terr_001')),
    'permission-denied'
  );
});
```

---

## Checklist de Seguridad

- ✅ **Cliente:** Validar permisos con `usePermissions()` antes de mostrar botones
- ✅ **Servidor:** Cada operación tiene regla en `firestore.rules`
- ✅ **Datos:** No confiar en rol del cliente (siempre verificar en servidor)
- ✅ **Auditoría:** Registrar cambios críticos en colección `auditLogs`
- ✅ **Testing:** Probar permisos en ambos lados (cliente + Firestore)
- ✅ **Errores:** Mostrar mensajes claros cuando falla permiso
