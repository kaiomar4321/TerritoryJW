import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AddHouseForm } from '../AddHouseForm';
import { styles } from '../styles';

type Props = {
  formHouse: { address: string; reason: string };
  onChangeHouse: (key: any, value: any) => void;
  onSaveHouse: () => void;
  onCancel: () => void;
};

const AddHouseCard: React.FC<Props> = ({ formHouse, onChangeHouse, onSaveHouse, onCancel }) => {
  return (
    <MotiView
      className={styles.containerCard}
      from={{ opacity: 0, translateX: 100 }}
      animate={{ opacity: 1, translateX: 0 }}
      exit={{ opacity: 0, translateX: -100 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}>

      <MotiView from={{ opacity: 0, translateY: -20 }} animate={{ opacity: 1, translateY: 0 }}>
        <MotiView className="w-full flex-row items-center justify-between">
          <Text className="text-2xl font-bold">Agregar Nueva Casa</Text>
          <TouchableOpacity className="rounded-full bg-slate-500 p-2" onPress={onCancel}>
            <Ionicons name="close-circle-outline" size={22} color="white" />
          </TouchableOpacity>
        </MotiView>
        <Text className="mb-2 text-sm text-gray-600">Haz click en el mapa para poner la casa</Text>
      </MotiView>

      <MotiView from={{ opacity: 0, translateY: 30 }} animate={{ opacity: 1, translateY: 0 }}>
        <AddHouseForm formHouse={formHouse} onChange={onChangeHouse} onSave={onSaveHouse} onCancel={onCancel} />
      </MotiView>
    </MotiView>
  );
};

export default AddHouseCard;
