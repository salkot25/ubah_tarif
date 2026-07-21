/**
 * ─── Offline-Online Synchronization Engine ─────────────────────────────────────
 * Robust offline queue, caching, and background automatic synchronization service.
 */

const QUEUE_KEY = 'SALKOT_OFFLINE_QUEUE';
const CACHE_PREFIX = 'SALKOT_CACHE_';

export const offlineSyncService = {
  // Check browser network status
  isOnline() {
    return navigator.onLine;
  },

  // ─── QUEUE MANAGEMENT ──────────────────────────────────────────────────────
  getQueue() {
    try {
      const stored = localStorage.getItem(QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error reading offline queue:', e);
      return [];
    }
  },

  saveQueue(queue) {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      window.dispatchEvent(new CustomEvent('offline-queue-changed', { detail: { count: queue.length } }));
    } catch (e) {
      console.error('Error saving offline queue:', e);
    }
  },

  enqueue(actionType, payload) {
    const queue = this.getQueue();
    const newItem = {
      id: 'queue_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      actionType, // 'savePermohonan', 'saveSurvey', 'deletePermohonan'
      payload,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };

    // Replace if same IDPEL mutation exists in queue to avoid redundant calls
    const idpel = payload?.data?.IDPEL || payload?.IDPEL || payload?.idpel;
    if (idpel) {
      const existingIdx = queue.findIndex(q => {
        const qIdpel = q.payload?.data?.IDPEL || q.payload?.IDPEL || q.payload?.idpel;
        return q.actionType === actionType && qIdpel === idpel;
      });
      if (existingIdx !== -1) {
        queue[existingIdx] = newItem;
        this.saveQueue(queue);
        return newItem;
      }
    }

    queue.push(newItem);
    this.saveQueue(queue);
    return newItem;
  },

  dequeue(id) {
    const queue = this.getQueue().filter(item => item.id !== id);
    this.saveQueue(queue);
  },

  clearQueue() {
    localStorage.removeItem(QUEUE_KEY);
    window.dispatchEvent(new CustomEvent('offline-queue-changed', { detail: { count: 0 } }));
  },

  // ─── LOCAL CACHING FOR GET REQUESTS ───────────────────────────────────────
  setCache(key, data) {
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('Cache quota exceeded or storage error:', e);
    }
  },

  getCache(key) {
    try {
      const stored = localStorage.getItem(CACHE_PREFIX + key);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return parsed.data;
    } catch (e) {
      return null;
    }
  },

  // Optimistically update cached list when offline save occurs
  updateCachedList(listKey, newItem, isDelete = false) {
    const cached = this.getCache(listKey);
    if (!cached || !Array.isArray(cached.data)) return;

    const idpel = newItem.IDPEL || newItem.idpel;
    if (!idpel) return;

    let updatedList = [...cached.data];
    if (isDelete) {
      updatedList = updatedList.filter(item => item.IDPEL !== idpel);
    } else {
      const idx = updatedList.findIndex(item => item.IDPEL === idpel);
      if (idx !== -1) {
        updatedList[idx] = { ...updatedList[idx], ...newItem, offlinePending: true };
      } else {
        updatedList.unshift({ ...newItem, offlinePending: true });
      }
    }

    this.setCache(listKey, { ...cached, data: updatedList, total: updatedList.length });
  },

  // ─── SYNCHRONIZATION PROCESSOR ─────────────────────────────────────────────
  async syncPendingQueue(apiMethods) {
    if (!this.isOnline()) return { synced: 0, failed: 0 };
    
    const queue = this.getQueue();
    if (queue.length === 0) return { synced: 0, failed: 0 };

    window.dispatchEvent(new CustomEvent('sync-started'));

    let synced = 0;
    let failed = 0;

    for (const item of queue) {
      try {
        let result;
        if (item.actionType === 'savePermohonan') {
          result = await apiMethods.savePermohonanDirect(item.payload.data);
        } else if (item.actionType === 'saveSurvey') {
          result = await apiMethods.saveSurveyDirect(item.payload.data);
        } else if (item.actionType === 'deletePermohonan') {
          result = await apiMethods.deletePermohonanDirect(item.payload.idpel);
        }

        if (result && (result.status === 'success' || result.success)) {
          this.dequeue(item.id);
          synced++;
        } else {
          failed++;
        }
      } catch (err) {
        console.error('Failed syncing item:', item, err);
        failed++;
      }
    }

    window.dispatchEvent(new CustomEvent('sync-completed', { detail: { synced, failed } }));
    return { synced, failed };
  }
};
