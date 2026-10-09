import { useCallback, useEffect, useState } from 'react';
import { fetchLegends, type LegendsData } from '@/lib/legends';

export function useLegends() {
  const [data, setData] = useState<LegendsData | null>(null);
  const [error, setError] = useState(false);
  const load = useCallback(() => {
    setError(false);
    fetchLegends().then(setData).catch(() => setError(true));
  }, []);
  useEffect(load, [load]);
  return { data, error, reload: load };
}
