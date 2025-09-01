// components/VisitDateSection.tsx
import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CustomButton } from './CustomButton';
import { styles } from './styles';
import { getTerritoryStatus } from '~/utils/territoryStatus';
export const VisitDateSection = ({ form, setForm, onStart, onEnd }: any) => {
  const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);

  const status = getTerritoryStatus(form).id;

  const handleDateChange = (type: 'start' | 'end', date?: Date) => {
    setShowPicker(null);
    if (date) {
      setForm({
        ...form,
        [type === 'start' ? 'visitStartDate' : 'visitEndDate']: date.toISOString(),
      });
    }
  };

  return (
    <View className={styles.containerCard}>
      {status === 'completed' && (
        <View className="flex flex-row justify-between">
          <View className="w-full items-center justify-center">
            <Text>Este territorio se completó:</Text>
            <TouchableOpacity onPress={() => setShowPicker('end')}>
              <Text className="text-2xl font-bold text-green-500">
                {form.visitEndDate
                  ? new Date(form.visitEndDate).toLocaleDateString()
                  : 'Seleccionar fecha'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {status === 'ready' && (
        <View className="flex flex-row justify-between">
          <View className='  justify-center'>
            <Text>Este territorio aún no ha iniciado...</Text>
          </View>
          <View className="flex w-1/3">
            <CustomButton
              text="INICIAR"
              onPress={onStart}
              variant="primary"
              className="bg-green-500"
              fullWidth
            />
          </View>
        </View>
      )}

      {status === 'incomplete' && (
        <View className="flex flex-row justify-between">
          <View>
            <Text>Este territorio está iniciado...</Text>
            <TouchableOpacity onPress={() => setShowPicker('start')}>
              <Text className="text-2xl font-bold text-yellow-500">
                {form.visitStartDate
                  ? new Date(form.visitStartDate).toLocaleDateString()
                  : 'Seleccionar fecha'}
              </Text>
            </TouchableOpacity>
          </View>
          <View className="flex w-1/3">
            <CustomButton
              text="TERMINAR"
              onPress={onEnd}
              variant="primary"
              className="bg-green-500"
              fullWidth
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
