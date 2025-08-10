// components/HouseList.tsx
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./styles";

export const HouseList = ({ houses, loading, onEdit, onDelete }: any) => {
  if (loading) return <Text>Cargando casas...</Text>;

  return (
    <View className={styles.containerCard}>
      {houses.map((house: any) => (
        <View key={house.id} className={styles.houseItem}>
          <View>
            <Text className="font-bold">{house.address}</Text>
            <Text className="text-xs text-gray-600">Motivo: {house.reason}</Text>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity onPress={() => onEdit(house.id)}>
              <Ionicons name="pencil" size={20} color="blue" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(house.id)}>
              <Ionicons name="trash" size={20} color="red" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
};
