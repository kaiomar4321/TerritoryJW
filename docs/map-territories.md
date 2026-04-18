# Lógica Geográfica y Polígonos

Renderizado de territorios en el mapa, gestión de coordenadas y geometría.

---

## Concepto de Territorios

Un **territorio** es un área geográfica delimitada por un **polígono** (conjunto de coordenadas).

```
Territory {
  id: "terr_001"
  name: "Centro Histórico"
  number: 42
  coordinates: [
    { latitude: 40.7128, longitude: -74.0060 },
    { latitude: 40.7138, longitude: -74.0050 },
    { latitude: 40.7118, longitude: -74.0070 }
  ]
  color: "rgba(0, 150, 255, 0.8)"
}
```

---

## Componente: TerritoryPolygons

**Ubicación:** `components/Map/TerritoryPolygons.tsx`

**Propósito:** Renderizar todos los territorios en el mapa y detectar interacciones.

```typescript
<TerritoryPolygons
  territories={territories}           // Array de territorios
  selectedTerritory={selected}        // Territorio resaltado
  onTerritoryPress={handleTerritoryPress}  // Click en polígono
  isAddingHouse={isAdding}           // ¿Modo añadir casa?
  onAddingHouse={handleAddHouse}     // Click para nueva casa
/>
```

### Características

**Renderizado optimizado:**
- ✅ `useMemo` para calcular status solo si cambian territorios
- ✅ `React.memo` para evitar re-renders innecesarios
- ✅ Comparación personalizada de props

**Interactividad:**
- ✅ Click en polígono: seleccionar territorio
- ✅ Click en modo "añadir casa": registrar coordenada
- ✅ Resaltado del territorio seleccionado

**Estilos:**
- ✅ Color según status (listo, visitado, pendiente, etc.)
- ✅ Opacidad: territorio seleccionado al 100%, otros al 50%
- ✅ Líneas más gruesas en territorio seleccionado

---

## Utilidades Geográficas

### `getPolygonCenter()` — Centro del polígono

```typescript
const center = getPolygonCenter(territory.coordinates);
// Devuelve: { latitude: 40.7123, longitude: -74.0057 }
```

**Lógica:**
1. Obtener latitudes y longitudes por separado
2. Calcular promedio de cada conjunto
3. Devolver punto central

**Uso:** Colocar marcador con número de territorio en el centro.

---

### Color según Status

```typescript
// El status de un territorio determina su color
const { status, colorHex } = getTerritoryStatus(territory);
// status: 'ready' | 'visited' | 'pending' | ...
// colorHex: '#00FF00' | '#FF0000' | ...

<Polygon
  fillColor={`${colorHex}55`}   // Hex + 2 dígitos de opacidad (0-ff)
  strokeColor={`${colorHex}ff`} // Color completo para borde
/>
```

---

## Tipos Geográficos

### `Coordinate` — Punto en el mapa

```typescript
interface Coordinate {
  latitude: number;   // -90 a 90
  longitude: number;  // -180 a 180
  altitude?: number;  // Opcional: altura en metros
  accuracy?: number;  // Opcional: precisión GPS en metros
}
```

---

### `Territory` — Territorio completo

```typescript
interface Territory {
  id: string;
  name: string;
  number: number;
  coordinates: Coordinate[];   // Mínimo 3 para polígono válido
  color: string;               // RGBA: "rgba(0, 150, 255, 0.8)"
  groupId?: string;
  createdBy: string;
  createdAt: any;
  lastModified: number;
  visitStartDate?: string;
  visitEndDate?: string;
  note?: string;
  couples?: number;
  hours?: number;
  synced?: boolean;
}
```

---

## Operaciones Geográficas

### Crear Territorio (flujo en mapa)

```
1. Usuario presiona "Crear territorio" en panel
   │
2. Mapa entra en modo "dibujo"
   │ ▼
3. Cada tap en el mapa registra una coordenada
   │ ▼
4. Se muestra línea provisional conectando puntos
   │ ▼
5. Cuando termina (mínimo 3 puntos), confirmar
   │ ▼
6. territoryService.saveTerritory(coordinates, userId)
```

**Validación:**
- ✅ Mínimo 3 coordenadas (polígono cerrado)
- ✅ Latitud entre -90 y 90
- ✅ Longitud entre -180 y 180
- ✅ Sin coordenadas duplicadas consecutivas

---

### Agregar Casa a Territorio

```
1. Usuario selecciona territorio
   │
2. Presiona "Agregar casa" → modo activo
   │ ▼
3. Tap en el mapa dentro del territorio
   │ ▼
4. Se registra coordenada exacta
   │ ▼
5. Formulario: dirección + razón de restricción
   │ ▼
6. houseService.addHouse(territoryId, address, reason, coords, userId)
```

---

## Optimizaciones de Renderizado

### Memoization de Status

```typescript
const territoriesWithStatus = useMemo(() => {
  return territories.map((territory) => ({
    id: territory.id,
    status: getTerritoryStatus(territory),
    colorHex: getTerritoryStatus(territory).colorHex,
  }));
}, [territories]);
// └─ Solo recalcula si `territories` cambia
```

### React.memo del componente completo

```typescript
const TerritoryPolygons = React.memo(
  TerritoryPolygonsComponent,
  (prevProps, nextProps) => {
    // Comparación personalizada
    // retorna true = no re-renderizar
    // retorna false = re-renderizar
    
    if (prevProps.territories.length !== nextProps.territories.length) return false;
    if (prevProps.selectedTerritory?.id !== nextProps.selectedTerritory?.id) return false;
    // ... más comparaciones
    
    return true;  // No cambió nada, no re-renderizar
  }
);
// └─ Evita renders innecesarios cuando props no cambian
```

---

## Colores y Estilos

### Formato RGBA en Mapas

```typescript
// RGBA con componente alpha (opacidad)
const color = `rgba(0, 150, 255, 0.8)`;  // Azul 80% opaco
const colorHex = '#0096FF';               // Equivalente en hex

// En mapa: hex + 2 dígitos alpha
const fillColor = `${colorHex}55`;        // #0096FF55 = 33% opaco
const strokeColor = `${colorHex}ff`;      // #0096FFff = 100% opaco
```

### Estados y Colores

| Estado | Color | Significado |
|---|---|---|
| `pending` | 🔴 Rojo | No visitado |
| `visited` | 🟢 Verde | Visitado recientemente |
| `ready` | 🟡 Amarillo | Listo para visita |
| `assigned` | 🔵 Azul | Asignado a grupo |

---

## Debugging de Mapas

### Ver coordenadas de un territorio

```typescript
useEffect(() => {
  if (selectedTerritory) {
    console.log('📍 Territorio seleccionado:', {
      name: selectedTerritory.name,
      center: getPolygonCenter(selectedTerritory.coordinates),
      coordCount: selectedTerritory.coordinates.length,
      coords: selectedTerritory.coordinates,
    });
  }
}, [selectedTerritory]);
```

### Validar polígono

```typescript
const isValidPolygon = (coords: Coordinate[]): boolean => {
  // Mínimo 3 puntos
  if (coords.length < 3) return false;
  
  // Latitud/longitud válidas
  return coords.every(c =>
    c.latitude >= -90 && c.latitude <= 90 &&
    c.longitude >= -180 && c.longitude <= 180
  );
};
```

---

## Consideraciones de Rendimiento

**Problema:** Renderizar 100+ territorios puede ralentizar el mapa

**Soluciones:**
1. ✅ Usar `React.memo` en componentes poligonales
2. ✅ Limitar territorios visibles por viewport
3. ✅ Usar `useMemo` para cálculos costosos
4. ✅ Evitar crear nuevos objetos en cada render

---

## Integraciones

### Con Ubicación del Usuario

```typescript
// Hook de ubicación
const { location } = useLocation();

// Mostrar posición en mapa
{location && (
  <Marker
    coordinate={location}
    title="Tu ubicación"
    pinColor="blue"
  />
)}
```

### Con Status de Territorio

```typescript
// Ver detalles en docs/map-territories.md - Operaciones Geográficas
// Cada territorio tiene un color basado en su status actual
// El componente TerritoryPolygons lo calcula automáticamente
```

### Con Casas a Evitar

```typescript
// Dentro de un territorio seleccionado, mostrar
{houses.map(house => (
  <Marker
    key={house.id}
    coordinate={house.coordinates}
    title={house.address}
    description={house.reason}
    pinColor="red"  // Rojo para casas a evitar
  />
))}
```
