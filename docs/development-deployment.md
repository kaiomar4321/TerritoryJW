# Desarrollo y Producción

Desde setup local hasta deployment en producción, incluyendo testing y debugging.

---

## 1️⃣ Setup de Desarrollo Local

### Prerequisitos

```bash
# Node.js 18+ y npm/yarn
node --version

# Expo CLI
npm install -g expo-cli

# EAS CLI (para builds y deployment)
npm install -g eas-cli

# Git
git --version

# Visual Studio Code con extensiones:
# - ES7+ React/Redux/React-Native snippets
# - Prettier - Code formatter
# - ESLint
# - Firebase Explorer
```

### Configuración Inicial

**1. Clonar y instalar dependencias:**
```bash
git clone <repo>
cd TerritoryJW
npm install
```

**2. Variables de ambiente:**
```bash
# Crear .env en raíz del proyecto
cp .env.example .env

# Rellenar con credenciales:
# EXPO_PUBLIC_FIREBASE_API_KEY=...
# EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
# etc.
```

**3. Verificar setup:**
```bash
npm run lint      # Verificar errores de código
npm run type-check # Verificar tipos TypeScript
npx expo doctor   # Verificar setup de Expo
```

### Iniciar en Desarrollo

```bash
# Terminal 1: Expo Metro Bundler
npm start

# Luego escanear QR con:
# - Expo Go app (iOS/Android)
# - O presionar 'i'/'a' para iOS/Android simulator
```

---

## 2️⃣ Debugging en Desarrollo

### Console Logging

```typescript
// ✅ Correcto
console.log('🔵 Estado:', items);
console.warn('⚠️ Advertencia:', error);
console.error('❌ Error:', error);

// ❌ No dejar debug
console.log('DEBUG INFO');
```

### Herramientas de Debugging

**Expo DevTools:**
```bash
# Presionar 'd' en terminal Metro
# Abre inspector interactivo
```

**Chrome DevTools:**
```bash
# En simulador iOS/Android
# Presionar 'Shift + m' para abrir menu de debug
# Seleccionar "Debug Remote JS"
```

**Firebase Emulator (para testing local):**
```bash
# Instalar emulator
npm install -g firebase-tools

# Iniciar emulator
firebase emulators:start

# En src/config/firebase.ts, usar emulator en dev:
if (__DEV__) {
  connectEmulatorDatabase(db, 'localhost', 8080);
  connectEmulatorAuth(auth, 'localhost', 9099);
}
```

**Ver logs de Firestore:**
```bash
# En Firebase Console → Firestore → Logs
# O Firebase CLI:
firebase functions:log
```

---

## 3️⃣ Testing en Local

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Solo un archivo
npm test -- useTerritory.test.ts

# Watch mode (re-ejecuta al guardar)
npm test -- --watch

# Coverage
npm test -- --coverage
```

### Estructura de Tests

**Ubicación:** `__tests__/` o `*.test.ts` al lado del código

```typescript
// src/hooks/__tests__/useTerritory.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useTerritory } from '../useTerritory';

describe('useTerritory', () => {
  it('debe cargar territorios', async () => {
    const { result } = renderHook(() => useTerritory());
    
    // Estado inicial
    expect(result.current.isLoading).toBe(true);
    
    // Esperar carga
    await act(async () => {
      // ...
    });
    
    expect(result.current.territories).toBeDefined();
  });
});
```

### Testing de Servicios

```typescript
// src/services/__tests__/territoryService.test.ts
import { territoryService } from '../territoryService';
import { db } from '~/src/config/firebase';

// Mock Firebase
jest.mock('~/src/config/firebase', () => ({
  db: jest.fn(),
}));

describe('territoryService', () => {
  it('debe obtener territorios', async () => {
    const result = await territoryService.getAll();
    expect(Array.isArray(result)).toBe(true);
  });
});
```

### Testing de Firestore Rules

**Usar Firebase Emulator Firestore + `@firebase/rules-unit-testing`:**

```typescript
// firestore.rules.test.ts
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'test-project',
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8'),
    },
  });
});

describe('Firestore Rules - Territories', () => {
  it('usuario no puede eliminar territorio', async () => {
    const userContext = testEnv.authenticatedContext('user123');
    const db = userContext.firestore();

    // Debe fallar
    await expect(
      db.collection('territories').doc('terr_001').delete()
    ).toBeDenied();
  });

  it('admin puede eliminar territorio', async () => {
    const adminContext = testEnv.authenticatedContext('admin123', {
      role: 'admin',
    });
    const db = adminContext.firestore();

    // Debe funcionar
    await expect(
      db.collection('territories').doc('terr_001').delete()
    ).toBeSuccessful();
  });
});
```

---

## 4️⃣ Build para Testing

### Preview Build (interno)

```bash
# Build para testear en dispositivo antes de release
eas build --platform ios --profile preview

# O ambas plataformas
eas build --platform all --profile preview

# Instalar en tu dispositivo (descarga link)
```

### APK/IPA Local

```bash
# Solo para Android (APK local, no subir a Google Play)
eas build --platform android --profile preview --local

# Instalar APK en emulador
adb install build-*.apk
```

---

## 5️⃣ Preparación para Producción

### Checklist Pre-Deployment

- ✅ **Código:** `npm run lint` sin errores
- ✅ **Tipos:** `npm run type-check` sin errores
- ✅ **Tests:** `npm test` pasando 100%
- ✅ **Secrets:** Verificar `.env.production` tiene credenciales correctas
- ✅ **Version:** Actualizar `app.json` version
- ✅ **Build:** Limpiar caché: `npm run clean` (si existe)
- ✅ **Firestore Rules:** Revisadas y testeadas
- ✅ **Permisos:** Revisar `app.json` permissions
- ✅ **Icons/Splash:** Actualizar para versión final

### Variables de Ambiente Producción

**`.env.production`** (nunca commitear):
```env
# Firebase Producción
EXPO_PUBLIC_FIREBASE_API_KEY=xxx
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=territoryapp.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=territory-app-prod
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=territory-app-prod.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
EXPO_PUBLIC_FIREBASE_APP_ID=xxx

# Configuración de app
EXPO_PUBLIC_API_URL=https://api.territoryapp.com
NODE_ENV=production
```

**En `src/config/firebase.ts`:**
```typescript
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  // ...
};

// En producción, desabilitar debug
if (!__DEV__) {
  console.log = () => {};  // Silenciar logs
}
```

---

## 6️⃣ Deployment a App Store / Google Play

### iOS (Apple App Store)

**1. Crear certificados en Apple Developer:**
```bash
# Generar certificados (primera vez)
eas credentials

# Seleccionar "iOS"
# EAS guiará por obtener certs de Apple
```

**2. Actualizar `app.json`:**
```json
{
  "expo": {
    "version": "1.0.0",
    "plugins": [
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static"
          }
        }
      ]
    ]
  }
}
```

**3. Build y upload:**
```bash
# Build (compila y sube a TestFlight/App Store)
eas build --platform ios --auto-submit

# O sin auto-submit (revisar manual antes)
eas build --platform ios
```

**4. En App Store Connect:**
- Subir screenshots y description
- Llenar metadata (keywords, categoría, etc.)
- Configurar precios y regiones
- Enviar a review

### Android (Google Play Store)

**1. Crear keystore:**
```bash
# Generar (primera vez)
eas credentials

# Seleccionar "Android"
# Crear keystore firmado
```

**2. Build y upload:**
```bash
# Build y auto-submit a Google Play
eas build --platform android --auto-submit

# O manual
eas build --platform android
```

**3. En Google Play Console:**
- Subir screenshots
- Llenar descripción
- Categoría y clasificación de contenido
- Política de privacidad
- Enviar a review (24-48 horas)

---

## 7️⃣ Monitoreo en Producción

### Errores y Crashes

**Firebase Crashlytics:**
```typescript
// En src/config/firebase.ts
import { initializeAppCheck, getToken } from 'firebase/app-check';

// Habilitar crash reporting
if (!__DEV__) {
  const isAppCheckEnabled = process.env.EXPO_PUBLIC_APP_CHECK_KEY;
  if (isAppCheckEnabled) {
    initializeAppCheck(app, {
      provider: new DebugAppCheckProviderFactory(),
    });
  }
}
```

**Ver crashes:**
- Firebase Console → Crashlytics
- Ver stack traces, dispositivos, versiones afectadas

### Performance

**Firebase Performance Monitoring:**
```typescript
import { initializePerformance } from 'firebase/performance';

const perf = initializePerformance(app);

// Trace personalizado
const trace = perf.trace('user_login_duration');
trace.start();
// ... login code
trace.stop();
```

**Ver métricas:**
- Firebase Console → Performance
- Latencia promedio, tasa de error, etc.

### Analítica

**Firebase Analytics:**
```typescript
import { logEvent } from 'firebase/analytics';

// Evento de creación de territorio
logEvent(analytics, 'territory_created', {
  territory_id: id,
  user_role: role,
  timestamp: new Date(),
});
```

**Ver datos:**
- Firebase Console → Analytics
- Eventos, usuarios activos, retención, etc.

---

## 8️⃣ Rollback y Hotfix

### Si hay un bug crítico en producción

**Opción 1: Hotfix rápido**
```bash
# 1. Crear rama desde main
git checkout -b hotfix/critical-bug

# 2. Fix
# ... código ...

# 3. Test local
npm test

# 4. Merge a main
git checkout main
git merge hotfix/critical-bug

# 5. Nuevo build
eas build --platform all --auto-submit

# 6. Versión incremental (1.0.1 → 1.0.2)
# Actualizar app.json version
```

**Opción 2: Rollback a versión anterior**
```bash
# En App Store Connect / Google Play Console
# Seleccionar versión anterior como "current"
# Usuarios nuevos recibirán versión anterior
```

---

## 9️⃣ Administración de Versiones

### Semantic Versioning

```
MAJOR.MINOR.PATCH

1.0.0
├─ MAJOR: Cambios incompatibles (requieren update obligatorio)
├─ MINOR: Nuevas features (compatible)
└─ PATCH: Bugfixes (compatible)
```

**Changelog:**
```
# Version 1.1.0 (2025-04-20)

## Features
- Agregar soporte para proyectos

## Bugs Fixes
- Corregir crash al crear territorio sin internet

## Breaking Changes
- Migración de BD (requerir update)
```

### Notificar a Usuarios

```typescript
// Mostrar banner si versión es old/critical
const isOutdatedVersion = (currentVersion, minimumVersion) => {
  return compareVersions(currentVersion, '<', minimumVersion);
};

// En app._layout.tsx
if (isOutdatedVersion(appVersion, MIN_VERSION_REQUIRED)) {
  return (
    <Alert
      title="Actualización Requerida"
      message="Por favor actualiza la app"
      onPress={() => Linking.openURL(APP_STORE_URL)}
    />
  );
}
```

---

## Checklist Final

**Antes de ir a Producción:**
- ✅ Tests pasando 100%
- ✅ Lint sin errores
- ✅ TypeScript strict sin errores
- ✅ Firestore Rules testeadas
- ✅ Variables `.env.production` configuradas
- ✅ Version actualizada en `app.json`
- ✅ Screenshots y metadata listos
- ✅ Crashlytics habilitado
- ✅ Analytics configurado
- ✅ Build preview testeado en dispositivo real

**Después de Deployar:**
- ✅ Monitorear Crashlytics (primeras 24h)
- ✅ Revisar Analytics
- ✅ QA en dispositivos reales (varias versiones iOS/Android)
- ✅ Preparar comunicado para usuarios (si es update importante)

---

## Comandos Útiles

```bash
# Limpiar cache de Expo
expo start --clear

# Limpiar node_modules y reinstalar
rm -rf node_modules && npm install

# Verificar espacio de disco
du -sh node_modules

# Build local
eas build --platform android --local

# Ver estado de builds
eas build:list

# Cancelar build
eas build:cancel <build-id>

# Revisar logs de build
eas build:view <build-id>
```

---

## Troubleshooting Común

| Problema | Solución |
|---|---|
| "Build fails: Module not found" | `npm install` y verificar imports |
| "Firebase auth error en prod" | Verificar `.env.production` y claves Firebase |
| "Permission denied iOS" | Revisar permisos en `app.json` |
| "App crasha al iniciar" | Revisar Crashlytics, habilitar debugger |
| "AsyncStorage vacío en prod" | Normak, se llena al usar app |
| "Offline no funciona" | Verificar `localDB` y sincronización |
| "EAS credentials error" | `eas credentials --reset` y regenrar |

---

## Recursos

- [Expo Deploy Guide](https://docs.expo.dev/deploy/publish-update/)
- [EAS Build Docs](https://docs.expo.dev/eas-update/introduction/)
- [Firebase Deployment](https://firebase.google.com/docs/functions/manage-functions)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
