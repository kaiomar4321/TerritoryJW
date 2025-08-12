// components/AddHouseForm.tsx
import { View, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { CustomButton } from './CustomButton';
import { styles } from './styles';

export const AddHouseForm = ({ formHouse, onChange, onSave, onCancel }: any) => (
  <KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
    <View>
      <TextInput
        value={formHouse.address}
        onChangeText={(text) => onChange('address', text)}
        placeholder="Dirección o Detalles"
        className={styles.input}
      />
      <TextInput
        value={formHouse.reason}
        onChangeText={(text) => onChange('reason', text)}
        placeholder="Razón (Opcional)"
        className={styles.input}
      />
      <CustomButton text="Guardar" onPress={onSave} variant="primary" className="mt-2.5" />
      <CustomButton text="Cancelar" onPress={onCancel} variant="secondary" className="mt-2" />
    </View>
  </KeyboardAvoidingView>
);
