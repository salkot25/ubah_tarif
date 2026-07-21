import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import { useSurveyData } from '../hooks/useSurveyData';
import { Badge, KesimpulanBadge } from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Spinner';
import { ExternalLink, Layers } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const CENTER = [-7.34, 110.51]; // Salatiga center

export default function MapPage() {
  const { surveys, loading, fetchSurveys } = useSurveyData();

  useEffect(() => {
    fetchSurveys({ limit: 500 });
  }, []);

  // Filter only valid coordinates
  const markers = surveys.filter(
    s => s.LAT && s.LONG && !isNaN(parseFloat(s.LAT)) && !isNaN(parseFloat(s.LONG))
  );

  const efektifCount = markers.filter(s => s.KESIMPULAN_SPI === 'Efektif').length;
  const tidakEfektifCount = markers.filter(s => s.KESIMPULAN_SPI === 'Tidak Efektif').length;
  const belumCount = markers.filter(s => !s.KESIMPULAN_SPI || s.KESIMPULAN_SPI.trim() === '').length;

  return (
    <div className="relative w-full h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] rounded-2xl md:rounded-3xl overflow-hidden border border-slate-200/90 dark:border-slate-800 shadow-lg flex flex-col">
      {/* Floating Glassmorphism Map Legend & Summary Panel */}
      <div className="absolute top-3 left-3 right-3 z-20 pointer-events-none flex justify-center">
        <div className="pointer-events-auto w-full max-w-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/90 dark:border-slate-700/90 shadow-xl rounded-2xl p-3 md:px-4 md:py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold">
            <Layers size={16} className="text-blue-600 flex-shrink-0" />
            <span><span className="text-blue-700 dark:text-blue-400 font-black">{markers.length}</span> Titik Survey</span>
          </div>

          <div className="flex items-center gap-3 font-semibold text-[11px]">
            <span className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 px-2 py-1 rounded-lg border border-emerald-100 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Efektif ({efektifCount})</span>
            </span>
            <span className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 px-2 py-1 rounded-lg border border-rose-100 dark:border-rose-800">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Tidak Efektif ({tidakEfektifCount})</span>
            </span>
            <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Belum Survey ({belumCount})</span>
            </span>
          </div>
        </div>
      </div>

      {/* Map Content Viewport */}
      <div className="flex-1 w-full h-full relative z-0">
        {loading && markers.length === 0 ? (
          <div className="w-full h-full bg-white dark:bg-slate-900 flex items-center justify-center">
            <PageLoader />
          </div>
        ) : (
          <MapContainer
            center={CENTER}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {markers.map((survey, i) => {
              const lat = parseFloat(survey.LAT);
              const lng = parseFloat(survey.LONG);
              const kesimpulan = survey.KESIMPULAN_SPI;
              const color = kesimpulan === 'Efektif' ? '#10b981' : kesimpulan === 'Tidak Efektif' ? '#ef4444' : '#94a3b8';

              return (
                <CircleMarker
                  key={survey.IDPEL || i}
                  center={[lat, lng]}
                  radius={8}
                  pathOptions={{
                    fillColor: color,
                    fillOpacity: 0.85,
                    color: 'white',
                    weight: 2,
                  }}
                >
                  <Tooltip direction="top" offset={[0, -5]} opacity={0.95}>
                    <div className="p-1 space-y-1 text-[11px] leading-tight">
                      <div className="font-bold text-slate-800">{survey.NAMA || 'Tanpa Nama'}</div>
                      <div className="font-mono text-[9px] text-blue-600 font-bold">{survey.IDPEL}</div>
                      <div className="text-[10px] text-slate-500 font-semibold">
                        {survey.TARIF || '—'} / {survey.DAYA ? `${Number(survey.DAYA).toLocaleString('id')} VA` : '—'}
                      </div>
                      <div className="pt-0.5 font-bold text-[9px]">
                        SPI: <span className={kesimpulan === 'Efektif' ? 'text-emerald-600' : kesimpulan === 'Tidak Efektif' ? 'text-rose-600' : 'text-slate-400'}>
                          {kesimpulan || 'Belum'}
                        </span>
                      </div>
                    </div>
                  </Tooltip>
                  <Popup className="survey-popup">
                    <div className="w-[280px] sm:w-[320px] overflow-hidden flex flex-col font-sans">
                      {/* Color Header Indicator strip */}
                      <div 
                        className="h-1.5 w-full transition-colors duration-200" 
                        style={{ backgroundColor: color }}
                      />
                      
                      {/* Body Content */}
                      <div className="p-4 flex flex-col gap-2.5">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">Nama Pelanggan</span>
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug tracking-tight">
                            {survey.NAMA || 'Tanpa Nama'}
                          </h4>
                        </div>

                        <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/40 text-xs">
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">ID Pelanggan</span>
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-[11px] block mt-0.5">{survey.IDPEL}</span>
                          </div>
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Tarif / Daya</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200 text-[11px] block mt-0.5">
                              {survey.TARIF || '—'} / {survey.DAYA ? `${Number(survey.DAYA).toLocaleString('id')} VA` : '—'}
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">Alamat Lokasi</span>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed text-justify max-h-[60px] overflow-y-auto pr-1">
                            {survey.ALAMAT || 'Alamat belum tercatat.'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2.5 mt-1">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">Evaluasi SPI</span>
                            <KesimpulanBadge value={kesimpulan} />
                          </div>
                          
                          <a
                            href={`https://maps.google.com/?q=${lat},${lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-800 dark:hover:text-blue-200 text-[11px] font-bold rounded-lg border border-blue-100/50 dark:border-blue-900/50 transition-all duration-150"
                          >
                            <ExternalLink size={11} /> Google Maps
                          </a>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        )}
      </div>

      {/* Floating Bottom Warning for Missing Coordinates */}
      {!loading && surveys.length > markers.length && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <p className="pointer-events-auto text-[10px] md:text-xs font-semibold text-slate-600 bg-white/90 backdrop-blur-md border border-slate-200/90 px-3 py-1 rounded-full shadow-md">
            ⚠️ {surveys.length - markers.length} data survey belum memiliki koordinat GPS
          </p>
        </div>
      )}
    </div>
  );
}
