import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  FileText, Activity, Clock, ArrowRight, Info
} from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Utility to parse various date string formats to 'YYYY-MM-DD'
 */
function parseDateToYMD(dateStr) {
  if (!dateStr) return null;
  const str = String(dateStr).trim();
  if (str.match(/^\d{4}-\d{2}-\d{2}/)) {
    return str.slice(0, 10);
  }
  const dmY = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmY) {
    const day = dmY[1].padStart(2, '0');
    const month = dmY[2].padStart(2, '0');
    const year = dmY[3];
    return `${year}-${month}-${day}`;
  }
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export function CalendarPermohonanSurvey({ permohonans = [], surveys = [] }) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  
  // Format today's YMD for highlighting
  const todayYMD = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [selectedDateYMD, setSelectedDateYMD] = useState(todayYMD);

  // Group Permohonans by YYYY-MM-DD
  const permohonanByDate = useMemo(() => {
    const map = {};
    permohonans.forEach(p => {
      const ymd = parseDateToYMD(p.TANGGAL_PERMOHONAN || p.TANGGAL_REGISTRASI || p.CREATED_AT || p.TANGGAL);
      if (ymd) {
        if (!map[ymd]) map[ymd] = [];
        map[ymd].push(p);
      }
    });
    return map;
  }, [permohonans]);

  // Group Surveys by YYYY-MM-DD
  const surveyByDate = useMemo(() => {
    const map = {};
    surveys.forEach(s => {
      const ymd = parseDateToYMD(s.TANGGAL_SURVEY || s.TANGGAL_SURAT_TUGAS || s.CREATED_AT);
      if (ymd) {
        if (!map[ymd]) map[ymd] = [];
        map[ymd].push(s);
      }
    });
    return map;
  }, [surveys]);

  // Navigation Handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDateYMD(todayYMD);
  };

  // Generate Days Grid for Current Month
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
    const daysInMonth = lastDayOfMonth.getDate();

    const days = [];

    // Padding from previous month
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const ymd = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dayNum,
        ymd,
        isCurrentMonth: false
      });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const ymd = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNum: d,
        ymd,
        isCurrentMonth: true
      });
    }

    // Padding for next month to complete 35 or 42 grid items
    const totalSoFar = days.length;
    const remainingGrid = (totalSoFar > 35 ? 42 : 35) - totalSoFar;
    for (let d = 1; d <= remainingGrid; d++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const ymd = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNum: d,
        ymd,
        isCurrentMonth: false
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Selected date items
  const selectedPermohonans = permohonanByDate[selectedDateYMD] || [];
  const selectedSurveys = surveyByDate[selectedDateYMD] || [];

  // Monthly statistics
  const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const totalPermohonanMonth = useMemo(() => {
    return Object.keys(permohonanByDate)
      .filter(k => k.startsWith(currentMonthPrefix))
      .reduce((sum, k) => sum + permohonanByDate[k].length, 0);
  }, [permohonanByDate, currentMonthPrefix]);

  const totalSurveyMonth = useMemo(() => {
    return Object.keys(surveyByDate)
      .filter(k => k.startsWith(currentMonthPrefix))
      .reduce((sum, k) => sum + surveyByDate[k].length, 0);
  }, [surveyByDate, currentMonthPrefix]);

  // Format date display for selected panel
  const selectedDateFormatted = useMemo(() => {
    if (!selectedDateYMD) return '';
    const [y, m, d] = selectedDateYMD.split('-').map(Number);
    if (!y || !m || !d) return selectedDateYMD;
    const dateObj = new Date(y, m - 1, d);
    const dayName = DAY_NAMES[dateObj.getDay()];
    const monthName = MONTH_NAMES[m - 1];
    return `${dayName}, ${d} ${monthName} ${y}`;
  }, [selectedDateYMD]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-700/80 shadow-sm space-y-5 transition-colors flex flex-col justify-between h-full">
      
      <div className="space-y-4">
        {/* Calendar Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-700/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
              <CalendarIcon size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
                Kalender Permohonan & Survey
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Jadwal pengajuan permohonan & kegiatan verifikasi survey lapangan
              </p>
            </div>
          </div>

          {/* Month Selector Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              onClick={handleToday}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-400 bg-slate-100 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-xl transition-all border border-slate-200/80 dark:border-slate-600 shadow-2xs"
            >
              Hari Ini
            </button>
            
            <div className="flex items-center bg-slate-100 dark:bg-slate-700/80 rounded-xl p-1 border border-slate-200/80 dark:border-slate-600 shadow-2xs">
              <button
                onClick={handlePrevMonth}
                className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-600 transition-colors"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 text-xs font-bold text-slate-800 dark:text-slate-100 min-w-[110px] text-center">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-600 transition-colors"
                title="Bulan Berikutnya"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Legend & Monthly Summary Pills */}
        <div className="flex items-center justify-between flex-wrap gap-2.5 bg-slate-50/80 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/60 text-xs">
          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-xs" />
              <span>Permohonan Ubah Tarif</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
              <span>Survey Lapangan</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Bulan {MONTH_NAMES[currentMonth]}:</span>
            <span className="bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-lg font-bold text-[11px] border border-blue-200/60 dark:border-blue-800/60 shadow-2xs">
              📘 {totalPermohonanMonth} Permohonan
            </span>
            <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-lg font-bold text-[11px] border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs">
              🟢 {totalSurveyMonth} Survey
            </span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
          <div className="w-full sm:min-w-[540px]">
            {/* Day Name Header */}
            <div className="grid grid-cols-7 gap-1 text-center font-extrabold text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              {DAY_NAMES.map((day, dIdx) => (
                <div key={day} className="py-1">
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][dIdx]}</span>
                </div>
              ))}
            </div>

            {/* Grid Cells */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {calendarDays.map((item, idx) => {
                const pCount = permohonanByDate[item.ymd]?.length || 0;
                const sCount = surveyByDate[item.ymd]?.length || 0;
                const isToday = item.ymd === todayYMD;
                const isSelected = item.ymd === selectedDateYMD;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDateYMD(item.ymd)}
                    className={`
                      min-h-[48px] sm:min-h-[64px] p-1 sm:p-2 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative group
                      ${!item.isCurrentMonth ? 'opacity-30 bg-slate-50/40 dark:bg-slate-900/10 border-transparent' : 'bg-white dark:bg-slate-800/90 border-slate-200/70 dark:border-slate-700/70 hover:border-blue-400 dark:hover:border-blue-500 shadow-2xs'}
                      ${isToday ? 'ring-2 ring-blue-500/70 dark:ring-blue-400/80 font-black' : ''}
                      ${isSelected ? 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-500 dark:border-blue-500 shadow-sm' : ''}
                    `}
                  >
                    {/* Top Bar: Date Number & Today Indicator */}
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] sm:text-xs font-bold ${
                        isToday ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/80 w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center font-black' :
                        item.isCurrentMonth ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-600'
                      }`}>
                        {item.dayNum}
                      </span>
                      {isToday && (
                        <span className="text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter hidden sm:inline">Hari ini</span>
                      )}
                    </div>

                    {/* Badges Count */}
                    <div className="space-y-0.5 mt-0.5 sm:mt-1">
                      {pCount > 0 && (
                        <div className="bg-blue-100/90 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[8px] sm:text-[9px] font-bold px-1 sm:px-1.5 py-0.25 rounded-md border border-blue-200/80 dark:border-blue-800/60 truncate flex items-center justify-center sm:justify-start gap-0.5 sm:gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                          <span className="hidden sm:inline truncate">{pCount} Permohonan</span>
                          <span className="sm:hidden font-extrabold">{pCount}</span>
                        </div>
                      )}

                      {sCount > 0 && (
                        <div className="bg-emerald-100/90 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[8px] sm:text-[9px] font-bold px-1 sm:px-1.5 py-0.25 rounded-md border border-emerald-200/80 dark:border-emerald-800/60 truncate flex items-center justify-center sm:justify-start gap-0.5 sm:gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="hidden sm:inline truncate">{sCount} Survey</span>
                          <span className="sm:hidden font-extrabold">{sCount}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Date Agenda Details Box */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-700/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-blue-600 dark:text-blue-400" />
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Agenda Hari: <span className="text-blue-600 dark:text-blue-400 font-extrabold">{selectedDateFormatted}</span>
            </h4>
          </div>
          <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-600">
            {selectedPermohonans.length + selectedSurveys.length} Aktivitas
          </span>
        </div>

        {selectedPermohonans.length === 0 && selectedSurveys.length === 0 ? (
          <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/50 text-center text-xs text-slate-500 dark:text-slate-400 font-medium italic flex items-center justify-center gap-2">
            <Info size={14} className="text-slate-400" />
            <span>Tidak ada agenda permohonan atau survey pada tanggal {selectedDateFormatted}.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Permohonan List for selected date */}
            <div className="space-y-2">
              <h5 className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={13} /> Permohonan Ubah Tarif ({selectedPermohonans.length})
              </h5>
              {selectedPermohonans.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic px-2">Tidak ada permohonan</p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {selectedPermohonans.map(item => (
                    <div key={item.IDPEL} className="p-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between gap-2 shadow-2xs">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{item.IDPEL}</span>
                          <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.25 rounded">{item.TARIF} → {item.TARIF_BARU || '—'}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">{item.NAMA}</p>
                      </div>
                      <Link
                        to="/permohonan"
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold flex items-center gap-0.5 shrink-0"
                      >
                        Detail <ArrowRight size={12} />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Survey List for selected date */}
            <div className="space-y-2">
              <h5 className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity size={13} /> Survey Lapangan ({selectedSurveys.length})
              </h5>
              {selectedSurveys.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic px-2">Tidak ada survey</p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {selectedSurveys.map(item => (
                    <div key={item.IDPEL} className="p-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between gap-2 shadow-2xs">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">{item.IDPEL}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.25 rounded ${
                            item.KESIMPULAN_SPI === 'Efektif'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                          }`}>
                            SPI: {item.KESIMPULAN_SPI || 'Belum'}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">{item.NAMA}</p>
                      </div>
                      <Link
                        to="/survey"
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-bold flex items-center gap-0.5 shrink-0"
                      >
                        Detail <ArrowRight size={12} />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
