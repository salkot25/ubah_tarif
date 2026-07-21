import { GAS_URL } from '../config/constants';
import { offlineSyncService } from './offlineSyncService';

/**
 * ─── GAS API Service ──────────────────────────────────────────────────────────
 *
 * Google Apps Script Web App melakukan redirect 302 yang menyebabkan
 * browser fetch() kehilangan CORS headers. Solusi:
 *  - GET  → JSONP (inject <script> tag, GAS support ?callback=xxx)
 *  - POST → fetch dengan mode 'no-cors' (response opaque, parse via GET)
 */

// ─── JSONP untuk GET ──────────────────────────────────────────────────────────
function jsonp(params = {}, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const callbackName = '__gasCallback_' + Date.now() + '_' + Math.random().toString(36).slice(2);
    const url = new URL(GAS_URL);

    // Tambahkan semua params
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v));
      }
    });
    url.searchParams.set('callback', callbackName);
    
    // Auto attach token if available
    const token = localStorage.getItem('AUTH_TOKEN');
    if (token) {
      url.searchParams.set('token', token);
    }

    let timer;
    const script = document.createElement('script');

    // Cleanup function
    const cleanup = () => {
      clearTimeout(timer);
      delete window[callbackName];
      if (script.parentNode) script.parentNode.removeChild(script);
    };

    // Define callback globally
    window[callbackName] = (data) => {
      cleanup();
      if (data && data.status === 'unauthorized') {
        window.dispatchEvent(new CustomEvent('gas-unauthorized'));
      }
      resolve(data);
    };

    // Timeout
    timer = setTimeout(() => {
      cleanup();
      reject(new Error('Request timeout setelah ' + timeout + 'ms'));
    }, timeout);

    script.onerror = () => {
      cleanup();
      reject(new Error('Gagal memuat script JSONP'));
    };

    script.src = url.toString();
    document.head.appendChild(script);
  });
}

// ─── POST via fetch ───────────────────────────────────────────────────────────
async function gasPost(body = {}) {
  const token = localStorage.getItem('AUTH_TOKEN');
  const payload = { ...body };
  if (token && !payload.token) {
    payload.token = token;
  }
  
  const res = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    redirect: 'follow',
  });

  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (data && data.status === 'unauthorized') {
      window.dispatchEvent(new CustomEvent('gas-unauthorized'));
    }
    return data;
  } catch {
    console.warn('GAS POST response tidak bisa di-parse:', text.slice(0, 200));
    return { status: 'error', message: 'Response tidak valid. Pastikan GAS sudah di-deploy dengan benar.' };
  }
}

// ─── GAS GET via JSONP ────────────────────────────────────────────────────────
async function gasGet(params = {}) {
  try {
    return await jsonp(params);
  } catch (err) {
    console.error('GAS GET error:', err);
    throw err;
  }
}

// ─── DIRECT METHODS (For sync engine bypass) ──────────────────────────────────
export async function savePermohonanDirect(data) {
  return gasPost({ action: 'savePermohonan', data });
}

export async function saveSurveyDirect(data) {
  return gasPost({ action: 'saveSurvey', data });
}

export async function deletePermohonanDirect(idpel) {
  return gasPost({ action: 'deletePermohonan', idpel });
}

// ─── PUBLIC API METHODS WITH OFFLINE SUPPORT ─────────────────────────────────

/**
 * Ambil semua data permohonan dengan filter & pagination + Offline Cache
 */
export async function getPermohonans(params = {}) {
  const cacheKey = 'permohonans_' + JSON.stringify(params);
  if (!navigator.onLine) {
    const cached = offlineSyncService.getCache(cacheKey) || offlineSyncService.getCache('permohonans_default');
    if (cached) return cached;
    return { status: 'success', data: [], meta: { total: 0, page: 1, totalPages: 1 }, offline: true };
  }

  try {
    const res = await gasGet({ action: 'getPermohonans', ...params });
    if (res && res.status === 'success') {
      offlineSyncService.setCache(cacheKey, res);
      offlineSyncService.setCache('permohonans_default', res);
    }
    return res;
  } catch (err) {
    const cached = offlineSyncService.getCache(cacheKey) || offlineSyncService.getCache('permohonans_default');
    if (cached) return { ...cached, offline: true };
    throw err;
  }
}

/**
 * Ambil semua data survey dengan filter & pagination + Offline Cache
 */
export async function getSurveys(params = {}) {
  const cacheKey = 'surveys_' + JSON.stringify(params);
  if (!navigator.onLine) {
    const cached = offlineSyncService.getCache(cacheKey) || offlineSyncService.getCache('surveys_default');
    if (cached) return cached;
    return { status: 'success', data: [], meta: { total: 0, page: 1, totalPages: 1 }, offline: true };
  }

  try {
    const res = await gasGet({ action: 'getSurveys', ...params });
    if (res && res.status === 'success') {
      offlineSyncService.setCache(cacheKey, res);
      offlineSyncService.setCache('surveys_default', res);
    }
    return res;
  } catch (err) {
    const cached = offlineSyncService.getCache(cacheKey) || offlineSyncService.getCache('surveys_default');
    if (cached) return { ...cached, offline: true };
    throw err;
  }
}

/**
 * Ambil 1 data permohonan & survey berdasarkan IDPEL
 */
export async function getById(idpel) {
  if (!navigator.onLine) {
    const cachedPermohonan = offlineSyncService.getCache('permohonans_default');
    if (cachedPermohonan && Array.isArray(cachedPermohonan.data)) {
      const item = cachedPermohonan.data.find(row => row.IDPEL === idpel);
      if (item) return { status: 'success', data: item, offline: true };
    }
  }
  return gasGet({ action: 'getById', idpel });
}

/**
 * Ambil statistik untuk dashboard
 */
export async function getStats() {
  if (!navigator.onLine) {
    const cached = offlineSyncService.getCache('stats');
    if (cached) return cached;
  }
  try {
    const res = await gasGet({ action: 'getStats' });
    if (res && res.status === 'success') {
      offlineSyncService.setCache('stats', res);
    }
    return res;
  } catch (err) {
    const cached = offlineSyncService.getCache('stats');
    if (cached) return cached;
    throw err;
  }
}

/**
 * Simpan/Update data permohonan dengan Antrean Offline
 */
export async function savePermohonan(data) {
  if (!navigator.onLine) {
    offlineSyncService.enqueue('savePermohonan', { data });
    offlineSyncService.updateCachedList('permohonans_default', data);
    return { status: 'success', offline: true, message: 'Disimpan secara lokal (Mode Offline)' };
  }

  try {
    const res = await savePermohonanDirect(data);
    return res;
  } catch (err) {
    offlineSyncService.enqueue('savePermohonan', { data });
    offlineSyncService.updateCachedList('permohonans_default', data);
    return { status: 'success', offline: true, message: 'Koneksi terganggu. Disimpan ke antrean offline.' };
  }
}

/**
 * Simpan/Update data survey lapangan dengan Antrean Offline
 */
export async function saveSurvey(data) {
  if (!navigator.onLine) {
    offlineSyncService.enqueue('saveSurvey', { data });
    offlineSyncService.updateCachedList('surveys_default', data);
    return { status: 'success', offline: true, message: 'Data survey disimpan secara lokal (Mode Offline)' };
  }

  try {
    const res = await saveSurveyDirect(data);
    return res;
  } catch (err) {
    offlineSyncService.enqueue('saveSurvey', { data });
    offlineSyncService.updateCachedList('surveys_default', data);
    return { status: 'success', offline: true, message: 'Koneksi terganggu. Data survey disimpan ke antrean offline.' };
  }
}

/**
 * Hapus data permohonan dengan Antrean Offline
 */
export async function deletePermohonan(idpel) {
  if (!navigator.onLine) {
    offlineSyncService.enqueue('deletePermohonan', { idpel });
    offlineSyncService.updateCachedList('permohonans_default', { IDPEL: idpel }, true);
    return { status: 'success', offline: true, message: 'Penghapusan disimpan ke antrean offline.' };
  }

  try {
    return await deletePermohonanDirect(idpel);
  } catch (err) {
    offlineSyncService.enqueue('deletePermohonan', { idpel });
    offlineSyncService.updateCachedList('permohonans_default', { IDPEL: idpel }, true);
    return { status: 'success', offline: true, message: 'Penghapusan disimpan ke antrean offline.' };
  }
}

/**
 * Trigger manual sync process
 */
export async function syncOfflineQueue() {
  return offlineSyncService.syncPendingQueue({
    savePermohonanDirect,
    saveSurveyDirect,
    deletePermohonanDirect
  });
}

/**
 * Upload foto ke Google Drive
 */
export async function uploadPhoto(file, folderType = 'foto_rumah', idpel = '') {
  if (!navigator.onLine) {
    // If offline, convert file to dataURL and store inline temporarily
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({ status: 'success', url: reader.result, offline: true });
      };
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result.split(',')[1];
        const result = await gasPost({
          action: 'uploadPhoto',
          fileName: file.name,
          mimeType: file.type,
          base64Data,
          folderType,
          idpel,
        });
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Login ke aplikasi
 */
export async function login(username, password) {
  return gasPost({ action: 'login', username, password });
}

export async function getUsers() { return gasGet({ action: 'getUsers' }); }
export async function saveUser(data) { return gasPost({ action: 'saveUser', data }); }
export async function deleteUser(username) { return gasPost({ action: 'deleteUser', username }); }
