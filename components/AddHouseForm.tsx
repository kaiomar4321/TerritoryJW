// components/AddHouseForm.tsx
import { View } from 'react-native';
import { CustomButton } from './CustomButton';

import { CustomTextInput } from './CustomTextInput';

export const AddHouseForm = ({ formHouse, onChange, onSave, onCancel }: any) => (
  <View className="flex gap-2.5">
    <CustomTextInput
      iconLeft="home-outline"
      placeholder="Dirección o Detalles"
      value={formHouse.address}
      onChangeText={(text) => onChange('address', text)}
      autoCapitalize="none"
      keyboardType="email-address"
      autoComplete="email"
    />
    <CustomTextInput
      iconLeft="reader-outline"
      placeholder="Razón (Opcional)"
      value={formHouse.reason}
      onChangeText={(text) => onChange('reason', text)}
      autoCapitalize="none"
      keyboardType="email-address"
      autoComplete="email"
    />

    <View>
     
      <CustomButton text="Guardar" onPress={onSave} variant="primary" className="mt-2.5" />
      <CustomButton text="Cancelar" onPress={onCancel} variant="secondary" className="mt-2" />
    </View>
  </View>
);
