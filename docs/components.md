# Catálogo de Componentes

Referencia de componentes reutilizables organizados por función.

---

## Botones

### `SquareButton` — Botón cuadrado genérico
**Ubicación:** `components/Buttons/SquareButton.tsx`

```typescript
<SquareButton
  icon="settings"          // Ícono (react-native-vector-icons)
  text="Configurar"        // Etiqueta
  onPress={handlePress}
  disabled={false}
/>
```

---

### `SmallSquareButton` — Botón pequeño
**Ubicación:** `components/Buttons/SmallSquareButton.tsx`

```typescript
<SmallSquareButton
  icon="trash"
  size={24}               // Tamaño del ícono
  onPress={handleDelete}
/>
```

---

### `CustomButton` — Botón con estilos personalizados
**Ubicación:** `components/CustomButton.tsx`

```typescript
<CustomButton
  text="Guardar"
  onPress={handleSave}
  variant="primary"       // 'primary' | 'secondary'
  disabled={isLoading}
/>
```

---

## Entrada de Texto

### `CustomTextInput` — Input estilizado
**Ubicación:** `components/CustomTextInput.tsx`

```typescript
<CustomTextInput
  placeholder="Nombre del territorio"
  value={name}
  onChangeText={setName}
  error={nameError}       // Mensaje de error
  editable={!isLoading}
/>
```

---

## Filtros y Búsqueda

### `FilterButtons` — Botones de filtro rápido
**Ubicación:** `components/FilterButtons.tsx`

```typescript
<FilterButtons
  filters={['visited', 'pending', 'ready']}
  onSelectFilter={handleFilter}
  selected={activeFilter}
/>
```

---

### `FilterTag` — Etiqueta de filtro activo
**Ubicación:** `components/FilterTag.tsx`

```typescript
<FilterTag
  label="Visitados"
  onRemove={() => removeFilter('visited')}
/>
```

---

### `SortFilter` — Selector de orden
**Ubicación:** `components/SortFilter.tsx`

```typescript
<SortFilter
  options={['nombre', 'fecha', 'estado']}
  selected="nombre"
  onChange={setSort}
/>
```

---

### `FilterSection` — Sección de filtros
**Ubicación:** `components/FilterSection.tsx`

Agrupa múltiples filtros y tags.

---

### `FilterBottomSheet` — Panel inferior de filtros
**Ubicación:** `components/FilterBottomSheet.tsx`

Interfaz deslizable desde abajo para seleccionar filtros avanzados.

---

### `FilterSortBottomSheet` — Panel filtros + ordenamiento
**Ubicación:** `components/FilterSortBottomSheet.tsx`

Combina filtros y opciones de ordenamiento en un panel.

---

## Territorios

### `TerritoryHeader` — Encabezado de territorio
**Ubicación:** `components/TerritoryHeader.tsx`

```typescript
<TerritoryHeader
  territory={territory}
  onEdit={handleEdit}
/>
```

Muestra nombre, número y acciones principales.

---

### `TerritoryStats` — Estadísticas del territorio
**Ubicación:** `components/TerritoryStats.tsx`

```typescript
<TerritoryStats
  territory={territory}
  stats={{
    houses: 45,
    visited: 20,
    pending: 25,
  }}
/>
```

---

### `SelectedHouse` — Casa seleccionada
**Ubicación:** `components/SelectedHouse.tsx`

Vista detallada de una casa individual (razón, dirección, etc.)

---

### `HouseList` — Lista de casas
**Ubicación:** `components/HouseList.tsx`

```typescript
<HouseList
  houses={houses}
  territory={territory}
  onDelete={handleDeleteHouse}
/>
```

---

## Detalles de Territorio

**Ubicación:** `components/TerritoryDetails/`

### `TerritoryDetails` — Vista completa
**Archivo:** `TerritoryDetails.tsx`

Pantalla principal de un territorio.

---

### `TerritoryNormalView` — Vista lectura
**Archivo:** `TerritoryNormalView.tsx`

Display solo lectura de datos del territorio.

---

### `TerritoryEditForm` — Formulario edición
**Archivo:** `TerritoryEditForm.tsx`

```typescript
<TerritoryEditForm
  territory={territory}
  onSave={handleSave}
  loading={isSaving}
/>
```

---

### `TerritoryActionsHeader` — Encabezado con acciones
**Archivo:** `TerritoryActionsHeader.tsx`

Botones: editar, eliminar, compartir, etc.

---

### `VisitNote` — Nota de visita
**Archivo:** `VisitNote.tsx`

Registra observaciones sobre una visita.

---

### `AddHouseCard` — Card para añadir casa
**Archivo:** `AddHouseCard.tsx`

```typescript
<AddHouseCard
  territory={territory}
  onAddHouse={handleAdd}
/>
```

---

### `AddHouseForm` — Formulario de nueva casa
**Ubicación:** `components/AddHouseForm.tsx`

```typescript
<AddHouseForm
  territory={territory}
  initialCoordinates={coords}
  onSubmit={handleSubmitHouse}
  onCancel={handleCancel}
/>
```

---

## Asignaciones

### `AssignTerritoryModal` — Modal asignar territorio
**Ubicación:** `components/AssignTerritoryModal.tsx`

```typescript
<AssignTerritoryModal
  territory={territory}
  visible={isVisible}
  onAssign={handleAssign}
  onClose={handleClose}
/>
```

---

## Grupos (Admin)

### `CreateGroupModal` — Modal crear grupo
**Ubicación:** `components/CreateGroupModal.tsx`

```typescript
<CreateGroupModal
  visible={isVisible}
  onCreateGroup={handleCreate}
  onClose={handleClose}
/>
```

---

### `EditGroupModal` — Modal editar grupo
**Ubicación:** `components/Admin/EditGroupModal.tsx`

```typescript
<EditGroupModal
  group={group}
  visible={isVisible}
  onSave={handleSave}
  onClose={handleClose}
/>
```

---

## Mapa

### `TerritoryPolygons` — Polígonos en mapa
**Ubicación:** `components/Map/TerritoryPolygons.tsx`

```typescript
<TerritoryPolygons
  territories={territories}
  selectedTerritory={selected}
  onTerritoryPress={handleTerritoryPress}
  isAddingHouse={isAdding}
  onAddingHouse={handleAddHouse}
/>
```

---

## Utilidades

### `ThemedText` — Texto con tema
**Ubicación:** `components/ThemedText.tsx`

```typescript
<ThemedText className="text-gray-900 dark:text-white text-lg">
  Título
</ThemedText>
```

Se adapta automáticamente al tema claro/oscuro.

---

### `NetworkStatusBanner` — Banner de conectividad
**Ubicación:** `components/NetworkStatusBanner.tsx`

```typescript
{!isConnected && (
  <NetworkStatusBanner status="offline" />
)}
```

Muestra estado de red (online/offline).

---

## Patrón de Desarrollo de Componentes

### 1. Props con Interface

```typescript
interface MyComponentProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  onPress,
  disabled = false,
  variant = 'primary',
}) => {
  // ...
};
```

### 2. Sin Lógica de Negocio

```typescript
// ❌ NO hacer
const MyComponent = ({ territoryId }) => {
  const { data } = useTerritory(territoryId);  // ❌ Lógica aquí
  return <Text>{data.name}</Text>;
};

// ✅ Correcto
interface MyComponentProps {
  territory: Territory;
  onEdit: (id: string) => void;
}

const MyComponent: React.FC<MyComponentProps> = ({ territory, onEdit }) => {
  return <Text>{territory.name}</Text>;
};
```

### 3. Estilos con NativeWind

```typescript
// ✅ Usar clases Tailwind
<View className="bg-white dark:bg-gray-900 p-4 rounded-lg flex-1">
  <Text className="text-gray-900 dark:text-white font-bold">
    {title}
  </Text>
</View>

// ❌ No mezclar con StyleSheet
import { StyleSheet } from 'react-native';
const styles = StyleSheet.create({ ... });
<View style={styles.container} className="p-4" />  // ❌ No hacer
```

### 4. Memoization para Optimización

```typescript
// Para componentes que usan arrays o objetos complejos
export const MyComponent = React.memo(
  ({ items, onPress }: Props) => {
    return (
      <FlatList
        data={items}
        renderItem={/* ... */}
        keyExtractor={(item) => item.id}
      />
    );
  }
);
```

---

## Ubicación de Nuevos Componentes

**Componentes globales reutilizables:**
```
components/
  ├── MyComponent.tsx
  ├── MyFolder/
  │   └── MyNestedComponent.tsx
```

**Componentes específicos de admin:**
```
components/Admin/
  ├── MyAdminComponent.tsx
```

**Componentes específicos de mapa:**
```
components/Map/
  ├── MyMapComponent.tsx
```

---

## Testing y Documentación

Cada componente debería tener:
- ✅ Props tipados con interface
- ✅ Comentarios de uso si es complejo
- ✅ Ejemplo en Storybook (futuro)
- ❌ Sin dependencias de servicios
- ❌ Sin estado global, solo props
