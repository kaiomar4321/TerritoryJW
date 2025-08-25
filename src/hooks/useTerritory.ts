import { useState, useEffect, useMemo } from 'react';
import { territoryService } from '../services/territoryService';
import { auth } from '../config/firebase';
import { Territory } from '~/types/Territory';

export const useTerritory = () => {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [drawingCoordinates, setDrawingCoordinates] = useState<any[]>([]);
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  useEffect(() => {
    setDrawingCoordinates([]);
  }, [isEditMode]);

  useEffect(() => {
    const unsubscribe = territoryService.subscribeToTerritories((newTerritories) => {
      setTerritories(newTerritories);
    });

    return () => unsubscribe();
  }, []);

  const saveTerritory = async () => {
    if (drawingCoordinates.length >= 3) {
      if (auth.currentUser) {
        await territoryService.saveTerritory(drawingCoordinates, auth.currentUser.uid);
        setDrawingCoordinates([]);
        setIsEditMode(false);
      } else {
        alert('Usuario no autenticado. No se puede guardar el territorio.');
      }
    } else {
      alert('Se necesitan al menos 3 puntos para crear un territorio');
    }
  };

  const updateTerritory = async (id: string, updates: Partial<Territory>) => {
    try {
      await territoryService.updateTerritory(id, updates);
      setSelectedTerritory(null); // opcional: cerrar vista después de editar
    } catch (error) {
      alert('Error al actualizar el territorio.');
      console.log(error);
    }
  };

  const handleMapPress = (e: { nativeEvent: { coordinate: any } }, isAdmin: boolean) => {
    if (isEditMode && isAdmin && auth.currentUser) {
      setDrawingCoordinates([...drawingCoordinates, e.nativeEvent.coordinate]);
    }
  };

  const onNoteChange = async (note: string) => {
    if (!selectedTerritory) return;

    try {
      await updateTerritory(selectedTerritory.id, { note });
    } catch (error) {
      console.error('Error actualizando la nota del territorio:', error);
    }
  };

const filteredTerritories = useMemo(() => {
    if (!selectedFilter) return territories;

    if (selectedFilter === 'active') {
      return territories.filter((t) => t.visitStartDate && !t.visitEndDate);
    }
    if (selectedFilter === 'completed') {
      return territories.filter((t) => t.visitEndDate);
    }
    return territories;
  }, [territories, selectedFilter]);

  return {
    territories,
    isEditMode,
    setIsEditMode,
    drawingCoordinates,
    setDrawingCoordinates,
    saveTerritory,
    handleMapPress,
    selectedTerritory,
    setSelectedTerritory,
    updateTerritory,
    onNoteChange,
    selectedFilter,
    setSelectedFilter,
    filteredTerritories
  };
};
