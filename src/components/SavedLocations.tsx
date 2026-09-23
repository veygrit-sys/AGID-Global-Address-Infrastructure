import {
Bookmark,
BookOpen,
History,
Home as HomeIcon,
MapPin,
Navigation,
Phone,
QrCode,
Search,
ShieldCheck as ShieldIcon,
Trash2,
User,
X
} from 'lucide-react';
import { AnimatePresence,motion } from 'motion/react';
import { QRCodeCanvas } from 'qrcode.react';
import React from 'react';
import { TranslationKey } from '../constants/translations';
import { formatRegisteredAddressLocationDisplay } from '../lib/registeredAddressQr';
import { cn } from '../lib/utils';

interface SavedLocationsProps {
  show: boolean;
  onClose: () => void;
  savedAgids: any[];
  savedQrs: any[];
  savedTab: 'agid' | 'aoid' | 'qr';
  setSavedTab: (tab: 'agid' | 'aoid' | 'qr') => void;
  savedSearch: string;
  setSavedSearch: (search: string) => void;
  t: (key: TranslationKey) => string;
  copyToClipboard: (text: string, id: string) => void;
  copied: string | null;
  deleteSavedAgid: (id: string) => void;
  deleteSavedQr: (id: string) => void;
  saveCurrentAgid: () => void;
  jumpToSaved: (saved: any) => void;
  aoids: any[];
  setAoids: React.Dispatch<React.SetStateAction<any[]>>;
  setAoidModeForced: (forced: boolean) => void;
  setShowAddressRegistration: (show: boolean) => void;
  setLat: (lat: number) => void;
  setLng: (lng: number) => void;
  setZoom: (zoom: number) => void;
  setShowMenu: (show: boolean) => void;
  openQrReader: () => void;
}

export const SavedLocations: React.FC<SavedLocationsProps> = ({
  show,
  onClose,
  savedAgids,
  savedQrs,
  savedTab,
  setSavedTab,
  savedSearch,
  setSavedSearch,
  t,
  copyToClipboard,
  copied,
  deleteSavedAgid,
  deleteSavedQr,
  saveCurrentAgid,
  jumpToSaved,
  aoids,
  setAoids,
  setAoidModeForced,
  setShowAddressRegistration,
  setLat,
  setLng,
  setZoom,
  setShowMenu,
  openQrReader
}) => {
  const startAoidRegistration = () => {
    setAoidModeForced(true);
    setShowAddressRegistration(true);
    onClose();
  };

  const header = savedTab === 'agid'
    ? {
        title: 'Saved AGIDs',
        subtitle: 'Local Public Location IDs',
        icon: <History className="w-5 h-5" />,
      }
    : savedTab === 'aoid'
      ? {
          title: 'Saved AOIDs',
          subtitle: 'Private Owner-Managed IDs',
          icon: <ShieldIcon className="w-5 h-5" />,
        }
      : {
          title: 'Saved QR',
          subtitle: 'Local Address QR Records',
          icon: <QrCode className="w-5 h-5" />,
        };

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm pointer-events-auto"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
            className="fixed top-0 left-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[101] border-r border-slate-200 flex flex-col pointer-events-auto"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-inner">
                  {header.icon}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">
                    {header.title}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {header.subtitle}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-900"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-1 px-1.5 bg-slate-100/50 m-4 rounded-xl border border-slate-200/50 flex">
              <button
                onClick={() => setSavedTab('agid')}
                className={cn(
                  "flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all",
                  savedTab === 'agid' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {t('tab_locations')}
              </button>
              <button
                onClick={() => setSavedTab('qr')}
                className={cn(
                  "flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all",
                  savedTab === 'qr' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {t('saved_qrs')}
              </button>
              <button
                onClick={() => setSavedTab('aoid')}
                className={cn(
                  "flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all",
                  savedTab === 'aoid' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {t('tab_aoid')}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {savedTab === 'agid' ? (
                <>
                  <div className="sticky top-0 z-10 bg-white pb-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder={t('search_agid_placeholder')}
                          value={savedSearch}
                          onChange={(e) => setSavedSearch(e.target.value)}
                          className="w-full bg-slate-50 px-4 py-2 pl-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                      <button
                        onClick={saveCurrentAgid}
                        className="flex h-10 w-10 shrink-0 items-center justify-center border border-blue-100 bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100"
                        title="Save current AGID"
                        aria-label="Save current AGID"
                      >
                        <Bookmark className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {savedAgids.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20">
                      <Bookmark className="w-12 h-12 text-slate-300" />
                      <p className="text-sm font-medium text-slate-500">No saved AGIDs yet.<br/>Save the AGID at the current map location.</p>
                      <button
                        onClick={saveCurrentAgid}
                        className="bg-blue-600 px-6 py-2 text-xs font-bold text-white shadow-lg shadow-blue-100"
                      >
                        Save Current AGID
                      </button>
                    </div>
                  ) : (
                    savedAgids
                      .filter(saved =>
                        saved.id.toLowerCase().includes(savedSearch.toLowerCase()) ||
                        (saved.address && saved.address.toLowerCase().includes(savedSearch.toLowerCase()))
                      )
                      .map((saved) => (
                        <div
                          key={saved.id}
                          className="group bg-slate-50 rounded-2xl border border-slate-100 p-4 hover:border-blue-200 hover:bg-blue-50/30 transition-all shadow-sm"
                        >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black text-blue-600 font-mono">{saved.id.slice(0, 2)}</span>
                            <span className="text-xl font-bold text-slate-700 font-mono">{saved.id.slice(2)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => copyToClipboard(saved.id, 'saved-list-' + saved.id)}
                              className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm"
                              title="Copy AGID"
                            >
                              <BookOpen className={cn("w-4 h-4", copied === ('saved-list-' + saved.id) ? "text-green-500" : "")} />
                            </button>
                            <button
                              onClick={() => deleteSavedAgid(saved.id)}
                              className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-red-600 transition-all shadow-sm"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {saved.address && (
                          <div className="flex items-start gap-2 mb-3">
                            <MapPin className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                            <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{saved.address}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100/50">
                          <span className="text-[9px] font-bold text-slate-300 uppercase">
                            {new Date(saved.savedAt).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => jumpToSaved(saved)}
                            className="text-[10px] font-black text-blue-600 hover:text-blue-700 flex items-center gap-1 group/jump"
                          >
                            JUMP TO MAP
                            <Navigation className="w-3 h-3 group-hover/jump:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </>
              ) : savedTab === 'qr' ? (
                <>
                  <div className="sticky top-0 z-10 bg-white pb-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder={t('search_qr_placeholder')}
                          value={savedSearch}
                          onChange={(e) => setSavedSearch(e.target.value)}
                          className="w-full bg-slate-50 px-4 py-2 pl-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                      <button
                        onClick={openQrReader}
                        className="p-1.5 bg-purple-50 text-purple-600 border border-purple-100 hover:bg-purple-100 transition-colors"
                        title="Open QR Reader"
                        aria-label="Open QR Reader"
                      >
                        <QrCode className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {savedQrs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40 py-20">
                      <QrCode className="w-12 h-12 text-slate-300" />
                      <p className="text-sm font-medium text-slate-500">{t('no_saved_qrs')}<br/>{t('save_qr_instruction')}</p>
                    </div>
                  ) : (
                    savedQrs
                      .filter(q =>
                        q.id.toLowerCase().includes(savedSearch.toLowerCase()) ||
                        (q.address && q.address.toLowerCase().includes(savedSearch.toLowerCase())) ||
                        (q.regionName && q.regionName.toLowerCase().includes(savedSearch.toLowerCase()))
                      )
                      .map((q) => (
                        <div
                          key={q.id}
                          className="bg-white rounded-2xl border border-purple-100 p-4 shadow-sm hover:border-purple-300 transition-all"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex flex-col">
                              <span className="text-lg font-black text-purple-600 font-mono tracking-wider">{q.id}</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase">{q.regionName}</span>
                            </div>
                            <button
                              onClick={() => deleteSavedQr(q.id)}
                              className="p-2 text-slate-300 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {q.imageData && (
                            <div className="mb-3 bg-slate-50 p-2 border border-slate-100 flex justify-center">
                              <img src={q.imageData} alt="QR Card" className="max-h-32 shadow-sm" />
                            </div>
                          )}
                          {q.payload && !q.imageData && (
                            <div className="mb-3 bg-slate-50 p-3 border border-slate-100 flex justify-center">
                              <QRCodeCanvas value={q.payload} size={120} level="H" includeMargin={false} />
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                            <button
                              onClick={() => {
                                if (!q.imageData) return;
                                const link = document.createElement('a');
                                link.download = `AGID_CARD-${q.id}.png`;
                                link.href = q.imageData;
                                link.click();
                              }}
                              className={cn(
                                "text-[10px] font-black",
                                q.imageData ? "text-purple-600 hover:text-purple-700" : "text-slate-300 cursor-not-allowed"
                              )}
                              disabled={!q.imageData}
                            >
                              {t('download_card')}
                            </button>
                            <button
                              onClick={() => jumpToSaved(q)}
                              className="text-[10px] font-black text-slate-600 hover:text-slate-900 flex items-center gap-1"
                            >
                              {t('jump_to_map')}
                              <Navigation className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </>
              ) : (
                <>
                  <div className="sticky top-0 z-10 bg-white pb-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder={t('search_aoid_placeholder')}
                          value={savedSearch}
                          onChange={(e) => setSavedSearch(e.target.value)}
                          className="w-full bg-slate-50 px-4 py-2 pl-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                      <button
                        onClick={startAoidRegistration}
                        className="flex h-10 w-10 shrink-0 items-center justify-center border border-emerald-100 bg-emerald-50 text-emerald-600 transition-colors hover:bg-emerald-100"
                        title="Register AOID"
                        aria-label="Register AOID"
                      >
                        <ShieldIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {aoids.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
                      <ShieldIcon className="w-12 h-12 text-slate-300" />
                      <p className="text-sm font-medium text-slate-500">No AOIDs registered yet.<br/>Create private IDs for your locations.</p>
                      <button
                        onClick={startAoidRegistration}
                        className="px-6 py-2 bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-100"
                      >
                        Register First AOID
                      </button>
                    </div>
                  ) : (
                    aoids
                      .filter(aoid =>
                        aoid.id.toLowerCase().includes(savedSearch.toLowerCase()) ||
                        (aoid.name || '').toLowerCase().includes(savedSearch.toLowerCase()) ||
                        (aoid.address || '').toLowerCase().includes(savedSearch.toLowerCase())
                      )
                      .map((aoid) => {
                        const locationDisplay = formatRegisteredAddressLocationDisplay(aoid);

                        return <div
                          key={aoid.id}
                          className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                              <span className="text-lg font-black text-emerald-700 font-mono tracking-tighter">{aoid.id}</span>
                            </div>
                            <button
                              onClick={() => setAoids(prev => prev.filter(a => a.id !== aoid.id))}
                              className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-xs font-black text-slate-800">{aoid.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-xs font-bold text-slate-500">{aoid.phone}</span>
                            </div>
                            <div className="pt-2 mt-2 border-t border-slate-50">
                              <div className="flex items-start gap-2">
                                <HomeIcon className="w-3 h-3 text-emerald-400 mt-0.5" />
                                <p className="text-[10px] text-slate-400 leading-relaxed italic">
                                  {locationDisplay || aoid.address}
                                </p>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setLat(aoid.lat);
                              setLng(aoid.lng);
                              setZoom(20);
                              onClose();
                              setShowMenu(false);
                            }}
                            className="w-full mt-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-slate-100 group-hover:border-emerald-200"
                          >
                            View on Map
                          </button>
                        </div>;
                      })
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
