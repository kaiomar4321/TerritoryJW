import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import React, { useState, useMemo } from 'react';
import { useTerritory } from '~/hooks/useTerritory';
import { clsx } from 'clsx';
import { useRouter } from 'expo-router';

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
  const router = useRouter();

  // Ordenar territorios en base a la opción seleccionada
  const sortedTerritories = useMemo(() => {
    let filtered = territories;

    if (sortOption === 'oldest' || sortOption === 'newest') {
      // Incompletos (sin fecha de fin)
      filtered = territories.filter((t) => !t.visitEndDate);
      filtered = filtered.sort((a, b) => {
        const dateA = a.visitStartDate ? new Date(a.visitStartDate) : new Date(0);
        const dateB = b.visitStartDate ? new Date(b.visitStartDate) : new Date(0);

        return sortOption === 'oldest'
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      });
    } else if (sortOption === 'oldestCompleted' || sortOption === 'newestCompleted') {
      // Completados (con fecha de fin)
      filtered = territories.filter((t) => t.visitEndDate);
      filtered = filtered.sort((a, b) => {
        const dateA = a.visitEndDate ? new Date(a.visitEndDate) : new Date(0);
        const dateB = b.visitEndDate ? new Date(b.visitEndDate) : new Date(0);

        return sortOption === 'oldestCompleted'
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      });
    }

    return filtered;
  }, [territories, sortOption]);

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
    <SafeAreaView className="flex-1 bg-gray-100 dark:bg-black1">
      <View className="h-48 flex-col items-center justify-end bg-white dark:bg-black2 px-4 py-2 shadow">
        <Text className="text-3xl font-bold dark:text-white">Territorios</Text>
        <View className="w-full">
          <Text className="font-medium text-gray-700 dark:text-white">Ordenar por:</Text>
          <View className="flex-row flex-wrap gap-3">
            {/* Incompletos */}
            <TouchableOpacity
              onPress={() => setSortOption(sortOption === 'oldest' ? null : 'oldest')}
              className={clsx(
                'rounded-lg px-5 py-2',
                sortOption === 'oldest' ? 'bg-morado' : 'bg-gray-200'
              )}>
              <Text
                className={clsx(
                  'text-sm',
                  sortOption === 'oldest' ? 'text-white' : 'text-gray-700'
                )}>
                Más antiguos incompletos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSortOption(sortOption === 'newest' ? null : 'newest')}
              className={clsx(
                'rounded-lg px-5 py-2',
                sortOption === 'newest' ? 'bg-morado' : 'bg-gray-200'
              )}>
              <Text
                className={clsx(
                  'text-sm',
                  sortOption === 'newest' ? 'text-white' : 'text-gray-700'
                )}>
                Más recientes incompletos
              </Text>
            </TouchableOpacity>

            {/* Completados */}
            <TouchableOpacity
              onPress={() =>
                setSortOption(sortOption === 'oldestCompleted' ? null : 'oldestCompleted')
              }
              className={clsx(
                'rounded-lg px-5 py-2',
                sortOption === 'oldestCompleted' ? 'bg-morado' : 'bg-gray-200'
              )}>
              <Text
                className={clsx(
                  'text-sm',
                  sortOption === 'oldestCompleted' ? 'text-white' : 'text-gray-700'
                )}>
                Más antiguos completados
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                setSortOption(sortOption === 'newestCompleted' ? null : 'newestCompleted')
              }
              className={clsx(
                'rounded-lg px-5 py-2',
                sortOption === 'newestCompleted' ? 'bg-morado' : 'bg-gray-200'
              )}>
              <Text
                className={clsx(
                  'text-sm',
                  sortOption === 'newestCompleted' ? 'text-white' : 'text-gray-700'
                )}>
                Más recientes completados
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Lista de territorios */}
      <ScrollView contentContainerStyle={{ padding: 12 }}>
        {sortedTerritories.length === 0 ? (
          <View className="items-center justify-center py-10">
            <Text className="text-lg text-gray-500">No hay territorios disponibles</Text>
          </View>
        ) : (
          sortedTerritories.map((territory) => (
            <TouchableOpacity
              key={territory.id}
              activeOpacity={0.7}
              onPress={() => {
                router.push({
                  pathname: '/' as any,
                  params: { territoryId: territory.id },
                });
              }}
              className="mb-3 flex-row overflow-hidden rounded-2xl bg-white shadow-md dark:bg-black2">
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
                <Text className="text-lg font-semibold text-gray-800 dark:text-white">
                  {territory.name}
                </Text>

                {territory.visitEndDate ? (
                  <Text className="text-sm text-gray-600 dark:text-white">
                    Finalizó: {formatDate(territory.visitEndDate)}
                  </Text>
                ) : (
                  <Text className="text-sm text-gray-600 dark:text-white">
                    Inició: {formatDate(territory.visitStartDate)}
                  </Text>
                )}

                {territory.note ? (
                  <View className="mt-1 bg-slate-100 dark:bg-black3 p-1">
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
