// components/VisitDateSection.tsx
import { View, Text, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CustomButton } from './CustomButton';
import { styles } from './styles';

export const VisitDateSection = ({
  form,
  isVisitActive,
  startDisabled,
  endDisabled,
  showStartPicker,
  showEndPicker,
  setShowStartPicker,
  setShowEndPicker,
  onStart,
  onEnd,
  setForm,
}: any) => {
  return (
    <View className="rounded-2xl bg-white p-3 ">
      {!isVisitActive ? (
        <View className="flex flex-row justify-between">
          <View className="w-2/3 items-center justify-center">
            <Text>Este territorio se completó:</Text>
            <TouchableOpacity onPress={() => setShowEndPicker(true)}>
              <Text className="text-2xl font-bold text-blue-500">
                {form.visitEndDate
                  ? new Date(form.visitEndDate).toLocaleDateString()
                  : 'Seleccionar fecha'}
              </Text>
            </TouchableOpacity>
          </View>

          {showEndPicker && (
            <DateTimePicker
              value={form.visitEndDate ? new Date(form.visitEndDate) : new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowEndPicker(false);
                if (selectedDate) {
                  setForm({ ...form, visitEndDate: selectedDate.toISOString() });
                }
              }}
            />
          )}
          <View className="flex w-1/3">
            <CustomButton
              text="INICIAR"
              onPress={onStart}
              disabled={startDisabled}
              variant={startDisabled ? 'secondary' : 'primary'}
              className={startDisabled ? 'bg-gray-300' : 'bg-green-500'}
              fullWidth={true}
            />
          </View>
        </View>
      ) : (
        <View className="flex flex-row   justify-between  ">
          <View>
            <Text>Este territorio está iniciado...</Text>
            <TouchableOpacity onPress={() => setShowStartPicker(true)}>
              <Text className="text-2xl font-bold text-blue-500">
                {form.visitStartDate
                  ? new Date(form.visitStartDate).toLocaleDateString()
                  : 'Seleccionar fecha'}
              </Text>
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker
                value={form.visitStartDate ? new Date(form.visitStartDate) : new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowStartPicker(false);
                  if (selectedDate) {
                    setForm({ ...form, visitStartDate: selectedDate.toISOString() });
                  }
                }}
              />
            )}
          </View>
          <View className="flex w-1/3">
            <CustomButton
              text="TERMINAR"
              onPress={onEnd}
              disabled={endDisabled}
              variant={endDisabled ? 'secondary' : 'primary'}
              className={endDisabled ? 'bg-gray-300' : 'bg-green-500'}
              fullWidth={true}
            />
          </View>
        </View>
      )}
    </View>
  );
};
