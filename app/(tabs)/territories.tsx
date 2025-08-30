import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import React, { useState, useMemo } from 'react';
import { useTerritory } from '~/hooks/useTerritory';
import { clsx } from 'clsx';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import FilterTag from 'components/FilterTag';
import { CustomTextInput } from 'components/CustomTextInput';



// Función para formatear el timestamp a "Día Mes Año"
const formatDate = (timestamp: any) => {
  if (!timestamp) return null;

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

export default function Territories() {
  const { territories, isLoading, error } = useTerritory();
  const [sortOption, setSortOption] = useState<
    'oldest' | 'newest' | 'oldestCompleted' | 'newestCompleted' | null
  >(null);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  // Filtrar y ordenar territorios
  const filteredAndSortedTerritories = useMemo(() => {
    // Primero filtrar por búsqueda
    let filtered = territories.filter((territory) => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      
      // Buscar por nombre o número
      const nameMatch = territory.name.toLowerCase().includes(query);
      const numberMatch = territory.number.toString().includes(query);
      
      return nameMatch || numberMatch;
    });

    // Luego aplicar ordenamiento
    if (sortOption === 'oldest' || sortOption === 'newest') {
      // Incompletos (sin fecha de fin)
      filtered = filtered.filter((t) => !t.visitEndDate);
      filtered = filtered.sort((a, b) => {
        const dateA = a.visitStartDate ? new Date(a.visitStartDate) : new Date(0);
        const dateB = b.visitStartDate ? new Date(b.visitStartDate) : new Date(0);

        return sortOption === 'oldest'
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      });
    } else if (sortOption === 'oldestCompleted' || sortOption === 'newestCompleted') {
      // Completados (con fecha de fin)
      filtered = filtered.filter((t) => t.visitEndDate);
      filtered = filtered.sort((a, b) => {
        const dateA = a.visitEndDate ? new Date(a.visitEndDate) : new Date(0);
        const dateB = b.visitEndDate ? new Date(b.visitEndDate) : new Date(0);

        return sortOption === 'oldestCompleted'
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      });
    }

    return filtered;
  }, [territories, sortOption, searchQuery]);

  // Manejar estados de loading y error
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-100">
        <Text className="text-lg text-gray-600">Cargando territorios...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-100">
        <Text className="text-lg text-red-600">Error: {error.message}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="bg-white px-4 py-2 shadow">
        <Text className="text-3xl font-bold text-center mb-4">Territorios</Text>
        
        {/* Buscador */}
        <View className="mb-4">
           <CustomTextInput
            placeholder="Buscar por nombre o número..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            iconLeft={
              <Ionicons 
                name="search" 
                size={20} 
                color="#6B7280" 
              />
            }
            className="mb-3"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Filtros de ordenamiento */}
        <View className="mb-2">
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-3">
              <FilterTag
                label="Más antiguos incompletos"
                isActive={sortOption === 'oldest'}
                onPress={() => setSortOption(sortOption === 'oldest' ? null : 'oldest')}
              />
              
              <FilterTag
                label="Más recientes incompletos"
                isActive={sortOption === 'newest'}
                onPress={() => setSortOption(sortOption === 'newest' ? null : 'newest')}
              />
              
              <FilterTag
                label="Más antiguos completados"
                isActive={sortOption === 'oldestCompleted'}
                onPress={() => setSortOption(sortOption === 'oldestCompleted' ? null : 'oldestCompleted')}
              />
              
              <FilterTag
                label="Más recientes completados"
                isActive={sortOption === 'newestCompleted'}
                onPress={() => setSortOption(sortOption === 'newestCompleted' ? null : 'newestCompleted')}
              />
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Lista de territorios */}
      <ScrollView contentContainerStyle={{ padding: 12 }}>
        {/* Mostrar resultado de búsqueda */}
        {searchQuery.trim() !== '' && (
          <View className="mb-3 px-2">
            <Text className="text-sm text-gray-600">
              {filteredAndSortedTerritories.length} resultado{filteredAndSortedTerritories.length !== 1 ? 's' : ''} 
              {searchQuery.trim() && ` para "${searchQuery}"`}
            </Text>
          </View>
        )}

        {filteredAndSortedTerritories.length === 0 ? (
          <View className="items-center justify-center py-10">
            <Text className="text-lg text-gray-500">
              {searchQuery.trim() 
                ? `No se encontraron territorios para "${searchQuery}"` 
                : 'No hay territorios disponibles'
              }
            </Text>
          </View>
        ) : (
          filteredAndSortedTerritories.map((territory) => (
            <TouchableOpacity
              key={territory.id}
              activeOpacity={0.7}
              onPress={() => {
                router.push({
                  pathname: '/' as any,
                  params: { territoryId: territory.id },
                });
              }}
              className="mb-3 flex-row overflow-hidden rounded-2xl bg-white shadow-md">
              {/* Número */}
              <View
                className={clsx(
                  'w-24 items-center justify-center',
                  territory.visitEndDate ? 'bg-blue-400' : 'bg-yellow-300'
                )}>
                <Text className="text-3xl font-bold text-white">{territory.number}</Text>
              </View>

              {/* Info */}
              <View className="flex-1 p-3">
                <Text className="text-lg font-semibold text-gray-800">
                  {territory.name}
                </Text>

                {territory.visitEndDate ? (
                  <Text className="text-sm text-gray-600">
                    Finalizó: {formatDate(territory.visitEndDate)}
                  </Text>
                ) : (
                  <Text className="text-sm text-gray-600">
                    Inició: {formatDate(territory.visitStartDate)}
                  </Text>
                )}

                {territory.note ? (
                  <View className="mt-1 bg-slate-100 p-1">
                    <Text className="text-xs font-medium text-gray-500">Nota:</Text>
                    <Text className="text-sm text-gray-700">{territory.note}</Text>
                  </View>
                ) : (
                  <Text className="mt-1 text-xs italic text-gray-400">Sin notas</Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}