import { View, Text } from 'react-native';
import { clsx } from 'clsx';

import { FILTER_OPTIONS } from '~/types/FilterOption';
import { Territory } from '~/types/Territory';
import { getTerritoryStats } from '~/utils/territoryStatus';
import { styles } from './styles';

type Props = {
  territories: Territory[];
};

export const TerritoryStats = ({ territories }: Props) => {
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
      <Text className="mb-4 w-full text-center  text-xl">Estadísticas de Territorios</Text>

      {totalTerritories === 0 ? (
        <View className="items-center justify-center py-8">
          <Text className="text-gray-500">No hay territorios para mostrar</Text>
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
                  <Text className="text-center text-xs text-gray-600">{option.label}</Text>
                  <Text className="text-xs text-gray-500">({percentage}%)</Text>
                </View>
              );
            })}
          </View>

          <View className=" flex-row w-1/3 justify-center">
            {/* Total */}
            <View className="mt-2 items-center py-2">
              <Text className="text-xl font-semibold text-gray-800">Total: </Text>
              <Text className="text-3xl font-semibold text-gray-800">{totalTerritories}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};
