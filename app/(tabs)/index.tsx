import {
  View,
  Text,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import MapView, { Polygon, Marker, PROVIDER_GOOGLE, LatLng } from 'react-native-maps';
import { useLocation } from '../../src/hooks/useLocation';
import { useTerritory } from '../../src/hooks/useTerritory';
import { usePermissions } from '../../src/hooks/usePermissions';
import { auth } from '../../src/config/firebase';
import TerritoryDetails from 'components/TerritoryDetails';
import { CustomButton } from 'components/CustomButton';
import { Coordinate } from '~/types/Territory';
import React, { useState } from 'react';
import { useHouses } from '~/hooks/useHouses';
import { MaterialIcons } from '@expo/vector-icons';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import SelectedHouse from 'components/SelectedHouse';

export default function TabIndex() {
  const { location, getLocation, focusOnTerritory, mapRef } = useLocation();
  const {
    territories,
    isEditMode,
    setIsEditMode,
    drawingCoordinates,
    saveTerritory,
    handleMapPress,
    selectedTerritory,
    setSelectedTerritory,
    updateTerritory,
  } = useTerritory();
  const { houses, updateHouse, selectedHouse, setSelectedHouse, deleteHouse } = useHouses(
    selectedTerritory?.id ?? null
  );
  const [isAddingHouse, setIsAddingHouse] = useState(false);
  const [currentHouseLocation, setCurrentHouseLocation] = useState<LatLng | null>(null);

  const { isAdmin, isLoading } = usePermissions();

  const initialRegion = {
    latitude: 19.513628294348678,
    longitude: -101.60850390264007,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const handleAddingHouse = (isAdding: boolean) => {
    setIsAddingHouse(isAdding);
    if (isAdding) {
      // Si hay ubicación actual, la usamos
      if (location) {
        setCurrentHouseLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } else {
        // Si no hay ubicación, usamos el centro del mapa
        mapRef.current?.getCamera().then((camera) => {
          if (camera) {
            setCurrentHouseLocation({
              latitude: camera.center.latitude,
              longitude: camera.center.longitude,
            });
          }
        });
      }
    } else {
      setCurrentHouseLocation(null);
    }
  };

  const getPolygonCenter = (coordinates: Coordinate[]): Coordinate => {
    if (!coordinates || coordinates.length === 0) {
      return { latitude: 0, longitude: 0 };
    }
    const latitudes = coordinates.map((c) => c.latitude);
    const longitudes = coordinates.map((c) => c.longitude);

    const avgLat = latitudes.reduce((a, b) => a + b, 0) / latitudes.length;
    const avgLng = longitudes.reduce((a, b) => a + b, 0) / longitudes.length;

    return {
      latitude: avgLat,
      longitude: avgLng,
    };
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={150}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1">
              <MapView
                ref={mapRef} // Agregar esta referencia
                provider={PROVIDER_GOOGLE}
                style={{ width: '100%', height: '100%' }}
                className="h-full w-full"
                initialRegion={initialRegion}
                onPress={(e) => {
                  handleMapPress(e, isAdmin);
                  setSelectedHouse(null);
                }}>
                {territories.map((territory) => (
                  <React.Fragment key={territory.id}>
                    <Polygon
                      coordinates={territory.coordinates}
                      strokeColor={territory.color}
                      fillColor={territory.color + '55'}
                      tappable
                      onPress={() => {
                        setSelectedTerritory(territory);
                        setSelectedHouse(null);
                        focusOnTerritory(territory);
                      }}
                    />
                    <Marker coordinate={getPolygonCenter(territory.coordinates)}>
                      <View className="rounded border border-gray-300 bg-white px-1.5 py-0.5">
                        <Text className="text-xs font-bold">{territory.number}</Text>
                      </View>
                    </Marker>
                  </React.Fragment>
                ))}

                {/* MARCADOR PARA AGREGAR CASA (si se está agregando) */}
                {isAddingHouse && currentHouseLocation && (
                  <Marker
                    coordinate={currentHouseLocation}
                    draggable
                    onDragEnd={(e) => setCurrentHouseLocation(e.nativeEvent.coordinate)}></Marker>
                )}
                {/* MARCADORES DE CASAS SOLO SI HAY TERRITORIO SELECCIONADO */}
                {selectedTerritory &&
                  houses
                    .filter((house) => house.coordinates?.latitude && house.coordinates?.longitude)
                    .map((house) => (
                      <Marker
                        key={house.id}
                        coordinate={house.coordinates}
                        draggable
                        onDragEnd={async (e) => {
                          const newCoords = e.nativeEvent.coordinate;
                          await updateHouse(house.id, { coordinates: newCoords });
                        }}
                        onPress={() => {
                          setSelectedHouse(house);
                          console.log(selectedHouse);
                        }} // aquí seleccionamos la casa
                      >
                        {/* Icono simple */}
                        <View
                          style={{
                            backgroundColor: 'white',
                            borderRadius: 12,
                            padding: 4,
                            borderWidth: 1,
                            borderColor: '#ccc',
                          }}>
                          <MaterialIcons name="home" size={18} color="#f87171" />
                        </View>
                      </Marker>
                    ))}

                {/* TU UBICACIÓN */}
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

              {selectedHouse && (
                <View className="absolute left-0 right-0 top-0  h-1/2 items-center justify-end pb-12 ">
                  <SelectedHouse
                    selectedHouse={selectedHouse}
                    deleteHouse={() => deleteHouse(selectedHouse.id)}
                    setSelectedHouse={() => setSelectedHouse(null)}
                  />
                </View>
              )}

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

              <View className="absolute bottom-5 right-5">
                <CustomButton
                  text="Mi Ubicación"
                  onPress={getLocation}
                  variant="primary"
                  className="rounded-full bg-black px-6 py-4"
                  fullWidth={false}
                />
              </View>

              {auth.currentUser && isAdmin && (
                <View className="absolute right-5 top-5 gap-2.5 rounded-xl bg-white/90 p-2.5 shadow-lg">
                  <CustomButton
                    text={isEditMode ? 'Cancelar' : 'Definir Territorio'}
                    onPress={() => setIsEditMode(!isEditMode)}
                    variant={isEditMode ? 'danger' : 'primary'}
                    fullWidth={false}
                    className="min-w-[150px]"
                  />

                  {isEditMode && (
                    <View className="rounded bg-black/70 p-2.5">
                      <Text className="text-center text-xs text-white">
                        Toca el mapa para crear puntos
                      </Text>
                      <Text className="text-center text-xs text-white">
                        Puntos: {drawingCoordinates.length}/3
                      </Text>
                    </View>
                  )}

                  {isEditMode && drawingCoordinates.length >= 3 && (
                    <CustomButton
                      text="Guardar Territorio"
                      onPress={saveTerritory}
                      variant="primary"
                      fullWidth={false}
                      className="min-w-[150px] bg-green-500"
                    />
                  )}
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
