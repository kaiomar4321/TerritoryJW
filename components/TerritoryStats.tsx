import { View, Text, Dimensions } from 'react-native';
import { clsx } from 'clsx';
import { ProgressChart } from 'react-native-chart-kit';
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
  const chartData = {
    labels: FILTER_OPTIONS.map((option) => option.label), // Añadir labels para mejor accesibilidad
    data: FILTER_OPTIONS.map((option) => {
      const count = counts[option.id] || 0;
      // Calcula el porcentaje (0 a 1) para cada estado
      return totalTerritories > 0 ? count / totalTerritories : 0;
    }),
    colors: FILTER_OPTIONS.map((option) => option.colorHex),
  };

  // Configuración mejorada para el gráfico
  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: '#ffffff',
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2, // Línea más delgada para el borde
    barPercentage: 0.5,
    useShadowColorFromDataset: false, // Usar colores del dataset
    decimalPlaces: 0, // Sin decimales en los labels
  };

  const screenWidth = Dimensions.get('window').width;

  // Función para calcular porcentaje
  const getPercentage = (count: number) => {
    return totalTerritories > 0 ? Math.round((count / totalTerritories) * 100) : 0;
  };

  return (
    <View className={styles.containerCard}>
      <Text className="text-2xl text-center w-full  mb-4">Estadísticas de Territorios</Text>
      
      {totalTerritories === 0 ? (
        <View className="justify-center items-center py-8">
          <Text className="text-gray-500">No hay territorios para mostrar</Text>
        </View>
      ) : (
        <View className="w-full flex-row">
          <View className="w-2/3 h-fit  justify-center items-center flex ">
            <ProgressChart
              data={chartData}
              width={screenWidth * 0.6}
              height={210}
              strokeWidth={20}
              radius={40}
              chartConfig={chartConfig}
              hideLegend={true}
              withCustomBarColorFromData={true} // Usar colores personalizados
            />
          </View>
          
          <View className="w-1/3 justify-center space-y-2">
            {FILTER_OPTIONS.map((option) => {
              const count = counts[option.id] || 0;
              const percentage = getPercentage(count);
              
              return (
                <View key={option.id} className="items-center py-1">
                  <View className="flex-row items-center gap-2">
                    {/* Indicador de color */}
                    <View 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: option.colorHex }} 
                    />
                    <Text 
                      style={{ color: option.colorHex }} 
                      className={clsx('text-2xl font-bold')}
                    >
                      {count}
                    </Text>
                  </View>
                  <Text className="text-xs text-gray-600 text-center">
                    {option.label}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    ({percentage}%)
                  </Text>
                </View>
              );
            })}
            
            {/* Total */}
            <View className="items-center py-2 border-t border-gray-200 mt-2">
              <Text className="text-sm font-semibold text-gray-800">
                Total: {totalTerritories}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};