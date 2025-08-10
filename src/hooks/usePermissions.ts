import { useState, useEffect } from 'react';
import { authService } from '../services/authService';

export const usePermissions = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      const currentUser = authService.getCurrentUser();
      console.log('Current user:', currentUser?.email);
      
      if (currentUser) {
        const role = await authService.getUserRole(currentUser.uid);
        console.log('User role:', role);
        setIsAdmin(role === 'admin');
      }
      setIsLoading(false);
    };

    checkPermissions();
  }, []);

  return { isAdmin, isLoading };
};