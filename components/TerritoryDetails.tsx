import React, { useEffect, useState } from 'react';
import { Territory } from '~/types/Territory';
import {
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Platform,
  Keyboard,
} from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
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
  onAddingHouse: (isAdding: boolean) => void;
  currentLocation: { latitude: number; longitude: number } | null;
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
    onAddingHouse(true);
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
      onAddingHouse(false);
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
      note: '',
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
      note: '',
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

  return (
    <KeyboardAvoidingView
      className="absolute h-full w-full items-center justify-end"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <MotiView
          className="z-20 flex flex-col w-full gap-2 overflow-hidden rounded-3xl bg-slate-200 p-4 shadow-lg"
          from={{ translateY: 300, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          exit={{ translateY: 300, opacity: 0 }}
          transition={{ type: 'spring', damping: 15, stiffness: 150 }}>
          
          <AnimatePresence exitBeforeEnter>
            {!isEditing ? (
              <MotiView
                key="normal-view"
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'timing', duration: 300 }}>
                
                <AnimatePresence exitBeforeEnter>
                  {!isAddingHouse ? (
                    // Vista normal del territorio
                    <MotiView
                      key="territory-view"
                      from={{ opacity: 0, translateX: -50 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      exit={{ opacity: 0, translateX: 50 }}
                      transition={{ type: 'timing', duration: 250 }}>
                      
                      {/* Header con botones */}
                      <MotiView 
                        className="w-full flex-row items-center justify-end gap-2"
                        from={{ opacity: 0, translateY: -20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ delay: 100, type: 'timing', duration: 300 }}>
                        <MotiView
                          from={{ scale: 0, rotate: '180deg' }}
                          animate={{ scale: 1, rotate: '0deg' }}
                          transition={{ delay: 200, type: 'spring', damping: 15 }}>
                          <TouchableOpacity
                            className="rounded-full bg-red-600 p-2"
                            onPress={handleAddHouseClick}>
                            <Ionicons name="home-outline" size={22} color="white" />
                          </TouchableOpacity>
                        </MotiView>
                        
                        <MotiView
                          from={{ scale: 0, rotate: '180deg' }}
                          animate={{ scale: 1, rotate: '0deg' }}
                          transition={{ delay: 250, type: 'spring', damping: 15 }}>
                          <TouchableOpacity
                            className="rounded-full bg-slate-500 p-2"
                            onPress={() => setIsEditing(true)}>
                            <Ionicons name="create-outline" size={22} color="white" />
                          </TouchableOpacity>
                        </MotiView>
                        
                        <MotiView
                          from={{ scale: 0, rotate: '180deg' }}
                          animate={{ scale: 1, rotate: '0deg' }}
                          transition={{ delay: 300, type: 'spring', damping: 15 }}>
                          <TouchableOpacity 
                            className="rounded-full bg-slate-500 p-2" 
                            onPress={onClose}>
                            <Ionicons name="close-circle-outline" size={22} color="white" />
                          </TouchableOpacity>
                        </MotiView>
                      </MotiView>

                      <MotiView
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ delay: 200, type: 'timing', duration: 400 }}>
                        <TerritoryHeader territory={territory} isVisit={isVisitActive} />
                      </MotiView>

                      <MotiView
                        from={{ opacity: 0, translateY: 30 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ delay: 300, type: 'timing', duration: 400 }}>
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
                      </MotiView>

                      {isVisitActive && (
                        <MotiView
                          className="bg-white p-2"
                          from={{ opacity: 0, scale: 0.8, translateY: 20 }}
                          animate={{ opacity: 1, scale: 1, translateY: 0 }}
                          exit={{ opacity: 0, scale: 0.8, translateY: -20 }}
                          transition={{ type: 'spring', damping: 20, stiffness: 300 }}>
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
                        </MotiView>
                      )}
                    </MotiView>
                  ) : (
                    // Vista de agregar casa
                    <MotiView
                      key="add-house-view"
                      className={styles.containerCard}
                      from={{ opacity: 0, translateX: 100 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      exit={{ opacity: 0, translateX: -100 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 300 }}>
                      
                      <MotiView
                        from={{ opacity: 0, translateY: -20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ delay: 100, type: 'timing', duration: 300 }}>
                        <MotiView className="w-full flex-row items-center justify-between">
                          <Text className="text-2xl font-bold">Agregar Nueva Casa</Text>
                          <TouchableOpacity
                            className="rounded-full bg-slate-500 p-2"
                            onPress={handleCancelAddHouse}>
                            <Ionicons name="close-circle-outline" size={22} color="white" />
                          </TouchableOpacity>
                        </MotiView>
                        <Text className="mb-2 text-sm text-gray-600">
                          Haz click en el mapa para poner la casa
                        </Text>
                      </MotiView>

                      <MotiView
                        from={{ opacity: 0, translateY: 30 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ delay: 200, type: 'timing', duration: 400 }}>
                        <AddHouseForm
                          formHouse={formHouse}
                          onChange={handleChangeHouse}
                          onSave={handleSaveHouse}
                          onCancel={handleCancelAddHouse}
                        />
                      </MotiView>
                    </MotiView>
                  )}
                </AnimatePresence>
              </MotiView>
            ) : (
              // Vista de edición
              <MotiView
                key="edit-view"
                className={styles.containerCard}
                from={{ opacity: 0, scale: 0.9, rotateX: '45deg' }}
                animate={{ opacity: 1, scale: 1, rotateX: '0deg' }}
                exit={{ opacity: 0, scale: 0.9, rotateX: '-45deg' }}
                transition={{ type: 'spring', damping: 15, stiffness: 200 }}>
                
                <MotiView
                  from={{ opacity: 0, translateY: -30 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: 100, type: 'timing', duration: 300 }}>
                  <MotiView className="w-full flex-row items-center justify-between">
                    <Text className="text-2xl font-bold">Editar Territorio</Text>
                    <TouchableOpacity
                      className="rounded-full bg-slate-500 p-2"
                      onPress={() => setIsEditing(false)}>
                      <Ionicons name="close-circle-outline" size={22} color="white" />
                    </TouchableOpacity>
                  </MotiView>
                </MotiView>

                <MotiView
                  from={{ opacity: 0, translateX: -50 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ delay: 200, type: 'timing', duration: 400 }}>
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
                    value={form.color}
                    onChangeText={(text) => handleChange('color', text)}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                  />
                </MotiView>

                <MotiView
                  from={{ opacity: 0, translateY: 30 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: 400, type: 'timing', duration: 300 }}>
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
                </MotiView>
              </MotiView>
            )}
          </AnimatePresence>
        </MotiView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

TerritoryDetails.displayName = 'TerritoryDetails';
export default TerritoryDetails;