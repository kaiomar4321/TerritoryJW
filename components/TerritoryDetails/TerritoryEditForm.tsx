import React, { useState } from 'react';
import { Text, TouchableOpacity, Modal, View } from 'react-native';
import { MotiView } from 'moti';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CustomTextInput } from '../CustomTextInput';
import { CustomButton } from 'components/CustomButton';
import { styles } from '../styles';
import { usePermissions } from '~/hooks/usePermissions';

type Props = {
  form: any;
  onChange: (key: any, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
};

const TerritoryEditForm: React.FC<Props> = ({ form, onChange, onSave, onCancel, onDelete }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { isAdmin } = usePermissions();
  const handleDeletePress = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    onDelete();
    setShowDeleteModal(false);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  return (
    <>
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

        <MotiView
          className=" flex gap-2.5"
          from={{ opacity: 0, translateX: -50 }}
          animate={{ opacity: 1, translateX: 0 }}>
          <CustomTextInput
            iconLeft="map-outline"
            placeholder="Nombre"
            value={form.name}
            onChangeText={(t) => onChange('name', t)}
          />
          <CustomTextInput
            iconLeft="keypad-outline"
            placeholder="Numero"
            value={String(form.number)}
            onChangeText={(t) => onChange('number', t)}
            keyboardType="decimal-pad"
          />
          <CustomTextInput
            iconLeft="color-fill-outline"
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
          {isAdmin && (
            <CustomButton
              text="Eliminar"
              onPress={handleDeletePress}
              variant="secondary"
              className="mt-2"
            />
          )}
        </MotiView>
      </MotiView>

      {/* Modal de Confirmación */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={handleDeleteCancel}>
        <View className="flex-1 items-center justify-center bg-black/50 px-6">
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 300 }}
            className="w-full max-w-sm rounded-2xl bg-white p-6">
            <View className="mb-4 items-center">
              <View className="mb-3 rounded-full bg-red-100 p-3">
                <Ionicons name="trash-outline" size={32} color="#dc2626" />
              </View>
              <Text className="mb-2 text-xl font-bold text-gray-900">¿Eliminar territorio?</Text>
              <Text className="text-center leading-5 text-gray-600">
                Esta acción no se puede deshacer. El territorio será eliminado permanentemente.
              </Text>
            </View>

            <View className="space-y-3">
              <CustomButton
                text="Sí, eliminar"
                onPress={handleDeleteConfirm}
                variant="primary"
                className="bg-red-600"
              />
              <CustomButton text="Cancelar" onPress={handleDeleteCancel} variant="secondary" />
            </View>
          </MotiView>
        </View>
      </Modal>
    </>
  );
};

export default TerritoryEditForm;
