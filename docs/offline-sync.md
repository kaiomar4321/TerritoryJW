# Estrategia de Cache y Sincronización Offline

Cómo funciona la persistencia local y sincronización con Firestore.

---

## Capas de Almacenamiento

```
┌───────────────────────────────────┐
│   1. MEMORIA (SWR)                │  ← Más rápido
│   Datos en RAM durante sesión     │
└───────────────────────────────────┘
           ▲
           │ (revalidar en background)
           │
┌───────────────────────────────────┐
│   2. AsyncStorage (localDB)       │  ← Rápido
│   Persistencia local en dispositivo│
└───────────────────────────────────┘
           ▲
           │ (sincronizar)
           │
┌───────────────────────────────────┐
│   3. FIRESTORE (Firebase)         │  ← Fuente de verdad
│   Base de datos remota            │
└───────────────────────────────────┘
```

---

## Flujos de Lectura

### Lectura Offline-First (normal)

```
1. App inicia
   │
2. useTerritory() llama a getLocalTerritories()
   │ ▼
   ├─ Busca en AsyncStorage (instantáneo)
   ├─ Renderiza UI con datos locales
   │
3. En background, sincronizar con Firestore
   │ ▼
   ├─ territoryService.syncAll()
   ├─ Obtiene datos frescos
   ├─ Actualiza AsyncStorage
   └─ UI se actualiza con nueva data

   RESULTADO: UX rápido (datos locales) + datos frescos
```

---

### Lectura Online-Only (datos no críticos)

```
// Para datos que NO necesitan funcionar offline
// Ej: lista de congregaciones, datos de admin

const { data: congregations } = useOfflineSWR(
  'congregations',
  async () => {
    const snap = await getDocs(collection(db, 'congregations'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
);

   RESULTADO: Datos frescos, sin caché persistente
```

---

## Flujos de Escritura

### Optimistic Update (lo más rápido)

```
1. Usuario presiona "Guardar"
   │
2. Hook actualiza UI inmediatamente
   │ ▼
   ├─ Territory.status = "ready" (en RAM)
   ├─ Renderiza cambio al usuario
   │
3. En background, enviar a Firestore
   │ ▼
   ├─ territoryService.updateTerritory(id, updates)
   └─ Si falla: revalidar para revertir cambios

   RESULTADO: El usuario ve el cambio al instante
```

**Implementación:**
```typescript
const updateTerritory = async (id: string, updates: Partial<Territory>) => {
  // 1️⃣ Actualizar local (optimistic)
  const oldData = territories;
  const newData = territories.map(t =>
    t.id === id ? { ...t, ...updates } : t
  );
  mutateTerritories(newData, false);

  try {
    // 2️⃣ Confirmar en Firestore
    await territoryService.updateTerritory(id, updates);
  } catch (error) {
    // ❌ Error: revertir
    mutateTerritories(oldData, false);
  }
};
```

---

### Escritura Normal (con confirmación)

```
1. Usuario presiona "Guardar"
   │
2. Mostrar spinner
   │ ▼
3. territoryService.createTerritory(data)
   │ ▼
   ├─ Enviar a Firestore
   ├─ Esperar confirmación
   │
4. Si éxito:
   ├─ Actualizar AsyncStorage
   ├─ Actualizar estado en memoria
   └─ Esconder spinner + mostrar toast
   
   Si error:
   ├─ Mostrar alerta
   └─ Permitir reintentos
```

---

## Estrategia por Tipo de Dato

### 1. Datos Críticos Offline (Territorios, Grupos)

**Estrategia:** `localDB` + Sincronización bidireccional

```typescript
// Hook
const { territories } = useTerritory();
// └─ Lee desde AsyncStorage al iniciar
// └─ Sincroniza con Firestore en background
// └─ Permite operaciones offline (crear, editar, eliminar)

// Servicio
const territoryService = {
  async getLocalTerritories() {
    return localDB.getCollection<Territory>('territories');
  },

  async syncAll() {
    // 1️⃣ Obtener datos frescos
    const remote = await getDocs(collection(db, 'territories'));
    const territories = remote.docs.map(/* ... */);
    
    // 2️⃣ Guardar en local
    await localDB.saveCollection('territories', territories);
    
    return territories;
  },

  async updateTerritory(id: string, updates: Partial<Territory>) {
    // 1️⃣ Actualizar en Firestore (fuente de verdad)
    await updateDoc(doc(db, 'territories', id), updates);
    
    // 2️⃣ Actualizar en local
    const current = await this.getLocalTerritories();
    const updated = current.map(t =>
      t.id === id ? { ...t, ...updates } : t
    );
    await localDB.saveCollection('territories', updated);
  },
};
```

**Ventajas:**
- ✅ Funciona completamente offline
- ✅ Datos siempre disponibles
- ✅ Sincronización automática cuando hay conexión

---

### 2. Datos de Lectura Frecuente (Casas)

**Estrategia:** Suscripción en tiempo real + SWR

```typescript
// Service
const houseService = {
  subscribeToHousesByTerritory(territoryId: string, callback) {
    return onSnapshot(
      query(collection(db, 'avoidHouses'),
        where('territoryId', '==', territoryId)
      ),
      (snapshot) => {
        const houses = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        }));
        callback(houses);
      }
    );
  },
};

// Hook
const { houses } = useHouses(territoryId);
// └─ Escucha cambios en tiempo real
// └─ Actualiza UI instantáneamente
```

**Ventajas:**
- ✅ Datos siempre frescos (sin polling)
- ✅ Múltiples usuarios ven cambios al instante
- ❌ Requiere conexión activa

---

### 3. Datos de Sesión (Usuario, Autenticación)

**Estrategia:** `AsyncStorage` + Persistencia de Firebase Auth

```typescript
// En src/config/firebase.ts
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
// ✅ Firebase Auth automáticamente persiste en AsyncStorage
// ✅ Usuario no se desloguea aunque cierre app

// Hook
const { userData } = useUser();
// └─ Datos del usuario en AsyncStorage
// └─ Refrescados al iniciar app
```

---

## Gestión de Caché

### `localDB` — API simple para AsyncStorage

```typescript
// Leer colección completa
const territories = await localDB.getCollection<Territory>('territories');
// └─ Devuelve array vacío si no existe o hay error

// Guardar colección
await localDB.saveCollection('territories', updatedArray);
// └─ Siempre guarda como array JSON
```

**Características:**
- ✅ Interfaz simple y consistente
- ✅ Manejo automático de errores
- ✅ Tipado con generics
- ✅ Validación: solo guarda arrays

---

### `useOfflineSWR` — Hook genérico cache + sincronización

```typescript
const { data, isLoading, error, mutate } = useOfflineSWR<T>(
  'firestore:territories',        // Clave única
  async () => {
    // Fetcher: cómo obtener datos de Firestore
    return territoryService.syncAll();
  },
  {
    ttl: 1000 * 60 * 60 * 24,     // Cache por 24 horas
    revalidateOnFocus: true,       // Revalidar al volver a app
  }
);
```

**Beneficios:**
- ✅ Datos en AsyncStorage
- ✅ TTL configurable
- ✅ Revalidación en background
- ✅ SWR nativo (deduplicación, fallback)

---

## Sincronización Bidireccional

### Problema: FK en ambos lados

```
territories.groupId ↔ groups.territoryIds

Cuando asignamos un territorio a un grupo:
  ├─ Actualizar: territories.groupId = groupId
  └─ Actualizar: groups.territoryIds.push(territoryId)

Si solo actualizamos uno, se pierde la consistencia.
```

### Solución: Actualizar ambos lados

```typescript
const assignTerritory = async (groupId: string, territoryId: string) => {
  // 1️⃣ Actualizar grupo
  const group = await getGroup(groupId);
  if (!group.territoryIds.includes(territoryId)) {
    await updateDoc(
      doc(db, 'groups', groupId),
      { territoryIds: [...group.territoryIds, territoryId] }
    );
  }

  // 2️⃣ Actualizar territorio
  await updateDoc(
    doc(db, 'territories', territoryId),
    { groupId }
  );

  // 3️⃣ Actualizar caché local
  const local = await localDB.getCollection<Territory>('territories');
  const updated = local.map(t =>
    t.id === territoryId ? { ...t, groupId } : t
  );
  await localDB.saveCollection('territories', updated);
};
```

---

## Estrategia ante Desconexión

### Detección de Red

```typescript
const { isConnected } = useNetworkStatus();

// Mostrar banner
{!isConnected && (
  <NetworkStatusBanner status="offline" />
)}
```

### Operaciones Offline

```typescript
// Cuando no hay conexión:
// ✅ Leer datos: devuelve AsyncStorage
// ✅ Crear/editar: guarda localmente, sincroniza después
// ❌ No muestra datos en tiempo real (sin listener)
// ❌ No sincroniza automáticamente
```

### Recuperación tras Reconexión

```typescript
useEffect(() => {
  if (!isConnected) return;
  
  // Cuando reconecta:
  // 1️⃣ Sincronizar territorios
  refresh();
  
  // 2️⃣ Revalidar datos sensibles
  mutateUser();
  mutateGroups();
}, [isConnected]);
```

---

## Decisiones Rápidas

| Datos | ¿Offline? | Tipo de Sync | Caché | Hook |
|---|---|---|---|---|
| Territorios | ✅ Sí | Bidireccional | localDB | `useTerritory()` |
| Grupos | ✅ Sí | Bidireccional | localDB | `useGroup()` |
| Usuario actual | ✅ Sí | Sesión | AsyncStorage | `useUser()` |
| Casas | ❌ No | Tiempo real | SWR | `useHouses()` |
| Congregaciones | ❌ No | SWR simple | Memoria | `useCongregation()` |

---

## Debugging

### Ver datos locales en consola

```typescript
// Durante desarrollo
useEffect(() => {
  (async () => {
    const local = await AsyncStorage.getItem('territories');
    console.log('📦 LocalDB territories:', JSON.parse(local || '[]'));
  })();
}, []);
```

### Limpiar caché (desarrollo/testing)

```typescript
// En useUser después del logout
await AsyncStorage.removeItem('territories');
await AsyncStorage.removeItem('groups');
```
