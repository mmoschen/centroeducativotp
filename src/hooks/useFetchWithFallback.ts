import { useEffect, useState } from 'react';

// Carga datos remotos y, ante cualquier error, devuelve el contenido de respaldo,
// para que el sitio muestre contenido aunque el backend no esté disponible.
export function useFetchWithFallback<T>(
  fetchData: () => Promise<T>,
  fallback: T,
): T {
  const [data, setData] = useState<T>(fallback);

  useEffect(() => {
    // El flag `active` evita setear estado después de desmontar el componente
    // (previene el warning de React y actualizaciones sobre componentes desmontados).
    let active = true;
    fetchData()
      .then((result) => { if (active) setData(result); })
      .catch(() => { if (active) setData(fallback); });
    return () => { active = false; };
  }, [fetchData, fallback]);

  return data;
}
