import React from 'react';
import { ScrollView, Text, View, useColorScheme, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { clsx } from 'clsx';
import { useRouter } from 'expo-router';
import ThemedText from 'components/ThemedText';
import { getTerritoryStatus } from '~/utils/territoryStatus';
import { useTerritory } from '~/hooks/useTerritory';
import { FilterSection } from 'components/FilterSection';
import { FilterSortBottomSheet } from 'components/FilterSortBottomSheet';
import { useFilterSort } from '~/hooks/useFilterSort';
import { styles } from 'components/styles';
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
  const { territories, isLoading, error } = useTerritory({ revalidateOnFocus: false });
  const {
    filterOption,
    setFilterOption,
    sortOption,
    setSortOption,
    searchQuery,
    setSearchQuery,
    bottomSheetOpen,
    setBottomSheetOpen,
    filteredAndSortedTerritories,
  } = useFilterSort(territories);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (isLoading)
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-100 dark:bg-black2">
        <ActivityIndicator size="large" color={isDark ? '#9CA3AF' : '#3b82f6'} />
        <Text className="mt-4 text-gray-900 dark:text-gray-100">Cargando territorios...</Text>
      </SafeAreaView>
    );

  if (error)
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-100 dark:bg-black2">
        <Text className="text-gray-900 dark:text-gray-100">Error: {error.message}</Text>
      </SafeAreaView>
    );

  return (
    <SafeAreaView className={styles.SAV}>
      {/* Header */}
      <View className={styles.containerPage}>
        <Text className={styles.pageTitle}>Territorios</Text>

        <FilterSection
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterOption={filterOption}
          sortOption={sortOption}
          onOpenBottomSheet={() => setBottomSheetOpen(true)}
        />
      </View>

      {/* Bottom Sheet con Moti */}
      <ScrollView contentContainerStyle={{ padding: 12 }}>
        {searchQuery.trim() !== '' && (
          <View className="mb-3 px-2">
            <Text className="text-sm text-gray-600 dark:text-gray-400">
              {filteredAndSortedTerritories.length} resultado
              {filteredAndSortedTerritories.length !== 1 ? 's' : ''}
              {searchQuery.trim() && ` para "${searchQuery}"`}
            </Text>
          </View>
        )}

        {filteredAndSortedTerritories.length === 0 ? (
          <View className="items-center justify-center py-10">
            <Text className="text-lg text-gray-500 dark:text-gray-400">
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
              className="mb-3 flex-row overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-black3">
              {/* Número */}
              <View
                className={clsx('w-24 items-center justify-center')}
                style={{ backgroundColor: getTerritoryStatus(territory).colorHex }}>
                <Text className="text-3xl font-bold text-white">{territory.number}</Text>
              </View>

              {/* Info */}
              <View className="flex-1 p-3">
                <ThemedText className="text-lg font-semibold">{territory.name}</ThemedText>

                <Text className="text-sm text-gray-600 dark:text-gray-400">
                  {territory.visitStartDate
                    ? `Inició: ${formatDate(territory.visitStartDate)}`
                    : 'Sin fecha todavía'}
                </Text>

                <Text className="text-sm text-gray-600 dark:text-gray-400">
                  {territory.visitEndDate ? `Finalizó: ${formatDate(territory.visitEndDate)}` : ''}
                </Text>

                {territory.note ? (
                  <View className="mt-1 bg-slate-100 p-1 dark:bg-black2">
                    <Text className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Nota:
                    </Text>
                    <Text className="text-sm text-gray-700 dark:text-gray-300">
                      {territory.note}
                    </Text>
                  </View>
                ) : (
                  <Text className="mt-1 text-xs italic text-gray-400 dark:text-gray-500">
                    Sin notas
                  </Text>
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
