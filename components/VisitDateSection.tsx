// components/VisitDateSection.tsx
import { useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { styles } from './styles';
import ThemedText from './ThemedText';
import SmallSquareButton from './Buttons/SmallSquareButton';
import { getTerritoryStatus } from '~/utils/territoryStatus';
export const VisitDateSection = ({ form, setForm, onStart, onEnd, onRestart }: any) => {
  const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);

  const status = getTerritoryStatus(form).id;

  const handleDateChange = (type: 'start' | 'end', date?: Date) => {
    setShowPicker(null);
    if (date) {
      const key = type === 'start' ? 'visitStartDate' : 'visitEndDate';
      setForm(key, date.toISOString());
    }
  };

  const handleRestart = async () => {
    setForm('visitStartDate', '');
    setForm('visitEndDate', '');
    setForm('note', '');
    await onRestart?.();
  };

  return (
    <View className={styles.containerCard}>
      {status === 'completed' && (
        <View className="flex flex-row justify-between">
          <View className="w-2/3 justify-center">
            <ThemedText>Este territorio se completó:</ThemedText>
            <TouchableOpacity onPress={() => setShowPicker('end')}>
              <Text className="text-2xl font-bold text-green-500">
                {form.visitEndDate
                  ? new Date(form.visitEndDate).toLocaleDateString()
                  : 'Seleccionar fecha'}
              </Text>
            </TouchableOpacity>
          </View>
          <View className="flex w-1/3 items-end">
            <SmallSquareButton
              text="REINICIAR"
              icon="refresh-circle"
              onPress={handleRestart}
              isSelected={true}
            />
          </View>
        </View>
      )}

      {status === 'ready' && (
        <View className="flex flex-row justify-between">
          <View className=" w-2/3  justify-center">
            <ThemedText>Este territorio aún no ha iniciado...</ThemedText>
          </View>
          <View className="flex w-1/3 items-end">
            <SmallSquareButton
              text="INICIAR"
              icon="play-circle"
              onPress={onStart}
              isSelected={true}
            />
          </View>
        </View>
      )}

      {status === 'incomplete' && (
        <View className="flex flex-row justify-between">
          <View className=" w-2/3  justify-center">
            <ThemedText>Este territorio está iniciado...</ThemedText>
            <TouchableOpacity onPress={() => setShowPicker('start')}>
              <Text className="justify-center text-2xl font-bold text-yellow-500">
                {form.visitStartDate
                  ? new Date(form.visitStartDate).toLocaleDateString()
                  : 'Seleccionar fecha'}
              </Text>
            </TouchableOpacity>
          </View>
          <View className="flex w-1/3 items-end">
            <SmallSquareButton
              text="TERMINAR"
              icon="checkmark-circle"
              onPress={onEnd}
              isSelected={true}
            />
          </View>
        </View>
      )}

      {showPicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => handleDateChange(showPicker, selectedDate)}
        />
      )}
    </View>
  );
};
