# Flujo de Autenticación

Sesión, roles, rutas y ciclo de vida de autenticación.

---

## Sistema de Roles

| Rol | Permisos | Casos de uso |
|---|---|---|
| **user** | Leer territorios asignados, registrar visitas, ver perfil | Visitadores |
| **admin** | CRUD territorios y grupos, asignar territorios, promover a admin | Gestores |
| **superadmin** | Acceso total + cambiar roles + auditoría | Administrador principal |

---

## Ciclo de Vida de Sesión

```
┌─ INICIAL (No autenticado)
│
├─ LOGIN FLOW
│  ├─ Usuario entra email + password
│  ├─ authService.loginUser() valida en Firebase Auth
│  ├─ Se obtiene el rol desde Firestore
│  ├─ Datos guardados en AsyncStorage (persistencia)
│  ├─ useUser.userData se actualiza
│  └─ Se navega a (tabs)/* automáticamente
│
├─ REGISTRO FLOW
│  ├─ Usuario crea email + password + nombre (rol default: 'user')
│  ├─ createUserWithEmailAndPassword en Auth
│  ├─ Se crea doc en Firestore: users/{uid}
│  ├─ Datos cacheados en AsyncStorage
│  └─ Auto-login o redirige a login
│
├─ SESIÓN ACTIVA
│  ├─ auth.currentUser persiste automáticamente
│  ├─ usePermissions() valida rol en cada boot
│  ├─ Acceso a rutas (tabs)/* restringido a autenticados
│  └─ CRUD de datos respeta roles en cliente y servidor
│
├─ LOGOUT
│  ├─ authService.logout() → signOut(auth)
│  ├─ AsyncStorage limpia datos de sesión
│  ├─ Territorios y estado global se resetean
│  └─ Se navega a (auth)/login
│
└─ RECUPERACIÓN DE CONTRASEÑA
   ├─ Usuario ingresa email
   ├─ sendPasswordResetEmail() de Firebase
   ├─ Firebase envía email con link
   ├─ Usuario resetea y vuelve a login
```

---

## Persistencia de Sesión

```typescript
// En src/config/firebase.ts
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
// ✅ El usuario NO se desloguea aunque cierre la app
```

---

## Cambio de Roles

**Admin promoviendo usuario:**
- ✅ `user` → `admin` (permitido)
- ❌ `admin` → `superadmin` (no permitido, solo superadmin puede)

**Lado del usuario:**
- Cuando el rol cambia en Firestore, `usePermissions()` re-valida
- El UI se actualiza automáticamente
- Si pierde acceso, redirige automáticamente

---

## Manejo de Errores de Autenticación

| Error | Causa | Acción |
|---|---|---|
| `auth/user-not-found` | Email no existe | Sugerir registro |
| `auth/wrong-password` | Contraseña incorrecta | Opción: recuperar contraseña |
| `auth/email-already-in-use` | Email duplicado | Pedir otro email |
| `auth/weak-password` | Password < 6 caracteres | Mostrar requisitos |
| `auth/too-many-requests` | Rate limiting | Esperar 15-30 minutos |
| `auth/invalid-email` | Formato incorrecto | Validar antes de enviar |
| `Network error` | Sin conexión | Mostrar banner offline |

---

## Protección de Rutas

**Públicas** (`app/(auth)/`):
- `/login` — Entrada sin autenticación
- `/register` — Crear cuenta
- `/forgot-password` — Recuperar contraseña
- `/welcome` — Splash inicial
- `/splash` — Loading inicial

**Protegidas** (`app/(tabs)/`):
- `/` (index) — Territorios asignados (todos)
- `/profile` — Perfil del usuario (todos)
- `/territories` — Gestión (admin+)
- `/admin/*` — Secciones admin (admin+)

**Validación en código:**
```typescript
// app/(tabs)/_layout.tsx
const { isAdmin } = usePermissions();
const user = auth.currentUser;

if (!user) return <Redirect href="/(auth)/login" />;
if (pathname.startsWith('/admin') && !isAdmin) {
  return <Redirect href="/(tabs)" />;
}
```

---

## Archivos Clave

- `src/config/firebase.ts` — Configuración e inicialización
- `src/services/authService.ts` — Operaciones de Firebase Auth
- `src/services/userService.ts` — Gestión de roles
- `src/hooks/useUser.ts` — Estado y funciones de usuario
- `src/hooks/usePermissions.ts` — Validación de acceso
- `app/(auth)/*.tsx` — Pantallas públicas
- `app/(tabs)/_layout.tsx` — Protección de rutas
