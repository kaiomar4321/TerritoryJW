import React, { useEffect, useState } from 'react';
import { Territory } from '~/types/Territory';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Platform,
  Keyboard,
} from 'react-native';
import { CustomTextInput } from './CustomTextInput';
import { useHouses } from '~/hooks/useHouses';
import { CustomButton } from 'components/CustomButton';

import Ionicons from '@expo/vector-icons/Ionicons';

import TerritoryHeader from './TerritoryHeader';
import { AddHouseForm } from './AddHouseForm';

import { VisitDateSection } from './VisitDateSection';
import { styles } from './styles';

type Props = {
  territory: Territory | null;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<Territory>) => Promise<void>;
  onAddingHouse: (isAdding: boolean) => void; // Nuevo prop
  currentLocation: { latitude: number; longitude: number } | null; // Nuevo prop
};

const TerritoryDetails: React.FC<Props> = ({
  territory,
  onClose,
  onUpdate,
  onAddingHouse,
  currentLocation,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingHouse, setIsAddingHouse] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const { addHouse } = useHouses(territory?.id ?? null);

  const [formHouse, setFormHouse] = useState({
    address: '',
    reason: '',
  });

  const [form, setForm] = useState({
    name: '',
    createdBy: '',
    color: '',
    number: 0,
    visitStartDate: '',
    visitEndDate: '',
    note: '',
  });

  useEffect(() => {
    if (territory) {
      setForm({
        name: territory.name || '',
        createdBy: territory.createdBy || '',
        color: territory.color || '',
        number: territory.number || 0,
        visitStartDate: territory.visitStartDate || '',
        visitEndDate: territory.visitEndDate || '',
        note: territory.note || '',
      });
      setIsEditing(false);
    }
  }, [territory]);

  if (!territory) return null;

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    await onUpdate(territory.id, form);
    setIsEditing(false);
  };
  const handleAddHouseClick = async () => {
    setIsAddingHouse(true);
    onAddingHouse(true); // Notificar al mapa que estamos agregando una casa
  };

  const handleChangeHouse = (key: keyof typeof formHouse, value: string) => {
    setFormHouse((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveHouse = async () => {
    try {
      if (!currentLocation) {
        alert('Por favor selecciona una ubicación en el mapa');
        return;
      }

      await addHouse(formHouse.address, formHouse.reason, currentLocation);
      setIsAddingHouse(false);
      onAddingHouse(false); // Notificar al mapa que terminamos de agregar la casa
      setFormHouse({ address: '', reason: '' });
    } catch (error) {
      console.error('Error guardando casa', error);
      alert('Hubo un error al guardar la casa');
    }
  };

  const handleStartVisit = async () => {
    const today = new Date().toISOString();
    const updated = {
      ...form,
      visitStartDate: today,
      visitEndDate: '',
      note: '', // Limpiar nota al iniciar nueva visita
    };
    setForm(updated);
    await onUpdate(territory.id, updated);
  };

  const handleCancelAddHouse = () => {
    setIsAddingHouse(false);
    onAddingHouse(false);
    setFormHouse({ address: '', reason: '' });
  };

  const handleEndVisit = async () => {
    if (!form.visitStartDate) return;
    const today = new Date().toISOString();
    const updated = {
      ...form,
      visitEndDate: today,
      note: '', // Borrar la nota cuando se termina la visita
    };
    setForm(updated);
    await onUpdate(territory.id, updated);
  };

  const handleSaveNote = async () => {
    await onUpdate(territory.id, { note: form.note });
  };

  const startDisabled = !!form.visitStartDate && !form.visitEndDate;
  const endDisabled = !!form.visitEndDate || !form.visitStartDate;
  const isVisitActive = !!form.visitStartDate && !form.visitEndDate;
  if (!territory) return null;

  return (
    <KeyboardAvoidingView
      className=" absolute h-full w-full  items-center  justify-end "
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className=" z-20 w-full gap-2 overflow-hidden rounded-3xl bg-slate-200 p-4 shadow-lg">
          {!isEditing ? (
            <>
              {!isAddingHouse ? (
                // Vista normal del territorio
                <>
                  <View className="w-full flex-row items-center justify-end gap-2">
                    <TouchableOpacity
                      className="rounded-full bg-red-600 p-2"
                      onPress={handleAddHouseClick}>
                      <Ionicons name="home-outline" size={22} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="rounded-full bg-slate-500 p-2"
                      onPress={() => setIsEditing(true)}>
                      <Ionicons name="create-outline" size={22} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity className="rounded-full bg-slate-500 p-2" onPress={onClose}>
                      <Ionicons name="close-circle-outline" size={22} color="white" />
                    </TouchableOpacity>
                  </View>
                  <TerritoryHeader territory={territory} isVisit={isVisitActive} />
                  <VisitDateSection
                    form={form}
                    isVisitActive={isVisitActive}
                    startDisabled={startDisabled}
                    endDisabled={endDisabled}
                    showStartPicker={showStartPicker}
                    showEndPicker={showEndPicker}
                    setShowStartPicker={setShowStartPicker}
                    setShowEndPicker={setShowEndPicker}
                    onStart={handleStartVisit}
                    onEnd={handleEndVisit}
                    setForm={setForm}
                  />
                  {isVisitActive && (
                    <View className=" bg-white p-2">
                      <Text className="mb-1 mt-2.5 text-sm text-gray-600">Nota de la visita</Text>
                      <TextInput
                        value={form.note}
                        onChangeText={(text) => handleChange('note', text)}
                        placeholder="Agregar nota..."
                        className={styles.noteInput}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                      />
                      <CustomButton
                        text="Guardar nota"
                        onPress={handleSaveNote}
                        variant="primary"
                        className="mt-2 bg-cyan-500"
                      />
                    </View>
                  )}
                </>
              ) : (
                // Vista de agregar casa
                <View className={styles.containerCard}>
                  <View>
                    <View className=" w-full flex-row items-center justify-between   ">
                      <Text className="text-2xl font-bold">Agregar Nueva Casa</Text>
                      <TouchableOpacity
                        className="rounded-full bg-slate-500 p-2"
                        onPress={handleCancelAddHouse}>
                        <Ionicons name="close-circle-outline" size={22} color="white" />
                      </TouchableOpacity>
                    </View>
                    <Text className="mb-2 text-sm  text-gray-600">
                      Haz click en el mapa para poner la casa
                    </Text>
                  </View>
                  <AddHouseForm
                    formHouse={formHouse}
                    onChange={handleChangeHouse}
                    onSave={handleSaveHouse}
                    onCancel={handleCancelAddHouse}
                  />
                </View>
              )}
            </>
          ) : (
            <View className={styles.containerCard}>
              <View className=" w-full flex-row items-center justify-between   ">
                <Text className="text-2xl font-bold">Editar Territorio</Text>
                <TouchableOpacity
                  className="rounded-full bg-slate-500 p-2"
                  onPress={() => setIsEditing(false)}>
                  <Ionicons name="close-circle-outline" size={22} color="white" />
                </TouchableOpacity>
              </View>
              <CustomTextInput
                placeholder="Nombre"
                value={form.name}
                onChangeText={(text) => handleChange('name', text)}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
              <CustomTextInput
                placeholder="Numero"
                value={String(form.number)}
                onChangeText={(text) => handleChange('number', text)}
                autoCapitalize="none"
                keyboardType="decimal-pad"
                autoComplete="email"
              />
              <CustomTextInput
                placeholder="Color"
                value={form.color }
                onChangeText={(text) => handleChange('color', text)}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />

              <CustomButton
                text="Guardar cambios"
                onPress={handleSave}
                variant="primary"
                className="mt-2.5"
              />

              <CustomButton
                text="Cancelar"
                onPress={() => setIsEditing(false)}
                variant="secondary"
                className="mt-2"
              />
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};
TerritoryDetails.displayName = 'TerritoryDetails';
export default TerritoryDetails;
