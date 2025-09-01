import React, { useEffect, useState } from 'react';
import { Territory } from '~/types/Territory';
import { KeyboardAvoidingView, TouchableWithoutFeedback, Platform, Keyboard } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { useHouses } from '~/hooks/useHouses';
import TerritoryNormalView from './TerritoryNormalView';
import AddHouseCard from './AddHouseCard';
import TerritoryEditForm from './TerritoryEditForm';

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

  const [formHouse, setFormHouse] = useState({ address: '', reason: '' });
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

  // 📌 Handlers
  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    await onUpdate(territory.id, form);
    setIsEditing(false);
  };

  const handleAddHouseClick = () => {
    setIsAddingHouse(true);
    onAddingHouse(true);
  };

  const handleChangeHouse = (key: keyof typeof formHouse, value: string) => {
    setFormHouse((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveHouse = async () => {
    if (!currentLocation) {
      alert('Por favor selecciona una ubicación en el mapa');
      return;
    }
    await addHouse(formHouse.address, formHouse.reason, currentLocation);
    setIsAddingHouse(false);
    onAddingHouse(false);
    setFormHouse({ address: '', reason: '' });
  };

  const handleCancelAddHouse = () => {
    setIsAddingHouse(false);
    onAddingHouse(false);
    setFormHouse({ address: '', reason: '' });
  };

  const handleStartVisit = async () => {
    const today = new Date().toISOString();
    const updated = { ...form, visitStartDate: today, visitEndDate: '', note: '' };
    setForm(updated);
    await onUpdate(territory.id, updated);
  };

  const handleEndVisit = async () => {
    if (!form.visitStartDate) return;
    const today = new Date().toISOString();
    const updated = { ...form, visitEndDate: today, note: '' };
    setForm(updated);
    await onUpdate(territory.id, updated);
  };

  const handleSaveNote = async () => {
    await onUpdate(territory.id, { note: form.note });
  };

  // 📌 Estados derivados
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
          className="z-20 flex w-full flex-col gap-2 overflow-hidden  bg-slate-200 p-4 shadow-lg"
          from={{ translateY: 300, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          exit={{ translateY: 300, opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 150 }}>
          <AnimatePresence exitBeforeEnter>
            {!isEditing ? (
              !isAddingHouse ? (
                <TerritoryNormalView
                  territory={territory}
                  form={form}
                  isVisitActive={isVisitActive}
                  onStartVisit={handleStartVisit}
                  onEndVisit={handleEndVisit}
                  onSaveNote={handleSaveNote}
                  onChangeForm={handleChange}
                  onClose={onClose}
                  onEdit={() => setIsEditing(true)}
                  onAddHouse={handleAddHouseClick}
                />
              ) : (
                <AddHouseCard
                  formHouse={formHouse}
                  onChangeHouse={handleChangeHouse}
                  onSaveHouse={handleSaveHouse}
                  onCancel={handleCancelAddHouse}
                />
              )
            ) : (
              <TerritoryEditForm
                form={form}
                onChange={handleChange}
                onSave={handleSave}
                onCancel={() => setIsEditing(false)}
              />
            )}
          </AnimatePresence>
        </MotiView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

TerritoryDetails.displayName = 'TerritoryDetails';
export default TerritoryDetails;
