import { ArrowLeft,BarChart3,Check,Copy,FileImage,Globe,History,Layers,MapPin,Menu,PenTool,Search,Settings2,ShieldAlert,Sparkles,Tablet,Trash2,X,Zap } from 'lucide-react';
import { AnimatePresence,motion } from 'motion/react';
import React,{ useEffect,useMemo,useState } from 'react';
import { encodeAGID } from '../lib/agid';
import {
  AGID_POSTAL_TARGET_COUNTRIES,
  AGID_POSTAL_TEMPLATES,
  buildAgidPostalDesignPlan,
  createAgidPostalZoneEditRecord,
  summarizeAgidPostalZoneEditRecord,
  updateAgidPostalZoneEditRecord,
  type AgidPostalZoneEditRecord,
  type AgidPostalZoneEditSourceKind,
  type AgidPostalTargetCountry,
  type AgidPostalTemplateId,
} from '../lib/agidPostalCodeEngine';
import { cn } from '../lib/utils';
import { fetchCountryBoundary,fetchCountryCities,fetchCountryStats,type CountryStats } from '../services/GeoAdminService';

interface PostalCodeLabProps {
  isOpen: boolean;
  onClose: () => void;
  onJumpTo: (lat: number, lng: number, zoom?: number) => void;
  onSelectCountry?: (countryCode: string) => void;
  currentAgid: string | null;
  currentAddress: string | null;
  lat: number;
  lng: number;
}

const ZONE_EDIT_RECORDS_STORAGE_KEY = 'agid.postal.zoneEditRecords.v1';

const ZONE_EDIT_SOURCE_OPTIONS: Array<{ value: AgidPostalZoneEditSourceKind; label: string; helper: string }> = [
  { value: 'pen-tablet', label: 'Pen Tablet', helper: 'Stylus stroke / pressure audit' },
  { value: 'display-tablet', label: 'Display Tablet', helper: 'Direct screen drawing' },
  { value: 'adobe-illustrator', label: 'Adobe Illustrator', helper: 'Vector boundary import' },
  { value: 'adobe-pdf', label: 'Adobe PDF', helper: 'Marked-up PDF import' },
  { value: 'gis-import', label: 'GIS Import', helper: 'QGIS / GeoJSON cell list' },
  { value: 'manual-pointer', label: 'Manual', helper: 'Mouse or keyboard edit' },
];

export const PostalCodeLab: React.FC<PostalCodeLabProps> = ({
  isOpen,
  onClose,
  onJumpTo,
  onSelectCountry,
  currentAgid,
  lat,
  lng
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<AgidPostalTargetCountry | null>(null);
  const [countryBoundary, setCountryBoundary] = useState<any>(null);
  const [countryStats, setCountryStats] = useState<CountryStats | null>(null);
  const [, setIsLoadingBoundary] = useState(false);
  const [, setIsLoadingStats] = useState(false);
  const [templateId, setTemplateId] = useState<AgidPostalTemplateId>('agid-native');
  const [customDigitCount, setCustomDigitCount] = useState<number>(5);
  const [isSaved, setIsSaved] = useState(false);
  const [cities, setCities] = useState<any[]>([]);
  const [, setIsLoadingCities] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Local AGID state for the selected country preview
  const [previewAgid, setPreviewAgid] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [zoneEditSourceKind, setZoneEditSourceKind] = useState<AgidPostalZoneEditSourceKind>('pen-tablet');
  const [zoneAgidInput, setZoneAgidInput] = useState('');
  const [zoneEditRecord, setZoneEditRecord] = useState<AgidPostalZoneEditRecord | null>(null);
  const [savedZoneRecords, setSavedZoneRecords] = useState<AgidPostalZoneEditRecord[]>([]);
  const [tabletStrokeCount, setTabletStrokeCount] = useState(0);
  const [lastPointerType, setLastPointerType] = useState('none');

  // Auto-select current country on mount
  useEffect(() => {
    if (isOpen && !selectedCountry && currentAgid) {
      const cc = currentAgid.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase();
      const match = AGID_POSTAL_TARGET_COUNTRIES.find(c => c.code === cc);
      if (match) {
        setSelectedCountry(match);
      }
    }
  }, [isOpen, currentAgid]);

  useEffect(() => {
    if (!isOpen) return;
    try {
      const parsed = JSON.parse(localStorage.getItem(ZONE_EDIT_RECORDS_STORAGE_KEY) || '[]');
      setSavedZoneRecords(Array.isArray(parsed) ? parsed : []);
    } catch {
      setSavedZoneRecords([]);
    }
  }, [isOpen]);

  useEffect(() => {
    setZoneEditRecord(null);
    setZoneAgidInput('');
    setTabletStrokeCount(0);
    setLastPointerType('none');
  }, [selectedCountry?.code]);

  // Suggested digits calculation
  useEffect(() => {
    if (countryStats?.population) {
      // Suggest shortest digits based on population coverage (roughly 1 code per 150-200 people/units)
      const suggested = Math.ceil(Math.log10(countryStats.population / 150));
      setCustomDigitCount(Math.max(3, Math.min(8, suggested)));
    }
  }, [countryStats]);

  const filteredCountries = useMemo(() => {
    return AGID_POSTAL_TARGET_COUNTRIES.filter(c =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.region.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);


  // Fetch cities, boundary and stats when country is selected
  useEffect(() => {
    if (selectedCountry) {
      let cancelled = false;
      setIsLoadingCities(true);
      setIsLoadingBoundary(true);
      setIsLoadingStats(true);

      fetchCountryCities(selectedCountry.code)
        .then(data => {
          if (cancelled) return;
          setCities(data || []);
          setIsLoadingCities(false);
        })
        .catch(err => {
          if (cancelled) return;
          console.error("Failed to fetch cities:", err);
          setIsLoadingCities(false);
        });

      fetchCountryBoundary(selectedCountry.code)
        .then(data => {
          if (cancelled) return;
          setCountryBoundary(data);
          setIsLoadingBoundary(false);
        })
        .catch(err => {
          if (cancelled) return;
          console.error("Failed to fetch boundary:", err);
          setIsLoadingBoundary(false);
        });

      fetchCountryStats(selectedCountry.code)
        .then(data => {
          if (cancelled) return;
          setCountryStats(data);
          setIsLoadingStats(false);
        })
        .catch(err => {
          if (cancelled) return;
          console.error("Failed to fetch stats:", err);
          setIsLoadingStats(false);
        });

      return () => {
        cancelled = true;
      };
    } else {
      setCities([]);
      setCountryBoundary(null);
      setCountryStats(null);
    }
  }, [selectedCountry]);

  // Update preview when country or location changes
  useEffect(() => {
    const targetLat = selectedCountry ? selectedCountry.lat : lat;
    const targetLng = selectedCountry ? selectedCountry.lng : lng;
      const result = encodeAGID(targetLat, targetLng);
      setPreviewAgid(result.id);
  }, [selectedCountry, lat, lng]);

  const selectedAgid = useMemo(() => {
    const normalizedCurrent = currentAgid?.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || '';
    if (selectedCountry && normalizedCurrent.startsWith(selectedCountry.code)) return normalizedCurrent;
    return previewAgid;
  }, [currentAgid, previewAgid, selectedCountry]);

  const designPlan = useMemo(() => {
    if (!selectedCountry) return null;
    return buildAgidPostalDesignPlan({
      profile: {
        countryCode: selectedCountry.code,
        countryName: selectedCountry.name,
        population: countryStats?.population,
        areaKm2: countryStats?.area,
        municipalityCount: cities.length || undefined,
        evidenceSources: [selectedCountry.region, selectedCountry.note],
      },
      agid: selectedAgid,
      templateId,
      currentTemplateId: 'agid-native',
      length: customDigitCount,
    });
  }, [cities.length, countryStats?.area, countryStats?.population, customDigitCount, selectedAgid, selectedCountry, templateId]);

  const zoneEditSummary = useMemo(() => {
    return zoneEditRecord ? summarizeAgidPostalZoneEditRecord(zoneEditRecord) : null;
  }, [zoneEditRecord]);

  useEffect(() => {
    if (designPlan?.generated?.ok && designPlan.generated.code) {
      setGeneratedCode(designPlan.generated.code);
      setIsSaved(false);
    } else if (designPlan?.generated?.blockedReason) {
      setGeneratedCode(designPlan.generated.blockedReason);
    }
  }, [designPlan, customDigitCount]);

  const handleCountrySelect = (country: AgidPostalTargetCountry) => {
    setSelectedCountry(country);
    setTemplateId(recommendTemplateForCountryName(country.name));
    onJumpTo(country.lat, country.lng, 8);
    if (onSelectCountry) {
      onSelectCountry(country.code);
    }
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const buildZoneEditSource = () => ({
    kind: zoneEditSourceKind,
    appName: zoneEditSourceKind.startsWith('adobe') ? zoneEditSourceKind.replace(/-/g, ' ') : zoneEditSourceKind === 'gis-import' ? 'GIS import' : undefined,
    deviceName: zoneEditSourceKind === 'pen-tablet' || zoneEditSourceKind === 'display-tablet' ? 'Pointer Events compatible tablet' : undefined,
    pressureSupported: zoneEditSourceKind === 'pen-tablet' || zoneEditSourceKind === 'display-tablet',
  });

  const parseZoneAgidInput = () => zoneAgidInput
    .split(/[\s,;]+/)
    .map(value => value.trim())
    .filter(Boolean);

  const upsertZoneEditRecord = (patch: {
    integratedAgids?: string[];
    editedAgids?: Array<{ originalAgid: string; editedAgid?: string; operation?: 'include' | 'exclude' | 'reshape' | 'merge' | 'split' | 'adobe-import' | 'gis-import'; pressureSamples?: number; note?: string }>;
    excludedAgids?: string[];
  }) => {
    if (!selectedCountry || !designPlan?.generated?.ok || !generatedCode) return;
    const source = buildZoneEditSource();
    const now = new Date().toISOString();
    const next = zoneEditRecord
      ? updateAgidPostalZoneEditRecord(zoneEditRecord, { ...patch, source, now })
      : createAgidPostalZoneEditRecord({
        countryCode: selectedCountry.code,
        postalCode: generatedCode,
        displayCode: generatedCode,
        source,
        ...patch,
        now,
      });
    setZoneEditRecord(next);
  };

  const handleImportZoneAgids = () => {
    const imported = parseZoneAgidInput();
    if (imported.length === 0) return;
    const operation = zoneEditSourceKind === 'gis-import' ? 'gis-import' : zoneEditSourceKind.startsWith('adobe') ? 'adobe-import' : 'include';
    upsertZoneEditRecord({
      integratedAgids: imported,
      editedAgids: imported.map(agid => ({
        originalAgid: agid,
        operation,
        note: `${ZONE_EDIT_SOURCE_OPTIONS.find(option => option.value === zoneEditSourceKind)?.label || 'Source'} import`,
      })),
    });
    setZoneAgidInput('');
  };

  const handleCurrentAgidAdd = () => {
    if (!selectedAgid) return;
    upsertZoneEditRecord({
      integratedAgids: [selectedAgid],
      editedAgids: [{
        originalAgid: selectedAgid,
        operation: 'include',
        note: 'Added from current map AGID',
      }],
    });
  };

  const handleCurrentAgidExclude = () => {
    if (!selectedAgid) return;
    upsertZoneEditRecord({
      excludedAgids: [selectedAgid],
      editedAgids: [{
        originalAgid: selectedAgid,
        operation: 'exclude',
        note: 'Excluded from current postal zone draft',
      }],
    });
  };

  const handleTabletStroke = (event: React.PointerEvent<HTMLDivElement>) => {
    setLastPointerType(event.pointerType || 'pointer');
    setTabletStrokeCount(count => count + 1);
    if (!selectedAgid) return;
    upsertZoneEditRecord({
      editedAgids: [{
        originalAgid: selectedAgid,
        operation: 'reshape',
        pressureSamples: event.pressure > 0 ? 1 : 0,
        note: `Tablet stroke committed with pointer=${event.pointerType || 'pointer'}`,
      }],
    });
  };

  const handleSaveZoneLedger = () => {
    if (!zoneEditRecord) return;
    const next = [
      zoneEditRecord,
      ...savedZoneRecords.filter(record => record.id !== zoneEditRecord.id),
    ].slice(0, 25);
    setSavedZoneRecords(next);
    localStorage.setItem(ZONE_EDIT_RECORDS_STORAGE_KEY, JSON.stringify(next));
    setIsSaved(true);
  };

  if (!isOpen) return null;

  function recommendTemplateForCountryName(name: string): AgidPostalTemplateId {
    const lower = name.toLowerCase();
    if (/bahamas|fiji|cook|curacao|seychelles|solomon|sao tome|tonga|tuvalu|vanuatu|tokelau|aruba|sint maarten|comoros/.test(lower)) return 'agid-native';
    if (/chad|libya|mali|mauritania|botswana/.test(lower)) return 'us-like';
    if (/rwanda|bolivia|yemen|eritrea/.test(lower)) return 'france-like';
    return 'agid-native';
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] pointer-events-none"
      >
        {/* Header */}
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="absolute top-0 left-0 right-0 h-16 md:h-20 bg-white/95 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-4 md:px-8 pointer-events-auto shadow-sm"
        >
          <div className="flex items-center gap-3 md:gap-6">
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <div className="flex flex-col">
              <h2 className="text-base md:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Postal Lab
                <span className="text-[8px] md:text-[10px] bg-blue-600 text-white px-1.5 md:py-0.5 rounded-lg uppercase tracking-widest font-black">Beta</span>
              </h2>
              <p className="text-[8px] md:text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                <Sparkles className="w-2 h-2 md:w-3 md:h-3" /> Experimental
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {selectedCountry && (
              <div className="flex items-center gap-2 md:gap-3 bg-slate-50 px-3 md:px-4 py-1.5 md:py-2 rounded-xl border border-slate-100">
                <img
                  src={`https://flagcdn.com/w40/${selectedCountry.code.toLowerCase()}.png`}
                  alt={selectedCountry.name}
                  className="w-4 md:w-5 h-auto rounded shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <span className="text-[10px] md:text-xs font-black text-slate-700 uppercase tracking-widest truncate max-w-[80px] md:max-w-none">
                  {selectedCountry.name}
                </span>
              </div>
            )}
            <div className="hidden md:block w-px h-8 bg-slate-100 mx-2" />
            <div className="hidden sm:flex bg-amber-50 border border-amber-100 px-3 md:px-4 py-1.5 md:py-2 rounded-xl items-center gap-2 md:gap-3">
              <ShieldAlert className="w-3 h-3 md:w-4 md:h-4 text-amber-600 shrink-0" />
              <p className="text-[8px] md:text-[10px] text-amber-700 font-bold leading-relaxed hidden lg:block">
                Architecting postal protocols for non-indexed territories.
              </p>
            </div>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 bg-blue-50 text-blue-600 rounded-xl md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Sidebar (Left) */}
        <motion.div
          initial={false}
          animate={{ x: isSidebarOpen ? 0 : -280 }}
          className="absolute top-16 md:top-20 left-0 bottom-0 w-72 bg-white/95 backdrop-blur-md border-r border-slate-100 flex flex-col pointer-events-auto shadow-2xl z-20"
        >
          {selectedCountry ? (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/30 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-5 rounded border border-slate-200 overflow-hidden shrink-0">
                    <img
                      src={`https://flagcdn.com/w80/${selectedCountry.code.toLowerCase()}.png`}
                      alt={selectedCountry.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h3 className="text-xs font-black text-slate-800 tracking-tight truncate leading-none mb-0.5">{selectedCountry.name}</h3>
                    <div className="flex items-center gap-1.5 opacity-60">
                      <span className="text-[7px] font-black uppercase tracking-widest">{selectedCountry.code}</span>
                      <span className="text-[7px] font-bold uppercase tracking-widest truncate">{selectedCountry.region}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCountry(null)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-400"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                {/* Territory Statistics */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-blue-600">
                    <BarChart3 className="w-3.5 h-3.5" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest">Territory Statistics</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Pop</p>
                      <p className="text-xs font-black text-slate-900 tracking-tight">{countryStats?.population.toLocaleString() || '---'}</p>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Area</p>
                      <p className="text-xs font-black text-slate-900 tracking-tight">{countryStats?.area.toLocaleString() || '---'}</p>
                    </div>
                  </div>
                </div>

                {/* Protocol Architect */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-purple-600">
                    <Settings2 className="w-3.5 h-3.5" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest">AGID Postal Architect</h4>
                  </div>
                  <div className="bg-white border-2 border-slate-50 p-3 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-purple-600 font-mono">{customDigitCount}D</span>
                      <button
                        onClick={() => designPlan && setTemplateId(designPlan.recommendation.templateId)}
                        className="px-2 py-1 rounded-lg bg-purple-50 text-purple-700 text-[7px] font-black uppercase tracking-widest"
                      >
                        Use AI Pick
                      </button>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="8"
                      step="1"
                      value={customDigitCount}
                      onChange={(e) => setCustomDigitCount(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-100 rounded-full appearance-none cursor-pointer accent-purple-600"
                    />
                    <select
                      value={templateId}
                      onChange={(event) => setTemplateId(event.target.value as AgidPostalTemplateId)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-[10px] font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    >
                      {Object.values(AGID_POSTAL_TEMPLATES).map(template => (
                        <option key={template.id} value={template.id}>
                          {template.label} - {template.format}
                        </option>
                      ))}
                    </select>
                    {designPlan && (
                      <div className="grid grid-cols-3 gap-1.5">
                        <div className="rounded-xl bg-emerald-50 p-2">
                          <p className="text-[6px] font-black uppercase tracking-widest text-emerald-700">Class</p>
                          <p className="text-sm font-black text-emerald-900">{designPlan.classification.class}</p>
                        </div>
                        <div className="rounded-xl bg-blue-50 p-2">
                          <p className="text-[6px] font-black uppercase tracking-widest text-blue-700">Mode</p>
                          <p className="text-[8px] font-black text-blue-900 leading-tight">{designPlan.classification.generationMode.replace(/-/g, ' ')}</p>
                        </div>
                        <div className="rounded-xl bg-amber-50 p-2">
                          <p className="text-[6px] font-black uppercase tracking-widest text-amber-700">Terrain</p>
                          <p className="text-[8px] font-black text-amber-900 leading-tight">{designPlan.recommendation.terrain.replace(/-/g, ' ')}</p>
                        </div>
                      </div>
                    )}
                    {designPlan && (
                      <div className={cn(
                        "rounded-xl border p-2.5",
                        designPlan.publication.status === 'publishable' && "bg-emerald-50 border-emerald-100",
                        designPlan.publication.status === 'draft-only' && "bg-blue-50 border-blue-100",
                        designPlan.publication.status === 'review-required' && "bg-amber-50 border-amber-100",
                        designPlan.publication.status === 'blocked' && "bg-rose-50 border-rose-100"
                      )}>
                        <p className={cn(
                          "text-[6px] font-black uppercase tracking-widest",
                          designPlan.publication.status === 'publishable' && "text-emerald-700",
                          designPlan.publication.status === 'draft-only' && "text-blue-700",
                          designPlan.publication.status === 'review-required' && "text-amber-700",
                          designPlan.publication.status === 'blocked' && "text-rose-700"
                        )}>
                          Publication Gate
                        </p>
                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-wide">
                          {designPlan.publication.status.replace(/-/g, ' ')}
                        </p>
                        <p className="mt-1 text-[8px] font-bold text-slate-500 leading-relaxed">
                          Gov {Math.round(designPlan.governance.approvalScore * 100)}% / Data {Math.round(designPlan.dataTrust.trustScore * 100)}% / Privacy {designPlan.privacy.publishable ? 'OK' : 'Hold'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Boundary Guard */}
                {designPlan && (
                  <div className={cn(
                    "rounded-2xl p-3 border space-y-1.5",
                    designPlan.generated?.ok ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"
                  )}>
                    <p className={cn(
                      "text-[8px] font-black uppercase tracking-widest",
                      designPlan.generated?.ok ? "text-emerald-700" : "text-rose-700"
                    )}>
                      {designPlan.generated?.ok ? 'Country boundary guard passed' : 'Country boundary guard blocked'}
                    </p>
                    <p className={cn(
                      "text-[9px] font-bold leading-relaxed",
                      designPlan.generated?.ok ? "text-emerald-800" : "text-rose-800"
                    )}>
                      {designPlan.generated?.ok
                        ? `Selected AGID ${selectedAgid} belongs to ${selectedCountry.code}.`
                        : designPlan.generated?.warnings.join(' ') || designPlan.classification.reason}
                    </p>
                  </div>
                )}

                {/* Synthesis Engine */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <Zap className="w-3.5 h-3.5" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest">Synthesis Engine</h4>
                  </div>
                  <div className="bg-slate-900 rounded-2xl p-4 text-center space-y-2 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-purple-500" />
                    <p className="text-[6px] font-black text-white/30 uppercase tracking-[0.2em]">Output</p>
                    <div className="text-xl font-black text-white tracking-widest font-mono flex items-center justify-center gap-2">
                      {generatedCode}
                      <button
                        onClick={() => {
                          if (designPlan?.generated?.ok) navigator.clipboard.writeText(generatedCode);
                          setIsSaved(true);
                        }}
                        disabled={!designPlan?.generated?.ok}
                        className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-white/40" />}
                      </button>
                    </div>
                    <p className="text-[8px] font-bold text-white/40 leading-relaxed">
                      {AGID_POSTAL_TEMPLATES[templateId].description}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsSaved(true);
                      if (window.innerWidth < 768) setIsSidebarOpen(false);
                    }}
                    disabled={!designPlan?.generated?.ok}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest text-[9px] transition-all shadow-lg active:scale-95"
                  >
                    Save Draft Architecture
                  </button>
                </div>

                {/* Tablet / Adobe Zone Editor */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-rose-600">
                    <PenTool className="w-3.5 h-3.5" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest">Zone Edit Ledger</h4>
                  </div>
                  <div className="bg-white border-2 border-slate-50 p-3 rounded-2xl space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {ZONE_EDIT_SOURCE_OPTIONS.map(option => (
                        <button
                          key={option.value}
                          onClick={() => setZoneEditSourceKind(option.value)}
                          className={cn(
                            "min-h-[52px] rounded-xl border px-2 py-2 text-left transition-all",
                            zoneEditSourceKind === option.value
                              ? "bg-rose-600 text-white border-rose-600 shadow-lg"
                              : "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100"
                          )}
                        >
                          <span className="block text-[8px] font-black uppercase tracking-widest">{option.label}</span>
                          <span className={cn(
                            "block text-[7px] font-bold leading-tight mt-1",
                            zoneEditSourceKind === option.value ? "text-white/70" : "text-slate-400"
                          )}>
                            {option.helper}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div
                      onPointerDown={handleTabletStroke}
                      className="h-24 rounded-2xl border border-dashed border-rose-200 bg-rose-50/50 flex flex-col items-center justify-center text-center touch-none cursor-crosshair"
                    >
                      <Tablet className="w-5 h-5 text-rose-500 mb-2" />
                      <p className="text-[8px] font-black text-rose-700 uppercase tracking-widest">
                        Draw to reshape current AGID cell
                      </p>
                      <p className="text-[7px] font-bold text-rose-500 mt-1">
                        strokes {tabletStrokeCount} / pointer {lastPointerType}
                      </p>
                    </div>

                    <textarea
                      value={zoneAgidInput}
                      onChange={(event) => setZoneAgidInput(event.target.value)}
                      placeholder="Paste AGIDs from Adobe, GIS, tablet export, or manual selection..."
                      className="w-full min-h-[72px] resize-none rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[10px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleCurrentAgidAdd}
                        disabled={!designPlan?.generated?.ok || !selectedAgid}
                        className="min-h-[40px] rounded-xl bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest disabled:opacity-40"
                      >
                        Add Current AGID
                      </button>
                      <button
                        onClick={handleImportZoneAgids}
                        disabled={!designPlan?.generated?.ok || parseZoneAgidInput().length === 0}
                        className="min-h-[40px] rounded-xl bg-rose-600 text-white text-[8px] font-black uppercase tracking-widest disabled:opacity-40"
                      >
                        Import Cells
                      </button>
                      <button
                        onClick={handleCurrentAgidExclude}
                        disabled={!zoneEditRecord || !selectedAgid}
                        className="min-h-[40px] rounded-xl bg-amber-50 text-amber-700 border border-amber-100 text-[8px] font-black uppercase tracking-widest disabled:opacity-40"
                      >
                        Exclude Current
                      </button>
                      <button
                        onClick={handleSaveZoneLedger}
                        disabled={!zoneEditRecord}
                        className="min-h-[40px] rounded-xl bg-emerald-600 text-white text-[8px] font-black uppercase tracking-widest disabled:opacity-40"
                      >
                        Save Ledger
                      </button>
                    </div>

                    {zoneEditSummary ? (
                      <div className="rounded-2xl bg-slate-900 p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-white">
                            <Layers className="w-3.5 h-3.5 text-emerald-400" />
                            <p className="text-[8px] font-black uppercase tracking-widest">Composition</p>
                          </div>
                          <span className="text-[7px] font-black text-white/40 font-mono">{zoneEditSummary.revisionId}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          <div className="rounded-xl bg-white/5 p-2">
                            <p className="text-[6px] font-black uppercase text-white/30">AGIDs</p>
                            <p className="text-sm font-black text-white">{zoneEditSummary.integratedCount}</p>
                          </div>
                          <div className="rounded-xl bg-white/5 p-2">
                            <p className="text-[6px] font-black uppercase text-white/30">Edits</p>
                            <p className="text-sm font-black text-white">{zoneEditSummary.editedCount}</p>
                          </div>
                          <div className="rounded-xl bg-white/5 p-2">
                            <p className="text-[6px] font-black uppercase text-white/30">Reject</p>
                            <p className="text-sm font-black text-white">{zoneEditSummary.rejectedCount}</p>
                          </div>
                          <div className="rounded-xl bg-white/5 p-2">
                            <p className="text-[6px] font-black uppercase text-white/30">Saved</p>
                            <p className="text-sm font-black text-white">{savedZoneRecords.length}</p>
                          </div>
                        </div>
                        {zoneEditRecord.rejectedAgids.length > 0 && (
                          <div className="rounded-xl bg-amber-400/10 border border-amber-400/20 p-2">
                            <p className="text-[7px] font-bold text-amber-200 leading-relaxed">
                              {zoneEditRecord.rejectedAgids.slice(0, 2).map(reject => `${reject.agid}: ${reject.reason}`).join(' / ')}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3 flex items-start gap-2">
                        <FileImage className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <p className="text-[8px] font-bold text-slate-500 leading-relaxed">
                          Edit AGID zone membership with a tablet, Adobe vector import, GIS export, or pasted AGID list. The ledger records integrated AGIDs, excluded AGIDs, edit source, and revision ID.
                        </p>
                      </div>
                    )}

                    {zoneEditRecord && (
                      <button
                        onClick={() => setZoneEditRecord(null)}
                        className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-100 bg-white py-2 text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3 h-3" /> Clear Unsaved Edit
                      </button>
                    )}
                  </div>
                </div>

                {/* Municipality and Remainder Estimate */}
                {designPlan && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-600">
                      <BarChart3 className="w-3.5 h-3.5" />
                      <h4 className="text-[10px] font-black uppercase tracking-widest">Municipality Build Estimate</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Postal Areas</p>
                        <p className="text-xs font-black text-slate-900 tracking-tight">{designPlan.estimate.suggestedPostalAreaCount.toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Per Municipality</p>
                        <p className="text-xs font-black text-slate-900 tracking-tight">{designPlan.estimate.approximatePostalAreasPerMunicipality.toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">AGID Cells</p>
                        <p className="text-xs font-black text-slate-900 tracking-tight">{designPlan.estimate.baseAgidCellCount ? designPlan.estimate.baseAgidCellCount.toExponential(2) : '---'}</p>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Remaining Detect</p>
                        <p className="text-[9px] font-black text-slate-900 leading-tight">prefix + boundary</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Local Context Brief */}
                <div className="space-y-2.5 pt-2 border-t border-slate-50">
                   <div className="flex flex-col p-2.5 bg-slate-50/50 rounded-xl text-left">
                      <span className="text-[7px] font-black text-slate-400 uppercase mb-0.5">Local Context</span>
                      <p className="text-[9px] font-bold text-slate-500 line-clamp-2 leading-relaxed">
                        {selectedCountry.note || 'Systemic absence mapping... Architectural logic pending.'}
                      </p>
                   </div>
                </div>
              </div>

              <div className="mt-auto p-4 border-t border-slate-50 bg-slate-50/20 shrink-0">
                 <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-[7px] font-black text-slate-400 uppercase mb-0.5 tracking-widest">Locked Location</span>
                      <span className="font-mono text-[9px] font-black text-slate-600">{selectedCountry.lat.toFixed(4)}, {selectedCountry.lng.toFixed(4)}</span>
                    </div>
                    <MapPin className="w-3.5 h-3.5 text-blue-500 opacity-30" />
                 </div>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-slate-50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search territories..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => handleCountrySelect(country)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 border-b border-slate-50 transition-all text-left",
                      selectedCountry?.code === country.code ? "bg-blue-600 text-white shadow-lg" : "hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-6 rounded overflow-hidden flex items-center justify-center font-black text-[10px] shrink-0 border border-slate-200",
                        selectedCountry?.code === country.code ? "bg-white/20 border-white/40 text-white" : "bg-slate-100 text-slate-400"
                      )}>
                        <img
                          src={`https://flagcdn.com/w80/${country.code.toLowerCase()}.png`}
                          alt={country.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <p className={cn("text-xs font-black", selectedCountry?.code === country.code ? "text-white" : "text-slate-700")}>
                          {country.name}
                        </p>
                        <p className={cn("text-[9px] font-bold uppercase tracking-widest", selectedCountry?.code === country.code ? "text-white/60" : "text-slate-400")}>
                          {country.region}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {!selectedCountry && (
                <div className="p-8 text-center space-y-4">
                  <Globe className="w-12 h-12 text-slate-200 mx-auto" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                    Choose a country to begin land-based synthesis
                  </p>
                </div>
              )}
            </>
          )}
        </motion.div>

        {/* Minimal Bottom Info for feedback */}
        {selectedCountry && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="absolute bottom-4 left-4 md:left-76 right-4 pointer-events-none z-10"
          >
            <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-[2rem] p-4 md:p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 pointer-events-auto max-w-4xl mx-auto">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase">Protocol Synthesis Active</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-0.5">Real-time data synchronization across all sectors</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                 <div className="flex flex-col items-end">
                    <span className="text-[8px] font-black text-slate-400 uppercase">Current Prefix</span>
                    <span className="text-lg font-black text-slate-900 font-mono tracking-widest">{generatedCode}</span>
                 </div>
                 <div className="w-px h-10 bg-slate-100 mx-2 hidden md:block" />
                 <button
                  onClick={() => onClose()}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-sm"
                 >
                   Exit Lab
                 </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Floating Metadata (Top Right) */}
        {selectedCountry && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-20 md:top-24 right-4 md:right-8 w-64 space-y-4 pointer-events-auto hidden md:block" // Hidden on mobile to avoid overlap
          >
             <div className="bg-white/90 backdrop-blur rounded-[2rem] p-6 border border-slate-100 shadow-xl space-y-4">
                <div className="flex items-center gap-3 text-purple-600">
                  <Globe className="w-4 h-4" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest">Territory Analysis</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Capital</span>
                    <span className="text-xs font-black text-slate-700">{countryStats?.capital || '---'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Geometry</span>
                    <span className="text-xs font-black text-slate-700">{countryBoundary?.type || '---'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Points</span>
                    <span className="text-xs font-black text-slate-700">{cities.length > 50 ? 'High Density' : 'Low Density'}</span>
                  </div>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl">
                  <p className="text-[8px] font-bold text-purple-600/70 italic leading-relaxed">
                    National boundary synchronization complete. Spatial indexing mapping to 512-byte sectors.
                  </p>
                </div>
             </div>

             <div className="bg-slate-900 rounded-[2rem] p-6 shadow-2xl space-y-4">
                <div className="flex items-center gap-3 text-amber-400">
                  <History className="w-4 h-4" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest">Postal Archeology</h4>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-white leading-relaxed">
                    {selectedCountry.note || designPlan?.classification.reason || 'Systemic absence mapping... Architectural logic pending further research.'}
                  </p>
                  <div className="flex items-center gap-2 pt-2 grayscale opacity-50">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Context Synchronized</span>
                  </div>
                </div>
             </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
