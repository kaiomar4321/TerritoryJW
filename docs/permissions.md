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

**Ubicación:** `firestore.rules` (en raíz del proyecto) — este es el archivo real que se publica en Firebase Console, no solo un ejemplo. Además del rol, cada regla verifica que el documento pertenezca a tu misma congregación (`congregationId`) — ver [development-deployment.md](development-deployment.md) sección "Distribución Multi-Congregación" para el detalle de aislamiento.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function myData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    function myCongregationId() {
      return myData().congregationId;
    }

    function isAdmin() {
      return isSignedIn() && myData().role in ['admin', 'superadmin'];
    }

    function isSuperAdmin() {
      return isSignedIn() && myData().role == 'superadmin';
    }

    function inMyCongregation(data) {
      return isSignedIn() && data.congregationId == myCongregationId();
    }

    // Reglas por colección...
  }
}
```

**Nota importante:** `isAdmin()` y `isSuperAdmin()` leen el rol desde el documento propio en `users` (vía `get()`), no de un custom claim en el token — porque el proyecto no usa Cloud Functions para setear claims. Esto es más simple pero implica un `get()` extra por request; a la escala de una congregación no es un problema de costo/latencia real.

---

### Reglas por Colección

#### Users

```
match /users/{userId} {
  // Leer: uno mismo, o admin+ de tu misma congregación
  allow read: if isSignedIn() && (
    request.auth.uid == userId ||
    (isAdmin() && resource.data.congregationId == myCongregationId())
  );

  // Crear tu propio doc al registrarte:
  // - unirte a una congregación existente -> siempre role 'user'
  // - fundar una congregación nueva (tú la creaste) -> role 'superadmin'
  allow create: if isSignedIn() && request.auth.uid == userId && (
    request.resource.data.role == 'user' ||
    (request.resource.data.role == 'superadmin' &&
     get(/databases/$(database)/documents/congregations/$(request.resource.data.congregationId)).data.createdBy == request.auth.uid)
  );

  // Actualizar tus propios datos, sin tocar role ni congregationId
  allow update: if isSignedIn() && request.auth.uid == userId &&
    request.resource.data.role == resource.data.role &&
    request.resource.data.congregationId == resource.data.congregationId;

  // Cambiar el role de OTRO usuario de tu misma congregación
  allow update: if isSignedIn() && request.auth.uid != userId &&
    resource.data.congregationId == myCongregationId() &&
    request.resource.data.congregationId == resource.data.congregationId && (
      isSuperAdmin() ||
      (myData().role == 'admin' && request.resource.data.role == 'admin')
    );

  allow delete: if isSuperAdmin() && resource.data.congregationId == myCongregationId();
}
```

Nota clave: **nadie puede auto-asignarse un rol distinto de `user`** salvo en el instante de fundar su propia congregación (verificado con `get()` sobre el doc de `congregations`, comparando `createdBy` con el uid actual). Esto es lo que impide la escalación de privilegios que existía antes.

---

#### Territories / Groups / AvoidHouses

Mismo patrón en las tres: todo lector debe ser de la misma congregación que el documento; crear/editar requiere admin+; borrar requiere superadmin (avoidHouses también permite al creador editar/borrar lo suyo).

```
match /territories/{territoryId} {
  allow read: if inMyCongregation(resource.data);
  allow create, update: if isAdmin() && inMyCongregation(request.resource.data);
  allow delete: if isSuperAdmin() && inMyCongregation(resource.data);
}
```

---

#### Congregations

```
match /congregations/{congId} {
  // Cualquiera logueado puede leer (necesario para buscar por nombre al registrarse)
  allow read: if isSignedIn();

  // Fundar una congregación nueva: cualquiera logueado, siempre como su creador
  allow create: if isSignedIn() && request.resource.data.createdBy == request.auth.uid;

  // Editar/borrar: solo el superadmin de esa misma congregación
  allow update, delete: if isSuperAdmin() && congId == myCongregationId();
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
