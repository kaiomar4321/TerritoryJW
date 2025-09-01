import React, { useState, useMemo } from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { clsx } from 'clsx';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CustomTextInput } from 'components/CustomTextInput';
import { getTerritoryStatus } from '~/utils/territoryStatus';
import { FILTER_OPTIONS, FilterOption } from '~/types/FilterOption';
import { useTerritory } from '~/hooks/useTerritory';
import { FilterSortBottomSheet, SortOption } from 'components/FilterSortBottomSheet';
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
  const [filterOption, setFilterOption] = useState<FilterOption | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const router = useRouter();

  // Filtrar y ordenar
  const filteredAndSortedTerritories = useMemo(() => {
    let filtered = territories.filter((t) => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      return t.name.toLowerCase().includes(query) || t.number.toString().includes(query);
    });

    if (filterOption) filtered = filtered.filter((t) => getTerritoryStatus(t).id === filterOption);

    if (sortOption === 'recent')
      filtered = filtered.sort(
        (a, b) =>
          (b.visitStartDate ? new Date(b.visitStartDate).getTime() : 0) -
          (a.visitStartDate ? new Date(a.visitStartDate).getTime() : 0)
      );
    if (sortOption === 'oldest')
      filtered = filtered.sort(
        (a, b) =>
          (a.visitStartDate ? new Date(a.visitStartDate).getTime() : 0) -
          (b.visitStartDate ? new Date(b.visitStartDate).getTime() : 0)
      );
    if (sortOption === 'ascNumber') filtered = filtered.sort((a, b) => a.number - b.number);
    if (sortOption === 'descNumber') filtered = filtered.sort((a, b) => b.number - a.number);

    return filtered;
  }, [territories, filterOption, sortOption, searchQuery]);

  if (isLoading)
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-100">
        <Text>Cargando territorios...</Text>
      </SafeAreaView>
    );

  if (error)
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-100">
        <Text>Error: {error.message}</Text>
      </SafeAreaView>
    );

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-white px-4 py-2 shadow">
        <Text className="mb-4 text-center text-3xl font-bold">Territorios</Text>

        {/* Buscador */}
        <CustomTextInput
          placeholder="Buscar por nombre o número..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          iconLeft={<Ionicons name="search" size={20} color="#6B7280" />}
          className="mb-3"
          placeholderTextColor="#9CA3AF"
        />

        {/* Botón para abrir Bottom Sheet */}
        <Text>Filtro y orden:</Text>
        <TouchableOpacity
          onPress={() => setBottomSheetOpen(true)}
          className="rounded-xl border border-gray-300 bg-white p-3">
          <Text className="text-gray-700">
            {filterOption ? FILTER_OPTIONS.find((o) => o.id === filterOption)?.label : 'Todos'}
            {' | '}
            {sortOption ? sortOption : 'Sin orden'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet con Moti */}

      {/* Lista de territorios */}
      <ScrollView contentContainerStyle={{ padding: 12 }}>
        {searchQuery.trim() !== '' && (
          <View className="mb-3 px-2">
            <Text className="text-sm text-gray-600">
              {filteredAndSortedTerritories.length} resultado
              {filteredAndSortedTerritories.length !== 1 ? 's' : ''}
              {searchQuery.trim() && ` para "${searchQuery}"`}
            </Text>
          </View>
        )}

        {filteredAndSortedTerritories.length === 0 ? (
          <View className="items-center justify-center py-10">
            <Text className="text-lg text-gray-500">
              {searchQuery.trim()
                ? `No se encontraron territorios para "${searchQuery}"`
                : 'No hay territorios disponibles'}
            </Text>
          </View>
        ) : (
          filteredAndSortedTerritories.map((territory) => (
            <TouchableOpacity
              key={territory.id}
              activeOpacity={0.7}
              onPress={() =>
                router.push({ pathname: '/' as any, params: { territoryId: territory.id } })
              }
              className="mb-3 flex-row overflow-hidden rounded-2xl bg-white shadow-md">
              {/* Número */}
              <View
                className={clsx('w-24 items-center justify-center')}
                style={{ backgroundColor: getTerritoryStatus(territory).colorHex }}>
                <Text className="text-3xl font-bold text-white">{territory.number}</Text>
              </View>

              {/* Info */}
              <View className="flex-1 p-3">
                <Text className="text-lg font-semibold text-gray-800">{territory.name}</Text>

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
      <FilterSortBottomSheet
        visible={bottomSheetOpen}
        onClose={() => setBottomSheetOpen(false)}
        filterValue={filterOption}
        sortValue={sortOption}
        onSelectFilter={(value) => setFilterOption(value)}
        onSelectSort={(value) => setSortOption(value)}
      />
    </SafeAreaView>
  );
}
