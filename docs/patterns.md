# Patrones de Código

Convenciones, patrones y mejores prácticas.

---

## Convenciones de Nombrado

| Tipo | Patrón | Ejemplo |
|---|---|---|
| **Componentes** | PascalCase | `TerritoryCard.tsx` |
| **Hooks** | camelCase + prefijo `use` | `useTerritory.ts` |
| **Servicios** | camelCase + sufijo `Service` | `territoryService.ts` |
| **Tipos** | PascalCase + sufijo según tipo | `Territory.ts`, `UserRole.ts` |
| **Utilidades** | camelCase descriptivo | `formatDate.ts` |
| **Constantes** | UPPER_SNAKE_CASE | `API_TIMEOUT` |

---

## Estructuras Recomendadas

### Componentes

**Props con interface explícito:**
```typescript
// ✅ Correcto
interface TerritoryCardProps {
  territory: Territory;
  onPress: (id: string) => void;
  isSelected?: boolean;
}

export const TerritoryCard: React.FC<TerritoryCardProps> = ({
  territory,
  onPress,
  isSelected = false,
}) => {
  // ...
};
```

**Nunca usar `any`:**
```typescript
// ❌ Evitar
const handlePress = (data: any) => { /* ... */ };

// ✅ Usar unknown con narrowing
const handlePress = (data: unknown) => {
  if (typeof data === 'object' && data !== null && 'id' in data) {
    // Aquí data.id está seguro
  }
};
```

---

### Estilos con NativeWind

**Usar clases Tailwind directamente:**
```typescript
// ✅ Correcto
<View className="bg-white dark:bg-gray-900 p-4 rounded-lg">
  <Text className="text-gray-900 dark:text-white text-lg font-bold">
    Título
  </Text>
</View>

// ❌ No mezclar con StyleSheet
const styles = StyleSheet.create({
  container: { padding: 16 },
});
<View style={styles.container} className="bg-white" />
```

**Estilos condicionales:**
```typescript
// ✅ Usar template literals o cn()
const statusClassName = isActive
  ? 'bg-green-500 text-white'
  : 'bg-gray-200 text-gray-500';

<View className={`p-2 rounded ${statusClassName}`}>
  {/* ... */}
</View>
```

---

## Patrones de Datos

### Optimistic Updates — UI instantánea

```typescript
// En hook o componente
const updateTerritory = useCallback(
  async (id: string, updates: Partial<Territory>) => {
    // 1️⃣ Actualización optimista (al instante en UI)
    await mutateTerritories(
      async (current) => {
        const newData = current.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        );
        // 2️⃣ Confirmar en Firestore en background
        await territoryService.updateTerritory(id, updates);
        return newData;
      },
      { revalidate: false }  // No revalidar, usamos data conocida
    );
  },
  [mutateTerritories]
);
```

---

### Sincronización Inicial Única — `useRef`

```typescript
// Global o en hook
let hasInitializedSync = false;
const isSyncingRef = useRef(false);

useEffect(() => {
  if (hasInitializedSync || isSyncingRef.current) return;
  isSyncingRef.current = true;

  (async () => {
    // 1️⃣ Cargar desde caché local (instantáneo)
    const local = await territoryService.getLocalTerritories();
    mutateTerritories(local, false);

    // 2️⃣ Sincronizar en background
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

**Resultado:** UX rápido (datos al instante) + datos frescos en background.

---

### Operaciones Batch — Cambios múltiples

```typescript
// En servicio
async updateMultipleTerritories(updates: Partial<Territory>[]) {
  const promises = updates.map((u) =>
    this.updateTerritory(u.id!, u)
  );
  return Promise.all(promises);  // Paralelo, no secuencial
}

// En hook
const markAllReady = async () => {
  setIsBatchLoading(true);
  setBatchError(null);
  try {
    await territoryService.markAllAsReady(territories);
    await refreshTerritories();
  } catch (error) {
    setBatchError('No se pudieron marcar como listos');
  } finally {
    setIsBatchLoading(false);
  }
};
```

---

### Relaciones Bidireccionales — Mantener sincronización

```typescript
// Problema: territories.groupId y groups.territoryIds deben sincronizarse

// Solución: Actualizar AMBOS lados
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

---

### Suscripciones en Tiempo Real — Listeners activos

```typescript
// ✅ Para datos que cambian constantemente (casas, comentarios, etc.)
subscribeToHousesByTerritory(territoryId: string, callback) {
  const q = query(
    collection(db, 'avoidHouses'),
    where('territoryId', '==', territoryId)
  );

  // Escuchar cambios en tiempo real
  return onSnapshot(q, (snapshot) => {
    const houses = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
    callback(houses);
    mutate(getHousesKey(territoryId), houses, false);
  });
}

// En hook
useEffect(() => {
  if (!territoryId) return;
  
  // Suscribirse y limpiar automáticamente
  const unsubscribe = houseService.subscribeToHousesByTerritory(
    territoryId,
    (houses) => console.log('Casas actualizadas:', houses)
  );
  
  return () => unsubscribe();
}, [territoryId]);
```

**Ventaja:** Datos siempre frescos sin polling.  
**Costo:** Requiere conexión; se desuscribe si hay error.

---

## Patrones de Seguridad

### Validación en DOS Lugares

**1️⃣ Cliente (UX):** No mostrar opción si sin permiso

```typescript
const { isAdmin } = usePermissions();

return (
  <>
    {isAdmin && (
      <Button onPress={handleDelete} text="Eliminar" />
    )}
    {/* Si no es admin, botón no aparece */}
  </>
);
```

**2️⃣ Servidor (Firestore Rules):** Rechazar operaciones no autorizadas

```firestore
match /territories/{doc=**} {
  allow read: if request.auth != null;
  allow write: if hasRole('admin');
  allow delete: if hasRole('superadmin');
}
```

---

### Manejo Robusto de Errores

```typescript
const deleteTerritory = async (id: string) => {
  setIsDeleting(true);      // Mostrar spinner
  setDeleteError(null);      // Limpiar error previo

  try {
    await territoryService.deleteTerritory(id);
    // ✅ Éxito: mostrar toast
    Toast.show({ type: 'success', text1: 'Eliminado' });
  } catch (error) {
    setDeleteError('No se pudo eliminar el territorio');
    // ❌ Error: mostrar alerta
  } finally {
    setIsDeleting(false);    // Esconder spinner
  }
};

// En componente
{isDeleting && <Spinner />}
{deleteError && <AlertError message={deleteError} />}
<Button 
  onPress={deleteTerritory} 
  disabled={isDeleting}  // Deshabilitar mientras se procesa
  text="Eliminar"
/>
```

---

## Patrones de Interfaz

### Estructura de States en Hooks

```typescript
// Recomendado para todo hook que interactúa con datos
const {
  // Datos
  data,
  
  // Estados de carga
  isLoading,     // Cargando inicial?
  isFetching,    // Revalidando en background?
  
  // Errores
  error,
  batchError,    // Error en operaciones batch
  
  // Funciones
  mutate,        // Actualizar manualmente
  refresh,       // Revalidar datos
} = useHook();
```

---

## Patrones de Validación

### Validación de Formularios — Cliente + Servidor

**Cliente (UX):**
```typescript
const validateEmail = (email: string): string | null => {
  if (!email) return 'Email es requerido';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Email inválido';
  }
  return null;
};
```

**Servidor (Firebase Rules):**
```firestore
match /users/{userId} {
  allow create: if request.resource.data.email.matches('.*@.*');
}
```

---

## Cuándo NO usar ciertos patrones

| ❌ NO hacer | ✅ Alternativa | Razón |
|---|---|---|
| `fetch()` en componente | Usar hook + service | Separación de responsabilidades |
| Lógica negocio en pantalla | Usar hook + servicio | Reutilización y testabilidad |
| Estilos inline | Usar NativeWind + `cn()` | Consistencia y rendimiento |
| Context para datos | Usar hooks + services | Context es para estado visual |
| Suscripciones sin cleanup | Usar `return () => unsubscribe()` | Memory leaks |
| Firebase directo en UI | Siempre vía services | Seguridad y mantenibilidad |
