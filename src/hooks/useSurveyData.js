import { useState, useEffect, useCallback } from 'react';
import { getSurveys, getStats, saveSurvey, deletePermohonan } from '../services/api';

/**
 * Hook untuk mengelola data survey lapangan — fetch, save, delete
 */
export function useSurveyData() {
  const [surveys, setSurveys]   = useState([]);
  const [stats,   setStats]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState(null);
  const [meta,    setMeta]      = useState({ total: 0, page: 1, totalPages: 1 });
  const [filters, setFilters]   = useState(() => {
    const savedLimit = Number(localStorage.getItem('SETTING_PER_PAGE')) || 20;
    return { search: '', statusSurvey: '', page: 1, limit: savedLimit, sortBy: '', sortOrder: 'ASC' };
  });

  // ── Fetch Data ──────────────────────────────────────────────────────────────
  const fetchSurveys = useCallback(async (overrideFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const f = { ...filters, ...overrideFilters };
      const res = await getSurveys(f);
      if (res.status === 'success') {
        setSurveys(res.data || []);
        setMeta(res.meta || { total: 0, page: 1, totalPages: 1 });
      } else {
        setError(res.message || 'Gagal memuat data survey');
      }
    } catch (err) {
      setError('Gagal terhubung ke server. Periksa koneksi internet Anda.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await getStats();
      if (res.status === 'success') setStats(res.data);
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  }, []);

  // ── Auto-fetch on filter change ──────────────────────────────────────────────
  useEffect(() => {
    fetchSurveys();
  }, [filters]);

  // ── Save (Create/Update) ────────────────────────────────────────────────────
  const handleSave = async (data) => {
    const res = await saveSurvey(data);
    if (res.status === 'success') {
      await fetchSurveys();
      await fetchStats();
    }
    return res;
  };

  // ── Delete (Hapus permohonan & survey terkait) ──────────────────────────────
  const handleDelete = async (idpel) => {
    const res = await deletePermohonan(idpel);
    if (res.status === 'success') {
      setSurveys(prev => prev.filter(s => String(s.IDPEL) !== String(idpel)));
      await fetchStats();
    }
    return res;
  };

  // ── Update Filters ───────────────────────────────────────────────────────────
  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const setPage = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const setLimit = (limit) => {
    const lim = Number(limit) || 20;
    setFilters(prev => ({ ...prev, limit: lim, page: 1 }));
    localStorage.setItem('SETTING_PER_PAGE', lim);
  };

  const setSort = (field) => {
    setFilters(prev => {
      if (prev.sortBy !== field) {
        return { ...prev, sortBy: field, sortOrder: 'ASC', page: 1 };
      }
      if (prev.sortOrder === 'ASC') {
        return { ...prev, sortOrder: 'DESC', page: 1 };
      }
      return { ...prev, sortBy: '', sortOrder: 'ASC', page: 1 };
    });
  };

  return {
    surveys,
    stats,
    loading,
    error,
    meta,
    filters,
    fetchSurveys,
    fetchStats,
    handleSave,
    handleDelete,
    updateFilters,
    setPage,
    setLimit,
    setSort,
    refetch: fetchSurveys,
  };
}
