import { useState, useEffect } from 'react';
import { Congregation } from '~/types/Congregation';
import { congregationService } from '~/services/congregationService';

export function useCongregation() {
  const [congregations, setCongregations] = useState<Congregation[]>([]);
  const [loading, setLoading] = useState(true);

  async function reload() {
    setLoading(true);
    try {
      const data = await congregationService.getAll();
      setCongregations(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  return { congregations, loading, reload };
}
