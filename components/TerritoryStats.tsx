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

  return (
    <View className={styles.containerCard}>
      <View className='flex-row w-full justify-between'>
        {FILTER_OPTIONS.map((option) => (
          <View key={option.id} className="items-center">
            <Text style={{ color: option.colorHex }} className={clsx('text-xl font-bold')}>
              {counts[option.id]}
            </Text>
            <Text className="text-sm text-gray-600">{option.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};
