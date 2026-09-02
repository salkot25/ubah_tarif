import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Spinner, PageLoader } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { getUsers, saveUser, deleteUser } from '../services/api';
import { CompactSignatureButton, SignatureSlot } from '../components/ui/SignatureUploader';
import {
  User, Briefcase, MapPin, Building, Save, RotateCcw,
  ShieldCheck, ClipboardCheck, FileText, Calendar, Users,
  UserPlus, Edit2, Trash2, Key, CheckCircle, XCircle, Settings,
  List, LayoutGrid, Plus, PenTool
} from 'lucide-react';

const DEFAULT_SETTINGS = {
  SETTING_MUP3: 'VICKY REANDRY FARADIAN',
  SETTING_ASMAN: 'MUHAMAD ALWI SOFIAN',
  SETTING_MULP: 'ARIF SETYAWAN',
  SETTING_TL: 'FATHUR ROHIM',
  SETTING_PETUGAS_SURVEY: 'Fathur Rohim',
  SETTING_KANTOR_ULP: 'ULP Salatiga Kota',
  SETTING_ALAMAT_KANTOR: 'Jl. Diponegoro No. 19 Salatiga',
  SETTING_NO_SURAT_TUGAS: '0005.STg/SDM.02/07/F03110000/2026',
  SETTING_TANGGAL_SURAT_TUGAS: '05 Januari 2026',
  SETTING_TTD_MUP3: '',
  SETTING_TTD_ASMAN: '',
  SETTING_TTD_MULP: '',
  SETTING_TTD_TL: '',
  SETTING_TTD_PETUGAS_SURVEY: ''
};

export default function SettingsPage() {
  const toast = useToast();
  const { user: currentUser } = useAuth();
  
  // Tab Management
  const [activeTab, setActiveTab] = useState('pejabat'); // 'pejabat' | 'users'

  // Pejabat Settings State
  const [settings, setSettings] = useState(() => {
    const loaded = {};
    Object.keys(DEFAULT_SETTINGS).forEach(key => {
      loaded[key] = localStorage.getItem(key) || DEFAULT_SETTINGS[key];
    });
    return loaded;
  });

  // Users Management State
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [userViewMode, setUserViewMode] = useState(() => {
    const saved = localStorage.getItem('SETTING_USER_VIEW_MODE');
    if (saved) return saved;
    return typeof window !== 'undefined' && window.innerWidth < 768 ? 'grid' : 'list';
  });
  
  // User Modal State
  const [userModal, setUserModal] = useState({ open: false, isEdit: false, data: null });
  const [userForm, setUserForm] = useState({ username: '', password: '', role: 'petugas', status: 'aktif', nama: '' });
  const [userSubmitting, setUserSubmitting] = useState(false);

  // Delete Confirm State
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, username: '' });
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Settings & TTD Confirmation Modals
  const [clearAllTtdModalOpen, setClearAllTtdModalOpen] = useState(false);
  const [resetDefaultModalOpen, setResetDefaultModalOpen] = useState(false);

  // Load users when tab changes to 'users'
  useEffect(() => {
    if (activeTab === 'users' && currentUser?.role === 'admin') {
      fetchUsersList();
    }
  }, [activeTab, currentUser]);

  const fetchUsersList = async () => {
    setUsersLoading(true);
    setUsersError('');
    try {
      const res = await getUsers();
      if (res.status === 'success') {
        setUsers(res.data || []);
      } else {
        setUsersError(res.message || 'Gagal memuat daftar user');
      }
    } catch (err) {
      console.error(err);
      setUsersError('Gagal menghubungi server database');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    try {
      Object.keys(settings).forEach(key => {
        localStorage.setItem(key, settings[key]);
      });
      toast.success('Pengaturan pejabat penandatangan berhasil disimpan');
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan pengaturan');
    }
  };

  const executeResetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    Object.keys(DEFAULT_SETTINGS).forEach(key => {
      localStorage.setItem(key, DEFAULT_SETTINGS[key]);
    });
    setResetDefaultModalOpen(false);
    toast.success('Pengaturan telah di-reset ke nilai default');
  };

  const executeClearAllSignatures = () => {
    const updated = {
      ...settings,
      SETTING_TTD_MUP3: '',
      SETTING_TTD_ASMAN: '',
      SETTING_TTD_MULP: '',
      SETTING_TTD_TL: '',
      SETTING_TTD_PETUGAS_SURVEY: ''
    };
    setSettings(updated);
    ['SETTING_TTD_MUP3', 'SETTING_TTD_ASMAN', 'SETTING_TTD_MULP', 'SETTING_TTD_TL', 'SETTING_TTD_PETUGAS_SURVEY'].forEach(k => {
      localStorage.removeItem(k);
    });
    setClearAllTtdModalOpen(false);
    toast.success('Semua tanda tangan digital berhasil dihapus');
  };

  // User Form Handlers
  const handleOpenUserModal = (isEdit = false, userData = null) => {
    if (isEdit && userData) {
      setUserForm({
        username: userData.username,
        password: '', // Kosongkan password saat edit (opsional)
        role: userData.role || 'petugas',
        status: userData.status || 'aktif',
        nama: userData.nama || ''
      });
      setUserModal({ open: true, isEdit: true, data: userData });
    } else {
      setUserForm({ username: '', password: '', role: 'petugas', status: 'aktif', nama: '' });
      setUserModal({ open: true, isEdit: false, data: null });
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!userForm.username.trim() || (!userModal.isEdit && !userForm.password.trim())) {
      toast.error('Username dan password wajib diisi');
      return;
    }

    setUserSubmitting(true);
    try {
      const res = await saveUser(userForm);
      if (res.status === 'success') {
        toast.success(res.message || 'User berhasil disimpan');
        setUserModal({ open: false, isEdit: false, data: null });
        fetchUsersList();
      } else {
        toast.error(res.message || 'Gagal menyimpan data user');
      }
    } catch (err) {
      console.error(err);
      toast.error('Koneksi database gagal');
    } finally {
      setUserSubmitting(false);
    }
  };

  const handleDeleteUserClick = (username) => {
    if (username.toLowerCase() === 'admin') {
      toast.warning('User admin utama tidak dapat dihapus');
      return;
    }
    if (username.toLowerCase() === currentUser?.username.toLowerCase()) {
      toast.warning('Anda tidak dapat menghapus akun Anda sendiri');
      return;
    }
    setDeleteConfirm({ open: true, username });
  };

  const executeDeleteUser = async () => {
    setDeleteSubmitting(true);
    try {
      const res = await deleteUser(deleteConfirm.username);
      if (res.status === 'success') {
        toast.success('User berhasil dihapus');
        setDeleteConfirm({ open: false, username: '' });
        fetchUsersList();
      } else {
        toast.error(res.message || 'Gagal menghapus user');
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghubungi server database');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation selectors */}
      {currentUser?.role === 'admin' && (
        <div className="flex gap-1 bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 max-w-sm">
          <button
            onClick={() => setActiveTab('pejabat')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'pejabat'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Settings size={14} />
            <span>Pejabat & ULP</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'users'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users size={14} />
            <span>Manajemen User</span>
          </button>
        </div>
      )}

      {/* Tab Content 1: Pejabat settings */}
      {activeTab === 'pejabat' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card 1: Pejabat Permohonan */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 font-bold text-sm uppercase tracking-wider">
                <ClipboardCheck size={16} className="text-blue-600 dark:text-blue-400" />
                <span>Pejabat Formulir Permohonan (Ubah Tarif)</span>
              </div>
              
              <div className="space-y-3.5">
                {/* MUP3 */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Mengesahkan (MUP3 Salatiga)</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <Input
                        leftIcon={User}
                        value={settings.SETTING_MUP3}
                        onChange={e => handleSettingChange('SETTING_MUP3', e.target.value)}
                        placeholder="Nama Manajer UP3"
                        required
                      />
                    </div>
                    <CompactSignatureButton
                      value={settings.SETTING_TTD_MUP3}
                      onChange={val => handleSettingChange('SETTING_TTD_MUP3', val)}
                      modalTitle="Tanda Tangan MUP3 Salatiga"
                    />
                  </div>
                </div>

                {/* ASMAN */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Mengetahui (ASMAN NPS)</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <Input
                        leftIcon={ShieldCheck}
                        value={settings.SETTING_ASMAN}
                        onChange={e => handleSettingChange('SETTING_ASMAN', e.target.value)}
                        placeholder="Nama Assistant Manager Niaga & Pemasaran"
                        required
                      />
                    </div>
                    <CompactSignatureButton
                      value={settings.SETTING_TTD_ASMAN}
                      onChange={val => handleSettingChange('SETTING_TTD_ASMAN', val)}
                      modalTitle="Tanda Tangan ASMAN NPS"
                    />
                  </div>
                </div>

                {/* MULP */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Menyetujui (MULP Salatiga Kota)</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <Input
                        leftIcon={Building}
                        value={settings.SETTING_MULP}
                        onChange={e => handleSettingChange('SETTING_MULP', e.target.value)}
                        placeholder="Nama Manajer ULP"
                        required
                      />
                    </div>
                    <CompactSignatureButton
                      value={settings.SETTING_TTD_MULP}
                      onChange={val => handleSettingChange('SETTING_TTD_MULP', val)}
                      modalTitle="Tanda Tangan MULP Salatiga Kota"
                    />
                  </div>
                </div>

                {/* TL */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">TL TE LAY GAN (Petugas)</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <Input
                        leftIcon={Briefcase}
                        value={settings.SETTING_TL}
                        onChange={e => handleSettingChange('SETTING_TL', e.target.value)}
                        placeholder="Nama Team Leader Transaksi Energi"
                        required
                      />
                    </div>
                    <CompactSignatureButton
                      value={settings.SETTING_TTD_TL}
                      onChange={val => handleSettingChange('SETTING_TTD_TL', val)}
                      modalTitle="Tanda Tangan TL TE LAY GAN"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Card 2: Pejabat Survey & ULP */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 font-bold text-sm uppercase tracking-wider">
                <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
                <span>Pejabat Berita Acara & Kantor ULP</span>
              </div>

              <div className="space-y-3.5">
                {/* Petugas Survey */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Petugas Pemeriksa Lapangan</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <Input
                        leftIcon={User}
                        value={settings.SETTING_PETUGAS_SURVEY}
                        onChange={e => handleSettingChange('SETTING_PETUGAS_SURVEY', e.target.value)}
                        placeholder="Nama petugas survey lapangan"
                        required
                      />
                    </div>
                    <CompactSignatureButton
                      value={settings.SETTING_TTD_PETUGAS_SURVEY}
                      defaultAsset="./signature-petugas.png"
                      onChange={val => handleSettingChange('SETTING_TTD_PETUGAS_SURVEY', val)}
                      modalTitle="Tanda Tangan Petugas Survey Lapangan"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Unit Layanan Pelanggan (ULP)</label>
                  <Input
                    leftIcon={Building}
                    value={settings.SETTING_KANTOR_ULP}
                    onChange={e => handleSettingChange('SETTING_KANTOR_ULP', e.target.value)}
                    placeholder="Contoh: ULP Salatiga Kota"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Alamat Kantor ULP</label>
                  <Input
                    leftIcon={MapPin}
                    value={settings.SETTING_ALAMAT_KANTOR}
                    onChange={e => handleSettingChange('SETTING_ALAMAT_KANTOR', e.target.value)}
                    placeholder="Contoh: Jl. Diponegoro No. 19 Salatiga"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">No. Surat Tugas Default</label>
                    <Input
                      leftIcon={FileText}
                      value={settings.SETTING_NO_SURAT_TUGAS}
                      onChange={e => handleSettingChange('SETTING_NO_SURAT_TUGAS', e.target.value)}
                      placeholder="Contoh: 0005.STg/SDM.02/07/F03110000/2026"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Tgl Surat Tugas Default</label>
                    <Input
                      leftIcon={Calendar}
                      value={settings.SETTING_TANGGAL_SURAT_TUGAS}
                      onChange={e => handleSettingChange('SETTING_TANGGAL_SURAT_TUGAS', e.target.value)}
                      placeholder="Contoh: 05 Januari 2026"
                      required
                    />
                  </div>
                </div>
              </div>
            </Card>

          </div>

          {/* Form Actions */}
          <div className="flex flex-wrap gap-3 justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/70 shadow-sm transition-colors">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                icon={RotateCcw}
                onClick={() => setResetDefaultModalOpen(true)}
              >
                Reset Default
              </Button>
              <Button
                type="button"
                variant="outline-danger"
                icon={Trash2}
                onClick={() => setClearAllTtdModalOpen(true)}
              >
                Hapus Semua TTD
              </Button>
            </div>
            <Button
              type="submit"
              variant="primary"
              icon={Save}
            >
              Simpan Pengaturan
            </Button>
          </div>
        </form>
      )}

      {/* Tab Content 2: User management (Admin Only) */}
      {activeTab === 'users' && currentUser?.role === 'admin' && (
        <>
          {/* Mobile Floating Action Button (FAB) */}
          <button
            onClick={() => handleOpenUserModal(false)}
            className="md:hidden fixed bottom-20 right-4 z-40 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-3.5 rounded-full shadow-card-lg active:scale-95 flex items-center justify-center border border-blue-400/40 transition-all"
            title="Tambah User Baru"
          >
            <UserPlus size={22} />
          </button>

          <Card className={`p-5 sm:p-6 space-y-4 ${userViewMode === 'grid' ? 'bg-transparent border-0 shadow-none p-0' : ''}`}>
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-4 flex-wrap gap-3 bg-white p-4 rounded-2xl shadow-xs">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm uppercase tracking-wider">
                <Users size={16} className="text-blue-600" />
                <span>Daftar User Database</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {/* View Mode Switcher */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => { setUserViewMode('list'); localStorage.setItem('SETTING_USER_VIEW_MODE', 'list'); }}
                    className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${userViewMode === 'list' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    title="Tampilan Tabel (List View)"
                  >
                    <List size={16} />
                    <span className="hidden sm:inline">Tabel</span>
                  </button>
                  <button
                    onClick={() => { setUserViewMode('grid'); localStorage.setItem('SETTING_USER_VIEW_MODE', 'grid'); }}
                    className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${userViewMode === 'grid' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    title="Tampilan Kartu (Grid View)"
                  >
                    <LayoutGrid size={16} />
                    <span className="hidden sm:inline">Kartu</span>
                  </button>
                </div>

                {/* Desktop Button */}
                <Button
                  variant="primary"
                  size="sm"
                  icon={UserPlus}
                  onClick={() => handleOpenUserModal(false)}
                  className="hidden md:inline-flex"
                >
                  Tambah User Baru
                </Button>
              </div>
            </div>

            {usersLoading ? (
              <div className="py-12 bg-white rounded-2xl border border-slate-200"><PageLoader /></div>
            ) : usersError ? (
              <div className="py-8 text-center space-y-2 bg-white rounded-2xl border border-slate-200">
                <p className="text-red-500 text-sm font-semibold">{usersError}</p>
                <Button size="sm" variant="secondary" onClick={fetchUsersList}>Coba Lagi</Button>
              </div>
            ) : users.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 py-10">
                <p className="text-sm text-slate-400 italic text-center">Tidak ada data user terdaftar</p>
              </div>
            ) : userViewMode === 'list' ? (
              /* List View Table */
              <div className="table-wrapper border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nama Lengkap</th>
                      <th>Username</th>
                      <th>Hak Akses (Role)</th>
                      <th>Status Akun</th>
                      <th className="text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((row) => (
                      <tr key={row.username}>
                        <td className="font-bold text-slate-700">{row.nama}</td>
                        <td className="font-mono text-xs text-slate-500">{row.username}</td>
                        <td>
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${
                            row.role === 'admin' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            {row.role}
                          </span>
                        </td>
                        <td>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            row.status === 'aktif'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : 'bg-red-50 text-red-700 border-red-100'
                          }`}>
                            {row.status === 'aktif' ? <CheckCircle size={10} /> : <XCircle size={10} />}
                            {row.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenUserModal(true, row)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              title="Edit User / Ganti Password"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteUserClick(row.username)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                row.username.toLowerCase() === 'admin' || row.username.toLowerCase() === currentUser?.username.toLowerCase()
                                  ? 'text-slate-200 cursor-not-allowed'
                                  : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                              }`}
                              disabled={row.username.toLowerCase() === 'admin' || row.username.toLowerCase() === currentUser?.username.toLowerCase()}
                              title="Hapus Akun User"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Grid View Cards */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((row) => (
                  <div key={row.username} className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm hover:shadow-md transition-all space-y-3.5 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-white font-bold flex items-center justify-center text-sm shadow-xs flex-shrink-0">
                          {row.nama ? row.nama.substring(0, 2).toUpperCase() : 'US'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-slate-800 truncate">{row.nama}</h4>
                          <p className="font-mono text-xs text-slate-500 truncate">@{row.username}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${
                          row.role === 'admin' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {row.role}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          row.status === 'aktif'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-red-50 text-red-700 border-red-100'
                        }`}>
                          {row.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenUserModal(true, row)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors border border-slate-200/70"
                          title="Edit User / Ganti Password"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteUserClick(row.username)}
                          className={`p-1.5 rounded-lg transition-colors border border-slate-200/70 ${
                            row.username.toLowerCase() === 'admin' || row.username.toLowerCase() === currentUser?.username.toLowerCase()
                              ? 'text-slate-300 bg-slate-50 border-transparent cursor-not-allowed'
                              : 'text-slate-500 hover:text-red-600 hover:bg-red-50'
                          }`}
                          disabled={row.username.toLowerCase() === 'admin' || row.username.toLowerCase() === currentUser?.username.toLowerCase()}
                          title="Hapus Akun User"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {/* Save/Edit User Modal */}
      <Modal
        isOpen={userModal.open}
        onClose={() => setUserModal({ open: false, isEdit: false, data: null })}
        title={userModal.isEdit ? 'Ubah Data User' : 'Tambah User Baru'}
        size="md"
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Nama Lengkap</label>
              <Input
                type="text"
                value={userForm.nama}
                onChange={e => setUserForm(prev => ({ ...prev, nama: e.target.value }))}
                placeholder="Contoh: Fathur Rohim"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Username (Lower case)</label>
              <Input
                type="text"
                value={userForm.username}
                onChange={e => setUserForm(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/\s/g, '') }))}
                placeholder="Contoh: fathurrohim"
                disabled={userModal.isEdit}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">
                {userModal.isEdit ? 'Ganti Password (Kosongkan jika tidak diubah)' : 'Password Awal'}
              </label>
              <Input
                type="text"
                leftIcon={Key}
                value={userForm.password}
                onChange={e => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder={userModal.isEdit ? 'Masukkan password baru saja' : 'Min. 5 karakter'}
                required={!userModal.isEdit}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Hak Akses (Role)</label>
                <Select
                  options={[
                    { value: 'petugas', label: 'Petugas / Surveyor' },
                    { value: 'admin', label: 'Admin' }
                  ]}
                  value={userForm.role}
                  onChange={e => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                  disabled={userForm.username.toLowerCase() === 'admin'}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Status Keaktifan</label>
                <Select
                  options={[
                    { value: 'aktif', label: 'Aktif' },
                    { value: 'nonaktif', label: 'Nonaktif' }
                  ]}
                  value={userForm.status}
                  onChange={e => setUserForm(prev => ({ ...prev, status: e.target.value }))}
                  disabled={userForm.username.toLowerCase() === 'admin'}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setUserModal({ open: false, isEdit: false, data: null })}
              disabled={userSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={userSubmitting}
            >
              {userModal.isEdit ? 'Perbarui User' : 'Simpan User'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete User Confirmation Modal */}
      <Modal
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, username: '' })}
        title="Hapus Akun User"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleteConfirm({ open: false, username: '' })}
              disabled={deleteSubmitting}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              loading={deleteSubmitting}
              onClick={executeDeleteUser}
            >
              Ya, Hapus
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Apakah Anda yakin ingin menghapus akun user{' '}
          <span className="font-semibold text-slate-800 dark:text-slate-100">@{deleteConfirm.username}</span>?
        </p>
        <p className="text-xs text-red-600 dark:text-red-400 mt-2">
          Akun ini akan dihapus secara permanen dari database spreadsheet dan tidak akan dapat melakukan login kembali.
        </p>
      </Modal>

      {/* Clear All Signatures Modal */}
      <Modal
        isOpen={clearAllTtdModalOpen}
        onClose={() => setClearAllTtdModalOpen(false)}
        title="Hapus Semua Tanda Tangan Digital"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setClearAllTtdModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              icon={Trash2}
              onClick={executeClearAllSignatures}
            >
              Ya, Hapus Semua TTD
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Apakah Anda yakin ingin menghapus <strong className="text-slate-800 dark:text-slate-100">seluruh tanda tangan digital</strong> (MUP3, ASMAN, MULP, TL, dan Petugas)?
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
            Tanda tangan yang tersimpan di browser akan dikosongkan. Anda dapat mengunggah tanda tangan baru kapan saja.
          </p>
        </div>
      </Modal>

      {/* Reset Default Pejabat Modal */}
      <Modal
        isOpen={resetDefaultModalOpen}
        onClose={() => setResetDefaultModalOpen(false)}
        title="Reset Pejabat ke Nilai Default"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setResetDefaultModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              icon={RotateCcw}
              onClick={executeResetSettings}
            >
              Ya, Reset Default
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Apakah Anda yakin ingin mengembalikan seluruh nama pejabat, ULP, dan surat tugas ke <strong className="text-slate-800 dark:text-slate-100">pengaturan default bawaan</strong>?
          </p>
        </div>
      </Modal>
    </div>
  );
}
