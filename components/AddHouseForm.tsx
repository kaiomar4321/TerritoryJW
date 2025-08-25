// components/AddHouseForm.tsx
import { View, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { CustomButton } from './CustomButton';
import { styles } from './styles';
import { CustomTextInput } from './CustomTextInput';

export const AddHouseForm = ({ formHouse, onChange, onSave, onCancel }: any) => (
  <View>
    <CustomTextInput
      placeholder="Dirección o Detalles"
      value={formHouse.address}
      onChangeText={(text) => onChange('address', text)}
      autoCapitalize="none"
      keyboardType="email-address"
      autoComplete="email"
    />
    <CustomTextInput
      placeholder="Razón (Opcional)"
      value={formHouse.reason}
      onChangeText={(text) => onChange('reason', text)}
      autoCapitalize="none"
      keyboardType="email-address"
      autoComplete="email"
    />

    <CustomButton text="Guardar" onPress={onSave} variant="primary" className="mt-2.5" />
    <CustomButton text="Cancelar" onPress={onCancel} variant="secondary" className="mt-2" />
  </View>
);
