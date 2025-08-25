import { View, Text, ActivityIndicator } from 'react-native';
import MapView, { Polygon, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React from 'react';

import { useLocation } from '~/hooks/useLocation';
import { useTerritory } from '~/hooks/useTerritory';
import { useHouses } from '~/hooks/useHouses';
import { usePermissions } from '~/hooks/usePermissions';

import { getTerritoryColor, getPolygonCenter } from '~/utils/mapUtils';

import TerritoryDetails from 'components/TerritoryDetails';
import SquareButton from 'components/Buttons/SquareButton';
import SelectedHouse from 'components/SelectedHouse';
import FilterButtons from 'components/FilterButtons';

export default function TabIndex() {
  const { location, getLocation, focusOnTerritory, mapRef } = useLocation();

  const {
    filteredTerritories,
    isEditMode,
    setIsEditMode,
    drawingCoordinates,
    saveTerritory,
    handleMapPress,
    selectedTerritory,
    setSelectedTerritory,
    updateTerritory,
    selectedFilter,
    setSelectedFilter,
  } = useTerritory();

  const {
    houses,
    selectedHouse,
    setSelectedHouse,
    isAddingHouse,
    currentHouseLocation,
    setCurrentHouseLocation,
    handleAddingHouse,
    updateHouse,
    deleteHouse,
  } = useHouses(selectedTerritory?.id ?? null);

  const { isAdmin, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-1 rounded-3xl border-2 border-white">
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={{ flex: 1 }}
          initialRegion={{
            latitude: 19.513628294348678,
            longitude: -101.60850390264007,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          onPress={(e) => {
            if (!isAddingHouse) {
              handleMapPress(e, isAdmin);
              setSelectedHouse(null);
            }
          }}>
          {/* Puntos mientras dibujas */}
          {isEditMode &&
            drawingCoordinates.map((coord, idx) => (
              <Marker key={`drawing-${idx}`} coordinate={coord} pinColor="red" />
            ))}

          {isEditMode && drawingCoordinates.length >= 2 && (
            <Polygon
              coordinates={drawingCoordinates}
              strokeColor="#FF0000"
              fillColor="rgba(255,0,0,0.2)"
              strokeWidth={2}
            />
          )}

          {/* Territorios */}
          {filteredTerritories.map((territory) => (
            <React.Fragment key={territory.id}>
              <Polygon
                coordinates={territory.coordinates}
                strokeColor={getTerritoryColor(territory)}
                fillColor={`${getTerritoryColor(territory)}55`}
                tappable
                onPress={(e) => {
                  if (!isAddingHouse) {
                    setSelectedTerritory(territory);
                    setSelectedHouse(null);
                    focusOnTerritory(territory);
                  }else{
                    handleAddingHouse(true, e.nativeEvent.coordinate);
                  }
                }}
              />
              <Marker coordinate={getPolygonCenter(territory.coordinates)}>
                <View className="rounded bg-white px-1.5 py-0.5">
                  <Text className="text-xs font-bold">{territory.number}</Text>
                </View>
              </Marker>
            </React.Fragment>
          ))}

          {/* Marcador de casa en edición */}
          {isAddingHouse && currentHouseLocation && <Marker coordinate={currentHouseLocation} />}

          {/* Marcadores de casas */}
          {selectedTerritory &&
            !isAddingHouse &&
            houses.map((house) => (
              <Marker
                key={house.id}
                coordinate={house.coordinates}
                draggable
                onDragEnd={(e) => updateHouse(house.id, { coordinates: e.nativeEvent.coordinate })}
                onPress={() => setSelectedHouse(house)}
              />
            ))}

          {/* Tu ubicación */}
          {location && (
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title="Mi ubicación"
            />
          )}
        </MapView>

        {/* Filtros */}
        {!selectedTerritory && (
          <FilterButtons selectedFilter={selectedFilter} onFilterChange={setSelectedFilter} />
        )}

        {/* Casa seleccionada */}
        {selectedHouse && (
          <View className="absolute left-0 right-0 top-0 h-1/2 items-center justify-end pb-12">
            <SelectedHouse
              selectedHouse={selectedHouse}
              deleteHouse={() => deleteHouse(selectedHouse.id)}
              setSelectedHouse={() => setSelectedHouse(null)}
            />
          </View>
        )}

        {/* Detalles de territorio */}
        <TerritoryDetails
          territory={selectedTerritory}
          onClose={() => {
            setSelectedTerritory(null);
            setSelectedHouse(null);
          }}
          onUpdate={updateTerritory}
          onAddingHouse={handleAddingHouse}
          currentLocation={currentHouseLocation}
        />

        {/* Botón ubicación */}
        <View className="absolute bottom-5 right-5">
          <SquareButton text="Mi Ubicación" icon="locate" onPress={getLocation} isSelected={true} />
        </View>

        {/* Modo admin */}
        {isAdmin && !selectedTerritory && (
          <View className="absolute right-2 top-10 gap-2 rounded-xl bg-white p-2 shadow-lg">
            <SquareButton
              text={!isEditMode ? 'Nuevo Territorio' : 'Cancelar'}
              icon={!isEditMode ? 'add-circle-outline' : 'close-circle-outline'}
              onPress={() => setIsEditMode(!isEditMode)}
            />

            {isEditMode && drawingCoordinates.length >= 3 && (
              <SquareButton
                text="Guardar"
                icon="download-outline"
                onPress={saveTerritory}
                isSelected
              />
            )}
          </View>
        )}
      </View>
    </GestureHandlerRootView>
  );
}
