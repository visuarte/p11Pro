import { useEffect, useState } from 'react';

export function useBridgeHealth() {
  const [status, setStatus] = useState<{ status: string; version: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!window.koliAPI) {
      setError('KoliAPI not available');
      return;
    }

    const checkStatus = async () => {
      try {
        const result = await window.koliAPI.getBridgeStatus();
        setStatus(result);
        setError(null);
      } catch (err) {
        setError(`Failed to get bridge status: ${err}`);
        setStatus(null);
      }
    };

    const interval = setInterval(checkStatus, 30000); // 30 seconds
    checkStatus(); // Initial check

    return () => clearInterval(interval);
  }, []);

  return { status, error, isLoading: status === null && error === null };
}