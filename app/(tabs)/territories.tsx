import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import React, { useState, useMemo } from 'react';
import { useTerritory } from '~/hooks/useTerritory';
import clsx from 'clsx';

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
  const { territories } = useTerritory();
  const [sortOption, setSortOption] = useState<'oldest' | 'newest' | null>(null);

  // Ordenar territorios en base a la opción seleccionada
  const sortedTerritories = useMemo(() => {
    let filtered = territories;

    if (sortOption) {
      // Filtrar solo los incompletos (sin fecha de fin)
      filtered = territories.filter((t) => !t.visitEndDate);

      // Ordenar según la opción
      filtered = filtered.sort((a, b) => {
        const dateA = a.visitStartDate ? new Date(a.visitStartDate) : new Date(0);
        const dateB = b.visitStartDate ? new Date(b.visitStartDate) : new Date(0);

        if (sortOption === 'oldest') {
          return dateA.getTime() - dateB.getTime();
        } else {
          return dateB.getTime() - dateA.getTime();
        }
      });
    }

    return filtered;
  }, [territories, sortOption]);

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Header de orden */}
      <View className="flex-row items-center justify-between px-4 py-2 h-40 bg-white shadow">
        <Text className="font-medium text-gray-700">Ordenar por:</Text>
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() =>
              setSortOption(sortOption === 'oldest' ? null : 'oldest')
            }
            className={clsx(
              'rounded-lg px-3 py-1',
              sortOption === 'oldest' ? 'bg-morado' : 'bg-gray-200'
            )}
          >
            <Text
              className={clsx(
                'text-sm',
                sortOption === 'oldest' ? 'text-white' : 'text-gray-700'
              )}
            >
              Más antiguos incompletos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              setSortOption(sortOption === 'newest' ? null : 'newest')
            }
            className={clsx(
              'rounded-lg px-3 py-1',
              sortOption === 'newest' ? 'bg-morado' : 'bg-gray-200'
            )}
          >
            <Text
              className={clsx(
                'text-sm',
                sortOption === 'newest' ? 'text-white' : 'text-gray-700'
              )}
            >
              Más recientes incompletos
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista de territorios */}
      <ScrollView contentContainerStyle={{ padding: 12 }}>
        {sortedTerritories.map((territory) => (
          <View
            key={territory.id}
            className="mb-3 flex-row overflow-hidden rounded-2xl bg-white shadow-md"
          >
            {/* Número */}
            <View
              className={clsx(
                'h-24 w-24 items-center justify-center',
                territory.visitEndDate ? 'bg-blue-400' : 'bg-yellow-300'
              )}
            >
              <Text className="text-3xl font-bold text-white">
                {territory.number}
              </Text>
            </View>

            {/* Info */}
            <View className="flex-1 p-3">
              <Text className="text-lg font-semibold text-gray-800">
                {territory.name}
              </Text>

              {territory.visitEndDate ? (
                <Text className="text-sm text-gray-600">
                  🏁 Finalizó: {formatDate(territory.visitEndDate)}
                </Text>
              ) : (
                <Text className="text-sm text-gray-600">
                  🚀 Inició: {formatDate(territory.visitStartDate)}
                </Text>
              )}

              {territory.note ? (
                <View className="mt-1">
                  <Text className="text-xs font-medium text-gray-500">
                    Nota:
                  </Text>
                  <Text className="text-sm text-gray-700">{territory.note}</Text>
                </View>
              ) : (
                <Text className="mt-1 text-xs text-gray-400 italic">
                  Sin notas
                </Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
