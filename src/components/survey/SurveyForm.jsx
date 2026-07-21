import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { FORM_STEPS } from '../../config/constants';
import { StepIdentitas } from './StepIdentitas';
import { StepTeknis } from './StepTeknis';
import { StepMeter } from './StepMeter';
import { StepPengukuran } from './StepPengukuran';
import { StepKesimpulan } from './StepKesimpulan';
import { useToast } from '../ui/Toast';
import { ChevronLeft, ChevronRight, Send, CheckCircle2, User, Zap, Gauge, Activity, ClipboardCheck, Printer } from 'lucide-react';
import LiveBASheet from './LiveBASheet';

const STEP_COMPONENTS = [StepIdentitas, StepTeknis, StepMeter, StepPengukuran, StepKesimpulan];

const STEP_ICONS = [User, Zap, Gauge, Activity, ClipboardCheck];

// Validation rules per step
// Validation rules per step
const STEP_REQUIRED = [
  ['IDPEL', 'NAMA', 'ALAMAT'],
  ['TARIF', 'DAYA'],
  ['METER_MERK'],
  [],
  ['TARIF_KOREKSI', 'KESIMPULAN_SPI'],
];

function validate(data, stepIndex) {
  const errors = {};
  const required = STEP_REQUIRED[stepIndex] || [];
  required.forEach(field => {
    if (!data[field] || String(data[field]).trim() === '') {
      errors[field] = 'Field ini wajib diisi';
    }
  });
  return errors;
}

export function SurveyForm({ onSubmit, initialData = {}, isEdit = false, submitting = false }) {
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(() => {
    const data = { ...initialData };
    
    // Inject default settings if empty
    if (!data.NO_SURAT_TUGAS) {
      data.NO_SURAT_TUGAS = localStorage.getItem('SETTING_NO_SURAT_TUGAS') || '0005.STg/SDM.02/07/F03110000/2026';
    }
    if (!data.TANGGAL_SURAT_TUGAS) {
      data.TANGGAL_SURAT_TUGAS = localStorage.getItem('SETTING_TANGGAL_SURAT_TUGAS') || '05 Januari 2026';
    }
    if (!data.NO_BA) {
      data.NO_BA = `52351-${data.IDPEL ? data.IDPEL.toString().slice(-7) : '2620045'}`;
    }
    if (!data.TANGGAL_SURVEY) {
      data.TANGGAL_SURVEY = new Date().toISOString().slice(0, 10);
    }

    // Parse INVENTARISASI_RT
    if (typeof data.INVENTARISASI_RT === 'string') {
      try {
        data.INVENTARISASI_RT = JSON.parse(data.INVENTARISASI_RT);
      } catch (e) {
        data.INVENTARISASI_RT = [];
      }
    }
    if (!Array.isArray(data.INVENTARISASI_RT) || data.INVENTARISASI_RT.length === 0) {
      data.INVENTARISASI_RT = [
        { name: 'Lampu', qty: 6, watt: 10 },
        { name: 'TV', qty: 1, watt: 100 },
        { name: 'Kulkas', qty: 1, watt: 150 },
        { name: 'AC', qty: 1, watt: 800 },
        { name: 'Pompa Air', qty: 1, watt: 250 },
      ];
    }

    // Parse INVENTARISASI_PL
    if (typeof data.INVENTARISASI_PL === 'string') {
      try {
        data.INVENTARISASI_PL = JSON.parse(data.INVENTARISASI_PL);
      } catch (e) {
        data.INVENTARISASI_PL = [];
      }
    }
    if (!Array.isArray(data.INVENTARISASI_PL) || data.INVENTARISASI_PL.length === 0) {
      data.INVENTARISASI_PL = [
        { name: 'Lampu Usaha', qty: 0, watt: 15 },
        { name: 'Komputer/AC', qty: 0, watt: 500 },
        { name: 'Alat Usaha/Mesin', qty: 0, watt: 1000 },
      ];
    }
    return data;
  });
  const [errors, setErrors] = useState({});
  const [completed, setCompleted] = useState(false);

  const currentStep = FORM_STEPS[step];
  const StepComponent = STEP_COMPONENTS[step];
  const StepIcon = STEP_ICONS[step];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const handleNext = () => {
    const errs = validate(formData, step);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.warning('Harap isi semua field yang wajib diisi');
      return;
    }
    setErrors({});
    setStep(s => Math.min(s + 1, FORM_STEPS.length - 1));
  };

  const handleBack = () => {
    setErrors({});
    setStep(s => Math.max(s - 1, 0));
  };

  const handleSubmit = async () => {
    const errs = validate(formData, step);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.warning('Harap isi semua field yang wajib diisi');
      return;
    }

    try {
      const dataToSave = {
        ...formData,
        INVENTARISASI_RT: JSON.stringify(formData.INVENTARISASI_RT || []),
        INVENTARISASI_PL: JSON.stringify(formData.INVENTARISASI_PL || []),
      };
      const result = await onSubmit(dataToSave);
      if (result?.status === 'success') {
        setCompleted(true);
      } else {
        toast.error(result?.message || 'Gagal menyimpan data. Coba lagi.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan. Periksa koneksi internet Anda.');
    }
  };

  const handleReset = () => {
    setFormData({});
    setStep(0);
    setErrors({});
    setCompleted(false);
  };

  // ── Success State ───────────────────────────────────────────────────────────
  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-6 animate-slide-up">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center shadow-card">
          <CheckCircle2 size={40} className="text-emerald-500" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-slate-800">Data Berhasil Disimpan!</h3>
          <p className="text-slate-500 mt-2">
            Survey untuk IDPEL <span className="font-semibold text-blue-700">{formData.IDPEL}</span> telah tersimpan ke Google Sheets.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleReset}>
            Isi Survey Baru
          </Button>
          <a href="/data">
            <Button variant="primary">Lihat Data Survey</Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Print CSS Specific Injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide everything else */
          body * {
            visibility: hidden !important;
          }
          /* Show only target print sheet container and its descendants */
          #printable-ba, #printable-ba * {
            visibility: visible !important;
          }
          /* Reset parent structures to static block layout so they don't break page margins/alignment */
          html, body, #root, [role="dialog"], .fixed, [role="dialog"] > div:last-child, .fixed > div:last-child, [role="dialog"] > div:last-child > div, .fixed > div:last-child > div, [role="dialog"] > div:last-child > div > div, .fixed > div:last-child > div > div, form, form > div, form > div > div {
            position: static !important;
            display: block !important;
            transform: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: auto !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
          }
          /* Center target element print layout */
          #printable-ba {
            position: absolute !important;
            left: 0 !important;
            right: 0 !important;
            top: 0 !important;
            margin: 0 auto !important;
            width: 210mm !important;
            max-width: none !important;
            height: auto !important;
          }
          .print-page {
            width: 210mm !important;
            height: 297mm !important;
            min-h: 297mm !important;
            box-sizing: border-box !important;
            padding: 15mm !important;
            margin: 0 auto !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      ` }} />

      {/* Main Split Body */}
      <div className="flex flex-col xl:flex-row gap-6 items-start overflow-y-auto xl:overflow-hidden flex-1 p-1 max-h-[78vh] xl:max-h-none">
        
        {/* Left Panel: Form Steps & Inputs */}
        <div className="w-full xl:w-[46%] flex flex-col space-y-4 max-h-none xl:max-h-[72vh] xl:overflow-y-auto pr-1 xl:pr-3 flex-shrink-0">
          
          {/* Step Indicator */}
          <div className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            {FORM_STEPS.map((s, i) => {
              const Icon = STEP_ICONS[i];
              const state = i < step ? 'done' : i === step ? 'active' : 'inactive';
              return (
                <React.Fragment key={s.id}>
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className={`step-dot-${state}`}>
                      {state === 'done' ? <CheckCircle2 size={14} /> : <Icon size={13} />}
                    </div>
                    <span className={`text-[10px] font-semibold hidden sm:block ${state === 'active' ? 'text-blue-700' : state === 'done' ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {s.title}
                    </span>
                  </div>
                  {i < FORM_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 rounded-full transition-colors duration-500 ${i < step ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Step Card */}
          <div className="card p-5 animate-slide-up" key={step}>
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <StepIcon size={18} className="text-blue-700 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{currentStep.title}</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{currentStep.subtitle}</p>
              </div>
              <span className="ml-auto text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {step + 1} / {FORM_STEPS.length}
              </span>
            </div>

            <StepComponent
              data={formData}
              onChange={handleChange}
              errors={errors}
            />
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="secondary"
              icon={ChevronLeft}
              onClick={handleBack}
              disabled={step === 0}
              size="sm"
            >
              Kembali
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="success"
                icon={Printer}
                onClick={() => window.print()}
                size="sm"
              >
                Cetak Live PDF
              </Button>
              
              {step < FORM_STEPS.length - 1 ? (
                <Button
                  type="button"
                  variant="primary"
                  iconRight={ChevronRight}
                  onClick={handleNext}
                  size="sm"
                >
                  Lanjut
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="success"
                  icon={Send}
                  onClick={handleSubmit}
                  loading={submitting}
                  size="sm"
                >
                  {isEdit ? 'Simpan Hasil Survey' : 'Kirim Survey'}
                </Button>
              )}
            </div>
          </div>

        </div>

        {/* Right Panel: Live PDF Preview Sheet */}
        <div className="w-full xl:w-[54%] bg-slate-600/90 rounded-2xl p-2 sm:p-4 overflow-x-auto xl:overflow-y-auto flex justify-center items-start max-h-none xl:max-h-[72vh] border border-slate-700/50 shadow-inner flex-1 min-w-0">
          <LiveBASheet data={formData} sertakanTtd={true} />
        </div>

      </div>
    </div>
  );
}
