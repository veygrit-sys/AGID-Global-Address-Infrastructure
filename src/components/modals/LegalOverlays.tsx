import { X } from 'lucide-react';
import { AnimatePresence,motion } from 'motion/react';
import legalData from '../../data/legal.json';

export function LicensesOverlay({ show, onClose }: { show: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] bg-white/80 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-2xl bg-white shadow-2xl rounded-[2.5rem] border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]"
          >
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Open Source Licenses</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Data Providers & Infrastructure</p>
              </div>
              <button
                onClick={onClose}
                className="w-12 h-12 flex items-center justify-center bg-white rounded-xl text-slate-400 hover:text-slate-900 shadow-sm transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              <section className="space-y-4">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Geospatial Data</h4>
                <div className="space-y-4">
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-sm font-black text-slate-900">OpenStreetMap</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Data from OpenStreetMap contributors, licensed under the Open Data Commons Open Database License (ODbL).
                    </p>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-sm font-black text-slate-900">IHO / Marine Regions</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Marine region boundaries provided by the International Hydrographic Organization via MarineRegions.org.
                    </p>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-sm font-black text-slate-900">Natural Earth / GEBCO</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Global relief and bathymetry data from GEBCO and Natural Earth datasets.
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Frontend Frameworks</h4>
                <div className="grid grid-cols-2 gap-3">
                  {['React', 'Vite', 'Tailwind CSS', 'Framer Motion', 'Lucide React', 'MapLibre GL JS', 'D3.js', 'Recharts'].map(lib => (
                    <div key={lib} className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                      {lib}
                    </div>
                  ))}
                </div>
              </section>

              <div className="pt-10 border-t border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Built by GeoGrid Community
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function LegalOverlay({ activeDoc, onClose }: { activeDoc: 'privacy' | 'terms' | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {activeDoc && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] bg-white/80 backdrop-blur-xl flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full h-full md:h-auto md:max-w-2xl bg-white shadow-2xl md:rounded-[2.5rem] border-x md:border border-slate-100 overflow-hidden flex flex-col md:max-h-[85vh]"
          >
            <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter">
                  {activeDoc === 'privacy' ? legalData.privacy_policy.title : legalData.terms_of_service.title}
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  Last Updated: {activeDoc === 'privacy' ? legalData.privacy_policy.updated : legalData.terms_of_service.updated}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-12 h-12 flex items-center justify-center bg-white rounded-xl text-slate-400 hover:text-slate-900 shadow-sm transition-all active:scale-90"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-10 custom-scrollbar">
              {((activeDoc === 'privacy' ? legalData.privacy_policy.sections : legalData.terms_of_service.sections) as any[]).map((section, idx) => (
                <section key={idx} className="space-y-4">
                  <h4 className="text-base md:text-lg font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0">
                      0{idx + 1}
                    </span>
                    {section.heading}
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium pl-11">
                    {section.content}
                  </p>
                </section>
              ))}

              <div className="pt-10 pb-6 border-t border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  GeoGrid Identity (c) 2026
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
