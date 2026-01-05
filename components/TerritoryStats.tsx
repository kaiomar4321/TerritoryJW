import { View, Text, useColorScheme } from 'react-native';
import { clsx } from 'clsx';

import ThemedText from './ThemedText';
import { FILTER_OPTIONS } from '~/types/FilterOption';
import { Territory } from '~/types/Territory';
import { getTerritoryStats } from '~/utils/territoryStatus';
import { styles } from './styles';

type Props = {
  territories: Territory[];
};

export const TerritoryStats = ({ territories }: Props) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const counts = getTerritoryStats(territories);
  const totalTerritories = territories.length;

  // Prepara los datos para el ProgressChart

  // Configuración mejorada para el gráfico

  // Función para calcular porcentaje
  const getPercentage = (count: number) => {
    return totalTerritories > 0 ? Math.round((count / totalTerritories) * 100) : 0;
  };

  return (
    <View className={styles.containerCard}>
      <ThemedText className="mb-4 w-full text-center text-xl">Estadísticas de Territorios</ThemedText>

      {totalTerritories === 0 ? (
        <View className="items-center justify-center py-8">
          <Text className="text-gray-500 dark:text-gray-400">No hay territorios para mostrar</Text>
        </View>
      ) : (
        <View className="w-full flex-row">
          <View className="flex h-fit flex-row  w-2/3 items-center justify-between ">
            {FILTER_OPTIONS.map((option) => {
              const count = counts[option.id] || 0;
              const percentage = getPercentage(count);

              return (
                <View key={option.id} className="items-center py-1 w-1/3">
                  <View className="flex-row items-center gap-2">
                    {/* Indicador de color */}
                    <View
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: option.colorHex }}
                    />
                    <Text style={{ color: option.colorHex }} className={clsx('text-2xl font-bold')}>
                      {count}
                    </Text>
                  </View>
                  <Text className="text-center text-xs text-gray-600 dark:text-gray-400">{option.label}</Text>
                  <Text className="text-xs text-gray-500 dark:text-gray-400">({percentage}%)</Text>
                </View>
              );
            })}
          </View>

          <View className=" flex-row w-1/3 justify-center">
            {/* Total */}
            <View className="mt-2 items-center py-2">
              <ThemedText className="text-xl font-semibold">Total: </ThemedText>
              <ThemedText className="text-3xl font-semibold">{totalTerritories}</ThemedText>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};
