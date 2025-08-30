import {clsx} from "clsx";
import { TouchableOpacity, Text } from "react-native";

interface FilterTagProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

const FilterTag: React.FC<FilterTagProps> = ({ label, isActive, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    className={clsx(
      'rounded-lg px-5 py-2',
      isActive ? 'bg-morado' : 'bg-gray-200'
    )}>
    <Text
      className={clsx(
        'text-sm whitespace-nowrap',
        isActive ? 'text-white' : 'text-gray-700'
      )}>
      {label}
    </Text>
  </TouchableOpacity>
);

export default FilterTag;