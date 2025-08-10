// components/AddHouseForm.tsx
import { View, TextInput } from "react-native";
import { CustomButton } from "./CustomButton";
import { styles } from "./styles";

export const AddHouseForm = ({ formHouse, onChange, onSave, onCancel }: any) => (
  <View>
    <TextInput
      value={formHouse.address}
      onChangeText={(text) => onChange("address", text)}
      placeholder="Dirección o Detalles"
      className={styles.input}
    />
    <TextInput
      value={formHouse.reason}
      onChangeText={(text) => onChange("reason", text)}
      placeholder="Razón (Opcional)"
      className={styles.input}
    />
    <CustomButton text="Guardar" onPress={onSave} variant="primary" className="mt-2.5" />
    <CustomButton text="Cancelar" onPress={onCancel} variant="secondary" className="mt-2" />
  </View>
);
