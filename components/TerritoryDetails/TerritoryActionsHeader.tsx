import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MotiView } from 'moti';

type Props = {
  onAddHouse: () => void;
  onEdit: () => void;
  onClose: () => void;
};

const TerritoryActionsHeader: React.FC<Props> = ({ onAddHouse, onEdit, onClose }) => {
  return (
    <View className="w-full flex-row items-center justify-end gap-2">
      <MotiView from={{ scale: 0 }} animate={{ scale: 1 }}>
        <TouchableOpacity className="rounded-full bg-red-600 p-2" onPress={onAddHouse}>
          <Ionicons name="home-outline" size={22} color="white" />
        </TouchableOpacity>
      </MotiView>

      <MotiView from={{ scale: 0 }} animate={{ scale: 1 }}>
        <TouchableOpacity className="rounded-full bg-slate-500 p-2" onPress={onEdit}>
          <Ionicons name="create-outline" size={22} color="white" />
        </TouchableOpacity>
      </MotiView>

      <MotiView from={{ scale: 0 }} animate={{ scale: 1 }}>
        <TouchableOpacity className="rounded-full bg-slate-500 p-2" onPress={onClose}>
          <Ionicons name="close-circle-outline" size={22} color="white" />
        </TouchableOpacity>
      </MotiView>
    </View>
  );
};

export default TerritoryActionsHeader;
