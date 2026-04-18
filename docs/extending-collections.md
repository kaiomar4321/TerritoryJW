# Agregar una Nueva Colección

Guía paso a paso para crear una colección nueva en Firestore con toda la arquitectura: tipo, service, hook, offline y permisos.

---

## Vista General del Proceso

```
1. Definir Tipo TypeScript
   ↓
2. Crear Service (CRUD en Firebase)
   ↓
3. Crear Hook (orquestar service + estado)
   ↓
4. Implementar Offline (localDB + sync)
   ↓
5. Agregar Firestore Rules
   ↓
6. Consumir en Pantalla
```

---

## 1️⃣ Definir Tipo TypeScript

**Ubicación:** `src/types/MiColeccion.ts`

```typescript
export interface MiColeccion {
  // Identificadores
  id: string;                    // Document ID de Firestore
  
  // Datos principales
  nombre: string;                // Campo requerido
  descripcion?: string;          // Campo opcional
  
  // Relaciones
  userId: string;                // FK a users
  parentId?: string;             // FK a otra colección (si aplica)
  
  // Metadata
  createdBy: string;             // UID del creador
  createdAt: number | string;    // Timestamp
  lastModified: number;          // Timestamp UNIX
  synced?: boolean;              // Control de sincronización offline
}
```

**Validaciones:**
- ✅ Incluir siempre `id`, `createdAt`, `createdBy`
- ✅ FK con nombre descriptivo (ej: `userId`, `parentId`)
- ✅ Campo `synced` si va offline
- ❌ No incluir datos derivados (calcularlos en el hook)

---

## 2️⃣ Crear Service

**Ubicación:** `src/services/miColeccionService.ts`

### CRUD Básico

```typescript
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { MiColeccion } from '~/types/MiColeccion';

const COLLECTION_NAME = 'miColeccion';  // Nombre en Firestore

export const miColeccionService = {
  // ✅ LEER UNO
  async getById(id: string): Promise<MiColeccion | null> {
    try {
      const snap = await getDoc(doc(db, COLLECTION_NAME, id));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as MiColeccion;
    } catch (error) {
      console.error('Error obteniendo documento:', error);
      throw error;
    }
  },

  // ✅ LEER TODOS
  async getAll(): Promise<MiColeccion[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      return snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as MiColeccion[];
    } catch (error) {
      console.error('Error obteniendo documentos:', error);
      throw error;
    }
  },

  // ✅ LEER CON FILTRO
  async getByUserId(userId: string): Promise<MiColeccion[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as MiColeccion[];
    } catch (error) {
      console.error('Error obteniendo por userId:', error);
      throw error;
    }
  },

  // ✅ CREAR
  async create(data: Omit<MiColeccion, 'id'>): Promise<MiColeccion> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...data,
        createdAt: new Date(),
        lastModified: Date.now(),
      });
      return { id: docRef.id, ...data } as MiColeccion;
    } catch (error) {
      console.error('Error creando documento:', error);
      throw error;
    }
  },

  // ✅ ACTUALIZAR
  async update(id: string, updates: Partial<MiColeccion>): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, id), {
        ...updates,
        lastModified: Date.now(),
      });
    } catch (error) {
      console.error('Error actualizando documento:', error);
      throw error;
    }
  },

  // ✅ ELIMINAR
  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error('Error eliminando documento:', error);
      throw error;
    }
  },
};
```

**Características:**
- ✅ Manejo de errores con try/catch
- ✅ Tipado completo
- ✅ Actualiza `lastModified` automáticamente
- ✅ Query con `where` para filtros comunes
- ❌ No tiene estado propio
- ❌ No devuelve promesas con lógica de UI

---

## 3️⃣ Crear Hook

**Ubicación:** `src/hooks/useMiColeccion.ts`

```typescript
import { useCallback, useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { miColeccionService } from '~/services/miColeccionService';
import { useUser } from './useUser';
import { MiColeccion } from '~/types/MiColeccion';

export const useMiColeccion = () => {
  const { userData } = useUser();
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);
  
  let hasInitializedSync = false;
  const isSyncingRef = useRef(false);

  // ✅ Clave única para SWR
  const key = userData ? `miColeccion/${userData.uid}` : null;

  // ✅ Fetcher: obtener datos de Firestore
  const fetcher = useCallback(async () => {
    if (!userData?.uid) return [];
    // Decidir según necesidad:
    // - Si offline crítico: usar localDB + sync
    // - Si solo lectura: usar getData directo
    return miColeccionService.getByUserId(userData.uid);
  }, [userData?.uid]);

  // ✅ SWR: cache + revalidación
  const { data: items = [], isLoading, error, mutate } = useSWR(
    key,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 60000,  // 1 minuto
    }
  );

  // ✅ Sincronización inicial única
  useEffect(() => {
    if (hasInitializedSync || isSyncingRef.current || !userData) return;
    isSyncingRef.current = true;

    (async () => {
      try {
        const synced = await fetcher();
        await mutate(synced, false);
        hasInitializedSync = true;
      } catch (error) {
        console.warn('Sincronización fallida:', error);
      }
    })();
  }, [userData, fetcher, mutate]);

  // ✅ CREAR
  const create = useCallback(
    async (data: Omit<MiColeccion, 'id' | 'createdAt' | 'createdBy'>) => {
      if (!userData) throw new Error('Usuario no autenticado');

      setIsBatchLoading(true);
      setBatchError(null);

      try {
        const newItem = await miColeccionService.create({
          ...data,
          createdBy: userData.uid,
        } as Omit<MiColeccion, 'id'>);

        // Optimistic update
        await mutate([...items, newItem], false);
        return newItem;
      } catch (error) {
        setBatchError('Error creando elemento');
        throw error;
      } finally {
        setIsBatchLoading(false);
      }
    },
    [userData, items, mutate]
  );

  // ✅ ACTUALIZAR (Optimistic)
  const update = useCallback(
    async (id: string, updates: Partial<MiColeccion>) => {
      // 1️⃣ Optimistic update
      const oldData = items;
      const newData = items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      );
      await mutate(newData, false);

      try {
        // 2️⃣ Confirmar en Firestore
        await miColeccionService.update(id, updates);
      } catch (error) {
        // ❌ Revertir
        await mutate(oldData, false);
        setBatchError('Error actualizando elemento');
        throw error;
      }
    },
    [items, mutate]
  );

  // ✅ ELIMINAR
  const remove = useCallback(
    async (id: string) => {
      setIsBatchLoading(true);
      setBatchError(null);

      try {
        await miColeccionService.delete(id);
        await mutate(items.filter((item) => item.id !== id), false);
      } catch (error) {
        setBatchError('Error eliminando elemento');
        throw error;
      } finally {
        setIsBatchLoading(false);
      }
    },
    [items, mutate]
  );

  // ✅ REFRESCAR
  const refresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

  return {
    // Datos
    items,

    // Estados de carga
    isLoading,
    isBatchLoading,

    // Errores
    error,
    batchError,

    // Funciones
    create,
    update,
    remove,
    refresh,
    mutate,
  };
};
```

**Características:**
- ✅ Sincronización inicial única con `useRef`
- ✅ Optimistic updates (UI instantánea)
- ✅ Estados de carga y error separados
- ✅ Integrado con `useUser` para contexto
- ✅ Típado completo

---

## 4️⃣ Implementar Offline (Opcional)

### Si es crítico que funcione offline:

**Ubicación:** `src/services/miColeccionService.ts` (agregar métodos)

```typescript
import { localDB } from './localDB';

const LOCAL_KEY = 'miColeccion';  // Clave en AsyncStorage

export const miColeccionService = {
  // ... métodos anteriores ...

  // ✅ LEER LOCAL
  async getLocalItems(): Promise<MiColeccion[]> {
    return localDB.getCollection<MiColeccion>(LOCAL_KEY);
  },

  // ✅ GUARDAR LOCAL
  async saveLocal(items: MiColeccion[]): Promise<void> {
    await localDB.saveCollection(LOCAL_KEY, items);
  },

  // ✅ SINCRONIZAR
  async syncAll(): Promise<MiColeccion[]> {
    try {
      // 1️⃣ Obtener datos frescos de Firestore
      const remote = await this.getAll();

      // 2️⃣ Guardar en local
      await this.saveLocal(remote);

      return remote;
    } catch (error) {
      console.warn('Sync fallido, usando local:', error);
      // Devolver datos locales si falla
      return this.getLocalItems();
    }
  },
};
```

**En el hook, cambiar fetcher:**

```typescript
const fetcher = useCallback(async () => {
  if (!userData?.uid) return [];
  
  // 1️⃣ Cargar desde local (instantáneo)
  const local = await miColeccionService.getLocalItems();
  
  // 2️⃣ Sincronizar en background
  try {
    const synced = await miColeccionService.syncAll();
    // Solo los del usuario actual
    return synced.filter((item) => item.userId === userData.uid);
  } catch {
    // Si falla, usar local
    return local.filter((item) => item.userId === userData.uid);
  }
}, [userData?.uid]);
```

---

## 5️⃣ Agregar Firestore Rules

**Ubicación:** `firestore.rules`

```firestore
match /{database}/documents {
  // Función helper
  function hasRole(role) {
    return request.auth.token.role == role;
  }

  // Tu colección
  match /miColeccion/{docId} {
    // Leer: usuario que lo creó o admin
    allow read: if request.auth != null &&
                   (resource.data.createdBy == request.auth.uid ||
                    hasRole('admin'));

    // Crear: usuario autenticado
    allow create: if request.auth != null &&
                     request.resource.data.createdBy == request.auth.uid;

    // Actualizar: creador o admin
    allow update: if request.auth != null &&
                     (resource.data.createdBy == request.auth.uid ||
                      hasRole('admin'));

    // Eliminar: creador o admin
    allow delete: if request.auth != null &&
                     (resource.data.createdBy == request.auth.uid ||
                      hasRole('admin'));
  }
}
```

---

## 6️⃣ Consumir en Pantalla

**Ubicación:** `app/(tabs)/miPantalla.tsx` (o componente)

```typescript
import { useMiColeccion } from '~/hooks/useMiColeccion';
import { View, FlatList, Text, Alert } from 'react-native';
import { CustomButton } from '~/components/CustomButton';

export default function MiPantallaScreen() {
  const {
    items,
    isLoading,
    isBatchLoading,
    batchError,
    create,
    update,
    remove,
  } = useMiColeccion();

  // ✅ Crear elemento
  const handleCreate = async () => {
    try {
      await create({
        nombre: 'Nuevo elemento',
        descripcion: 'Descripción aquí',
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear');
    }
  };

  // ✅ Editar elemento
  const handleEdit = async (id: string) => {
    try {
      await update(id, { nombre: 'Nombre actualizado' });
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar');
    }
  };

  // ✅ Eliminar elemento
  const handleDelete = async (id: string) => {
    try {
      await remove(id);
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar');
    }
  };

  if (isLoading) return <Text>Cargando...</Text>;

  return (
    <View className="flex-1 p-4">
      {batchError && (
        <Text className="text-red-500 mb-4">{batchError}</Text>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="bg-white p-4 rounded-lg mb-2">
            <Text className="font-bold">{item.nombre}</Text>
            <Text className="text-gray-600">{item.descripcion}</Text>

            <View className="flex-row gap-2 mt-2">
              <CustomButton
                text="Editar"
                onPress={() => handleEdit(item.id)}
                disabled={isBatchLoading}
              />
              <CustomButton
                text="Eliminar"
                onPress={() => handleDelete(item.id)}
                disabled={isBatchLoading}
              />
            </View>
          </View>
        )}
      />

      <CustomButton
        text="Crear"
        onPress={handleCreate}
        disabled={isBatchLoading}
      />
    </View>
  );
}
```

---

## Checklist Completo

- ✅ **Tipo TypeScript**: `src/types/MiColeccion.ts`
- ✅ **Service**: `src/services/miColeccionService.ts`
  - ✅ `getById()`, `getAll()`, `getByFilter()`
  - ✅ `create()`, `update()`, `delete()`
  - ✅ Manejo de errores
- ✅ **Hook**: `src/hooks/useMiColeccion.ts`
  - ✅ SWR con `useSWR`
  - ✅ Sincronización inicial única
  - ✅ Optimistic updates
  - ✅ Estados de carga y error
- ✅ **Offline** (si crítico):
  - ✅ `getLocal()`, `saveLocal()`, `syncAll()`
  - ✅ Fallback a local si falla sync
- ✅ **Firestore Rules**:
  - ✅ Read, Create, Update, Delete con validaciones
- ✅ **Consumo en pantalla**:
  - ✅ Usar hook
  - ✅ Manejo de errores
  - ✅ Estados de loading

---

## Decisiones Rápidas

| Pregunta | Respuesta |
|---|---|
| ¿Agregar offline? | Sí si: datos críticos, uso en terreno, frecuente acceso. No si: datos de admin, lectura única. |
| ¿Usar optimistic updates? | Sí para ediciones rápidas (UI instantánea). No para operaciones que pueden fallar (eliminar). |
| ¿Crear subcollections? | Solo si relación 1:many muy clara. Preferir FK simple. |
| ¿Indexar campos? | Sí si: queries complejas, muchos documentos. Firestore lo sugiere automáticamente. |

---

## Ejemplo Real: Agregar "Proyectos"

Supongamos que quieres una colección de proyectos para cada usuario:

**1. Tipo:**
```typescript
// src/types/Project.ts
export interface Project {
  id: string;
  name: string;
  description: string;
  userId: string;
  createdBy: string;
  createdAt: number;
  lastModified: number;
  synced: boolean;
}
```

**2. Service:**
```typescript
// src/services/projectService.ts
export const projectService = {
  async getByUserId(userId: string) {
    const q = query(
      collection(db, 'projects'),
      where('userId', '==', userId)
    );
    return (await getDocs(q)).docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
  },
  async create(data) { /* ... */ },
  async update(id, data) { /* ... */ },
  async delete(id) { /* ... */ },
};
```

**3. Hook:**
```typescript
// src/hooks/useProjects.ts
export const useProjects = () => {
  const { userData } = useUser();
  const { data: projects = [], mutate } = useSWR(
    userData ? `projects/${userData.uid}` : null,
    () => projectService.getByUserId(userData.uid)
  );
  // ... create, update, delete
};
```

**4. Pantalla:**
```typescript
// app/(tabs)/projects.tsx
export default function ProjectsScreen() {
  const { projects, create } = useProjects();
  // Renderizar projects
}
```

¡Listo! Colección nueva siguiendo la arquitectura.
