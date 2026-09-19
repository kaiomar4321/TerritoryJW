import { useOfflineSWR } from '~/hooks/useOfflineSWR';
import { useUser } from '~/hooks/useUser';
import { congregationService } from '~/services/congregationService';
import { Congregation } from '~/types/Congregation';

// Congregación del usuario actual (con caché offline)
export const useMyCongregation = () => {
  const { userData } = useUser();
  const congregationId = userData?.congregationId;

  const { data, isLoading } = useOfflineSWR<Congregation | null>(
    congregationId ? `congregation/${congregationId}` : null,
    () => congregationService.getById(congregationId!),
    { revalidateOnFocus: false, ttl: 1000 * 60 * 60 * 24 * 7 }
  );

  return { congregation: data ?? null, isLoading };
};
