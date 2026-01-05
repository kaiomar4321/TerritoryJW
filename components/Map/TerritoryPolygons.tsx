import React, { useMemo } from 'react';
import { Polygon, Marker } from 'react-native-maps';
import { View } from 'react-native';
import { getTerritoryStatus } from '~/utils/territoryStatus';
import { getPolygonCenter } from '~/utils/mapUtils';
import { Territory } from '~/types/Territory';
import ThemedText from '../ThemedText';

type TerritoryPolygonsProps = {
  territories: Territory[];
  selectedTerritory: Territory | null;
  onTerritoryPress: (territory: Territory) => void;
  isAddingHouse: boolean;
  onAddingHouse: (isAdding: boolean, coordinate: any) => void;
};

const TerritoryPolygonsComponent: React.FC<TerritoryPolygonsProps> = ({
  territories,
  selectedTerritory,
  onTerritoryPress,
  isAddingHouse,
  onAddingHouse,
}) => {
  // Memoizar el cálculo de qué territorio se debe resaltar
  const selectedTerritoryId = useMemo(() => selectedTerritory?.id, [selectedTerritory?.id]);
  const hasSelectedTerritory = useMemo(() => selectedTerritory !== null, [selectedTerritory]);

  // Memoizar el cálculo de status para cada territorio
  // Esto previene que getTerritoryStatus se llame innecesariamente
  const territoriesWithStatus = useMemo(() => {
    return territories.map((territory) => ({
      id: territory.id,
      status: getTerritoryStatus(territory),
      colorHex: getTerritoryStatus(territory).colorHex,
    }));
  }, [territories]);

  return (
    <>
      {territories.map((territory) => {
        const statusData = territoriesWithStatus.find((t) => t.id === territory.id);
        const isCurrentSelected = selectedTerritoryId === territory.id;
        const shouldDimTerritory = hasSelectedTerritory && !isCurrentSelected;
        const baseOpacity = shouldDimTerritory ? '20' : '55';

        return (
          <React.Fragment key={territory.id}>
            <Polygon
              coordinates={territory.coordinates}
              strokeColor={`${statusData?.colorHex}${baseOpacity + 20}`}
              strokeWidth={isCurrentSelected ? 3 : 1}
              fillColor={`${statusData?.colorHex}${baseOpacity}`}
              tappable
              onPress={(e) => {
                if (!isAddingHouse) {
                  onTerritoryPress(territory);
                } else {
                  onAddingHouse(true, e.nativeEvent.coordinate);
                }
              }}
            />
            {territory.coordinates?.length > 0 && (
              <Marker coordinate={getPolygonCenter(territory.coordinates)}>
                <View
                  className="rounded-full bg-white dark:bg-black2 px-1.5 py-0.5"
                  style={{
                    opacity: shouldDimTerritory ? 0.5 : 1,
                  }}>
                  <ThemedText className="text-xs font-bold">{territory.number}</ThemedText>
                </View>
              </Marker>
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};

// Memoizar el componente con una función de comparación personalizada
const TerritoryPolygons = React.memo(TerritoryPolygonsComponent, (prevProps, nextProps) => {
  // Retorna true si los props son iguales (NO re-renderizar)
  // Retorna false si son diferentes (re-renderizar)

  // Comparar si el arreglo de territorios cambió
  if (prevProps.territories.length !== nextProps.territories.length) {
    return false;
  }

  // Comparar territorio seleccionado
  if (prevProps.selectedTerritory?.id !== nextProps.selectedTerritory?.id) {
    return false;
  }

  // Comparar estado de agregar casa
  if (prevProps.isAddingHouse !== nextProps.isAddingHouse) {
    return false;
  }

  // Si todo es igual, no re-renderizar
  return true;
});

TerritoryPolygons.displayName = 'TerritoryPolygons';

export default TerritoryPolygons;
