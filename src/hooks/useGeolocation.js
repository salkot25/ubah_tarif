import { useState, useCallback } from 'react';

/**
 * Hook untuk mendapatkan koordinat GPS dari browser
 */
export function useGeolocation() {
  const [coords,   setCoords]   = useState({ lat: '', lng: '' });
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Browser tidak mendukung geolokasi');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude.toFixed(10),
          lng: position.coords.longitude.toFixed(10),
        });
        setLoading(false);
      },
      (err) => {
        let msg = 'Gagal mendapatkan lokasi';
        if (err.code === err.PERMISSION_DENIED) msg = 'Akses lokasi ditolak. Izinkan akses lokasi di browser.';
        if (err.code === err.POSITION_UNAVAILABLE) msg = 'Informasi lokasi tidak tersedia';
        if (err.code === err.TIMEOUT) msg = 'Permintaan lokasi timeout';
        setError(msg);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  const clearCoords = () => setCoords({ lat: '', lng: '' });

  return { coords, loading, error, getCurrentPosition, clearCoords };
}
