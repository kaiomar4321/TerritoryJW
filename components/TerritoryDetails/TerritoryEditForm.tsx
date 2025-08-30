import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CustomTextInput } from '../CustomTextInput';
import { CustomButton } from 'components/CustomButton';
import { styles } from '../styles';

type Props = {
  form: any;
  onChange: (key: any, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
};

const TerritoryEditForm: React.FC<Props> = ({ form, onChange, onSave, onCancel }) => {
  return (
    <MotiView
      className={styles.containerCard}
      from={{ opacity: 0, scale: 0.9, rotateX: '45deg' }}
      animate={{ opacity: 1, scale: 1, rotateX: '0deg' }}
      exit={{ opacity: 0, scale: 0.9, rotateX: '-45deg' }}
      transition={{ type: 'spring', damping: 15, stiffness: 200 }}>
      <MotiView from={{ opacity: 0, translateY: -30 }} animate={{ opacity: 1, translateY: 0 }}>
        <MotiView className="w-full flex-row items-center justify-between">
          <Text className="text-2xl font-bold">Editar Territorio</Text>
          <TouchableOpacity className="rounded-full bg-slate-500 p-2" onPress={onCancel}>
            <Ionicons name="close-circle-outline" size={22} color="white" />
          </TouchableOpacity>
        </MotiView>
      </MotiView>

      <MotiView from={{ opacity: 0, translateX: -50 }} animate={{ opacity: 1, translateX: 0 }}>
        <CustomTextInput
          placeholder="Nombre"
          value={form.name}
          onChangeText={(t) => onChange('name', t)}
        />
        <CustomTextInput
          placeholder="Numero"
          value={String(form.number)}
          onChangeText={(t) => onChange('number', t)}
          keyboardType="decimal-pad"
        />
        <CustomTextInput
          placeholder="Color"
          value={form.color}
          onChangeText={(t) => onChange('color', t)}
        />
      </MotiView>

      <MotiView from={{ opacity: 0, translateY: 30 }} animate={{ opacity: 1, translateY: 0 }}>
        <CustomButton
          text="Guardar cambios"
          onPress={onSave}
          variant="primary"
          className="mt-2.5"
        />
        <CustomButton text="Cancelar" onPress={onCancel} variant="secondary" className="mt-2" />
      </MotiView>
    </MotiView>
  );
};

export default TerritoryEditForm;
