import React, { useState, useRef, useEffect } from 'react';
import { Upload, Edit3, Trash2, Check, X, Sparkles, RefreshCw, Eye, Image as ImageIcon, PenTool } from 'lucide-react';
import { Button } from './Button';

/**
 * Utility to process uploaded image file on an HTML5 canvas:
 * - Resizes to max width/height to keep Base64 footprint small (~15-30KB)
 * - Optionally removes white/light backgrounds to make it transparent
 * - Boosts contrast for clear ink display
 */
function processImageFile(file, removeWhiteBg = true, contrastBoost = true) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxW = 500;
        const maxH = 250;
        let width = img.width;
        let height = img.height;

        if (width > maxW || height > maxH) {
          const ratio = Math.min(maxW / width, maxH / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        ctx.drawImage(img, 0, 0, width, height);

        if (removeWhiteBg || contrastBoost) {
          const imgData = ctx.getImageData(0, 0, width, height);
          const data = imgData.data;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            if (a === 0) continue;

            // Calculate luminance
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

            if (removeWhiteBg) {
              // If pixel is very bright, turn transparent
              if (luminance > 220) {
                data[i + 3] = 0; // fully transparent
              } else if (luminance > 160) {
                // Smooth falloff
                const alphaFactor = (220 - luminance) / 60;
                data[i + 3] = Math.round(a * alphaFactor);
                // Darken the ink
                if (contrastBoost) {
                  data[i] = Math.max(0, r - 30);
                  data[i + 1] = Math.max(0, g - 30);
                  data[i + 2] = Math.max(0, b - 30);
                }
              } else if (contrastBoost) {
                // Darken dark ink
                data[i] = Math.max(0, Math.min(255, r * 0.8));
                data[i + 1] = Math.max(0, Math.min(255, g * 0.8));
                data[i + 2] = Math.max(0, Math.min(255, b * 0.8));
              }
            } else if (contrastBoost) {
              // If not removing white bg, just apply simple contrast
              const factor = (259 * (30 + 255)) / (255 * (259 - 30));
              data[i] = Math.min(255, Math.max(0, factor * (r - 128) + 128));
              data[i + 1] = Math.min(255, Math.max(0, factor * (g - 128) + 128));
              data[i + 2] = Math.min(255, Math.max(0, factor * (b - 128) + 128));
            }
          }
          ctx.putImageData(imgData, 0, 0);
        }

        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Signature Modal Component for uploading or drawing a signature
 */
export function SignatureModal({ isOpen, onClose, onSave, title = 'Tanda Tangan Digital', initialValue = '' }) {
  const [activeMode, setActiveMode] = useState('upload'); // 'upload' | 'draw'
  const [previewUrl, setPreviewUrl] = useState(initialValue);
  const [removeWhiteBg, setRemoveWhiteBg] = useState(true);
  const [originalFile, setOriginalFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  
  // Canvas drawing state
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [inkColor, setInkColor] = useState('#0f172a'); // Dark slate

  useEffect(() => {
    if (isOpen) {
      setPreviewUrl(initialValue || '');
      setOriginalFile(null);
      setHasDrawn(false);
      setActiveMode('upload');
    }
  }, [isOpen, initialValue]);

  // Handle re-processing when toggle changes
  useEffect(() => {
    if (originalFile) {
      setIsProcessing(true);
      processImageFile(originalFile, removeWhiteBg, true)
        .then((url) => {
          setPreviewUrl(url);
        })
        .catch(console.error)
        .finally(() => setIsProcessing(false));
    }
  }, [removeWhiteBg, originalFile]);

  // Drawing Canvas Handlers
  useEffect(() => {
    if (activeMode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      // Set resolution
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      ctx.scale(2, 2);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = inkColor;
    }
  }, [activeMode, inkColor]);

  const startDrawing = (e) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e) => {
    if (!isDrawing || !canvasRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing || !canvasRef.current) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    setPreviewUrl(canvas.toDataURL('image/png'));
  };

  const handleClearDraw = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setPreviewUrl('');
  };

  const handleFileChange = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar yang valid (PNG, JPG, WEBP).');
      return;
    }
    setOriginalFile(file);
    setIsProcessing(true);
    try {
      const url = await processImageFile(file, removeWhiteBg, true);
      setPreviewUrl(url);
    } catch (err) {
      console.error(err);
      alert('Gagal memproses gambar tanda tangan.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSave = () => {
    onSave(previewUrl);
    onClose();
  };

  const handleDelete = () => {
    onSave('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{title}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Upload file foto TTD atau gambar langsung di layar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => setActiveMode('upload')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                activeMode === 'upload' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm' : 'hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Upload size={14} />
              <span>Upload Gambar TTD</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('draw')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                activeMode === 'draw' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm' : 'hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Edit3 size={14} />
              <span>Goreskan TTD Langsung</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {activeMode === 'upload' ? (
            <div className="space-y-3">
              {/* Dropzone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-5 text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                  dragOver
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
                onClick={() => document.getElementById('signature-file-input')?.click()}
              >
                <input
                  id="signature-file-input"
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
                />
                <div className="w-11 h-11 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 shadow-sm">
                  <ImageIcon size={20} />
                </div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Klik untuk pilih file atau seret gambar ke sini
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Format: PNG transparan (disarankan), JPG, atau WEBP (Maks. 2MB)
                </div>
              </div>

              {/* Options */}
              <div className="bg-slate-50 dark:bg-slate-800/70 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={15} className="text-amber-500" />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-200">Bersihkan background putih (Transparan)</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={removeWhiteBg}
                    onChange={(e) => setRemoveWhiteBg(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Drawing Pad */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-inner bg-slate-50 dark:bg-slate-800 relative">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-44 bg-white cursor-crosshair touch-none"
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs italic">
                    Goreskan tanda tangan Anda di area ini...
                  </div>
                )}
              </div>

              {/* Pad Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Warna Tinta:</span>
                  <button
                    type="button"
                    onClick={() => setInkColor('#0f172a')}
                    className={`w-6 h-6 rounded-full bg-slate-900 border-2 transition-transform ${
                      inkColor === '#0f172a' ? 'border-blue-500 scale-110' : 'border-transparent'
                    }`}
                    title="Hitam"
                  />
                  <button
                    type="button"
                    onClick={() => setInkColor('#1e40af')}
                    className={`w-6 h-6 rounded-full bg-blue-800 border-2 transition-transform ${
                      inkColor === '#1e40af' ? 'border-blue-500 scale-110' : 'border-transparent'
                    }`}
                    title="Biru PLN"
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={RefreshCw}
                  onClick={handleClearDraw}
                  disabled={!hasDrawn}
                >
                  Bersihkan
                </Button>
              </div>
            </div>
          )}

          {/* Preview Box with Checkerboard background for transparency test */}
          {previewUrl && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                <span className="flex items-center gap-1.5">
                  <Eye size={13} className="text-blue-600 dark:text-blue-400" />
                  Preview Hasil Tanda Tangan:
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Siap Diterapkan
                </span>
              </div>
              <div
                className="h-28 w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2 flex items-center justify-center relative overflow-hidden"
                style={{
                  backgroundImage: `
                    linear-gradient(45deg, #f1f5f9 25%, transparent 25%),
                    linear-gradient(-45deg, #f1f5f9 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #f1f5f9 75%),
                    linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)
                  `,
                  backgroundSize: '16px 16px',
                  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                  backgroundColor: '#ffffff'
                }}
              >
                <img
                  src={previewUrl}
                  alt="Preview Tanda Tangan"
                  className="max-h-24 max-w-full object-contain mix-blend-multiply drop-shadow-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
          <div>
            {(initialValue || previewUrl) && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={handleDelete}
                className="text-xs"
              >
                Hapus TTD
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="primary"
              icon={Check}
              onClick={handleSave}
              disabled={!previewUrl || isProcessing}
            >
              Terapkan TTD
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Ultra-compact Inline Signature Trigger Button for alignment beside Name Inputs
 */
export function CompactSignatureButton({
  value = '',
  onChange,
  defaultAsset = '',
  title = 'Upload / Atur TTD Digital',
  modalTitle
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [showHoverPreview, setShowHoverPreview] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const activeSrc = value || defaultAsset;
  const isCustom = Boolean(value);

  const handleDeleteConfirm = () => {
    onChange('');
    setDeleteConfirmOpen(false);
  };

  return (
    <>
      <div className="relative flex items-center shrink-0">
        {activeSrc ? (
          <div className="flex items-center gap-1.5">
            {/* Active Signature Pill / Button */}
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              onMouseEnter={() => setShowHoverPreview(true)}
              onMouseLeave={() => setShowHoverPreview(false)}
              className="h-10 px-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700/70 bg-emerald-50/80 dark:bg-emerald-950/70 hover:bg-emerald-100/90 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 transition-all shadow-xs group"
              title="Klik untuk ubah TTD (Hover untuk preview)"
            >
              {/* Mini checkerboard container for preview */}
              <div
                className="w-7 h-6 rounded border border-emerald-200 dark:border-emerald-800 bg-white flex items-center justify-center overflow-hidden p-0.5 shadow-2xs"
                style={{
                  backgroundImage: `
                    linear-gradient(45deg, #e2e8f0 25%, transparent 25%),
                    linear-gradient(-45deg, #e2e8f0 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #e2e8f0 75%),
                    linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)
                  `,
                  backgroundSize: '6px 6px',
                  backgroundColor: '#ffffff'
                }}
              >
                <img
                  src={activeSrc}
                  alt="TTD"
                  className="max-h-full max-w-full object-contain mix-blend-multiply"
                />
              </div>
              <span className="text-xs font-bold whitespace-nowrap hidden sm:inline">
                {isCustom ? 'TTD Terpasang' : 'TTD Default'}
              </span>
              <Edit3 size={12} className="text-emerald-600 dark:text-emerald-400 opacity-70 group-hover:opacity-100" />
            </button>

            {/* Remove button if custom */}
            {isCustom && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirmOpen(true);
                }}
                className="h-10 w-8 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-700 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/50 text-slate-400 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 flex items-center justify-center transition-colors shadow-xs"
                title="Hapus TTD"
              >
                <Trash2 size={13} />
              </button>
            )}

            {/* Hover Floating Preview */}
            {showHoverPreview && (
              <div
                className="absolute right-0 bottom-full mb-2 z-40 p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 pointer-events-none animate-fadeIn flex flex-col items-center"
                style={{ width: '180px' }}
              >
                <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center justify-between w-full">
                  <span>Preview TTD</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-[9px] bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.25 rounded border border-emerald-200 dark:border-emerald-800">Aktif</span>
                </div>
                <div
                  className="w-full h-16 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1 bg-white"
                  style={{
                    backgroundImage: `
                      linear-gradient(45deg, #f1f5f9 25%, transparent 25%),
                      linear-gradient(-45deg, #f1f5f9 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, #f1f5f9 75%),
                      linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)
                    `,
                    backgroundSize: '8px 8px',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <img
                    src={activeSrc}
                    alt="TTD Hover Preview"
                    className="max-h-full max-w-full object-contain mix-blend-multiply"
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty / Add Signature Button */
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="h-10 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50/80 dark:bg-slate-800/80 hover:bg-blue-50/70 dark:hover:bg-blue-950/50 text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 flex items-center gap-1.5 transition-all text-xs font-semibold whitespace-nowrap shadow-2xs"
            title="Klik untuk upload atau goreskan tanda tangan digital"
          >
            <PenTool size={13} className="text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
            <span>+ TTD Digital</span>
          </button>
        )}
      </div>

      {/* Main Upload / Draw Signature Modal */}
      <SignatureModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={onChange}
        initialValue={value}
        title={modalTitle || title}
      />

      {/* Custom Styled Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-sm w-full p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
                <Trash2 size={20} />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Hapus Tanda Tangan Digital?</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tanda tangan digital ini akan dihapus dari pengaturan formulir.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setDeleteConfirmOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={handleDeleteConfirm}
              >
                Ya, Hapus TTD
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Inline Signature Slot for Settings Card
 */
export function SignatureSlot({
  label = 'Tanda Tangan Digital',
  value = '',
  onChange,
  defaultAsset = '',
  title = 'Upload TTD'
}) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
  };

  const activeSrc = value || defaultAsset;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">{label}</label>
        {value && (
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
            Custom TTD Aktif
          </span>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        {/* Preview Frame */}
        <div
          onClick={() => setModalOpen(true)}
          className={`h-14 w-28 rounded-lg border flex items-center justify-center p-1.5 cursor-pointer relative group transition-all ${
            activeSrc
              ? 'border-slate-300 dark:border-slate-700 bg-white hover:border-blue-400 dark:hover:border-blue-500 shadow-sm'
              : 'border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500'
          }`}
          style={activeSrc ? {
            backgroundImage: `
              linear-gradient(45deg, #f8fafc 25%, transparent 25%),
              linear-gradient(-45deg, #f8fafc 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #f8fafc 75%),
              linear-gradient(-45deg, transparent 75%, #f8fafc 75%)
            `,
            backgroundSize: '12px 12px',
            backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px',
            backgroundColor: '#ffffff'
          } : {}}
          title="Klik untuk upload atau ubah tanda tangan"
        >
          {activeSrc ? (
            <img
              src={activeSrc}
              alt="Signature"
              className="max-h-full max-w-full object-contain mix-blend-multiply"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              <Upload size={14} className="mb-0.5 text-slate-400 dark:text-slate-500 group-hover:text-blue-500" />
              <span>Belum Ada TTD</span>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-slate-900/40 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">
            <Edit3 size={13} className="mr-1" /> Ubah
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-1">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={Upload}
            onClick={() => setModalOpen(true)}
            className="text-xs h-7 px-2.5"
          >
            {activeSrc ? 'Ganti TTD' : 'Upload TTD'}
          </Button>

          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 font-semibold px-1 py-0.5 hover:underline"
            >
              <Trash2 size={11} /> Hapus TTD
            </button>
          )}
        </div>
      </div>

      <SignatureModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={onChange}
        initialValue={value}
        title={title}
      />
    </div>
  );
}

export default CompactSignatureButton;
