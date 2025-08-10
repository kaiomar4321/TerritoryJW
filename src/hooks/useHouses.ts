import { useState, useEffect } from 'react';
import { houseService, House } from '../services/houseService';
import { auth } from '../config/firebase';

export const useHouses = (territoryId: string | null) => {
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);

  useEffect(() => {
    if (!territoryId) {
      setHouses([]);
      return;
    }

    setLoading(true);
    const unsubscribe = houseService.subscribeToHousesByTerritory(territoryId, (newHouses) => {
      setHouses(newHouses);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [territoryId]);

  const addHouse = async (
    address: string,
    reason: string = '',
    coordinates: { latitude: number; longitude: number }
  ) => {
    if (!territoryId || !auth.currentUser) {
      throw new Error('No hay territorio seleccionado o usuario no autenticado');
    }

    try {
      await houseService.addHouse(territoryId, address, reason, auth.currentUser.uid, coordinates);
    } catch (error) {
      console.error('Error adding house:', error);
      throw error;
    }
  };

  const updateHouse = async (
    houseId: string,
    updates: {
      address?: string;
      reason?: string;
      coordinates?: { latitude: number; longitude: number };
    }
  ) => {
    try {
      await houseService.updateHouse(houseId, updates);
    } catch (error) {
      console.error('Error updating house:', error);
      throw error;
    }
  };

  const deleteHouse = async (houseId: string) => {
    try {
      await houseService.deleteHouse(houseId);
    } catch (error) {
      console.error('Error deleting house:', error);
      throw error;
    }
  };

  return {
    houses,
    loading,
    addHouse,
    updateHouse,
    deleteHouse,
    selectedHouse,
    setSelectedHouse
  };
};
