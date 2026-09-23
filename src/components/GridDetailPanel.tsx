
import {
ArrowUpRight,
Bookmark,
Check,
ChevronDown,
Copy,
Download,
Flag,
MapPin,
Maximize2,
MessageSquareWarning,
QrCode,
Target,
Waves,
X,
} from 'lucide-react';
import type maplibregl from 'maplibre-gl';
import { AnimatePresence,motion } from 'motion/react';
import { QRCodeCanvas } from 'qrcode.react';
import React from 'react';
import { getAddressFormat,type AddressFormat } from '../data/address_formats';
import {
scoreAddressTabs,
selectVisibleAddressTabs,
} from '../lib/addressTabQuality';
import { assessAddressDisplayQuality,formatAddressDisplayText,shouldPreserveAddressDisplayLines } from '../lib/addressDisplay';
import { collectOpenSourceAddressEvidenceSources } from '../lib/addressEvidence';
import { AddressRenderer,createCanonicalAddress } from '../lib/addressRendering';
import { COUNTRY_LANGUAGES,generateInternationalShippingLabel,LANGUAGES } from '../lib/addressUtils';
import type { AGIDResult } from '../lib/agid';
import {
TERRITORY_CLAIM_DISPLAY_POLICIES,
formatTerritoryClaimSummary,
getTerritoryClaimOptions,
type TerritoryClaimDisplayPolicy,
type TerritoryClaimOption,
} from '../lib/disputedTerritoryClaims';
import {
getAgidAddressDisplayTabs,
getAgidAddressTabLanguages,
isEnglishAddressCountry,
isInternationalShippingEnglishTab,
} from '../lib/languageTabs';
import { cn } from '../lib/utils';
import { executeVerifiedAddressTranslationSync } from '../lib/verifiedAddressTranslation';
import type { AddressDetails } from '../types/address';
import type { RouteStop } from '../types/navigation';
import { AddressLanguageTabs } from './AddressLanguageTabs';
import { AddressFeedbackPanel } from './AddressFeedbackPanel';
import { decideAddressQuality,getAddressQualityPublicCopy } from '../lib/addressQualityDecision';

interface GridDetailPanelProps {
  clickedAgid: AGIDResult | null;
  isAgidPanelCollapsed: boolean;
  setIsAgidPanelCollapsed: (c: boolean) => void;
  isAgidPinnedToGps: boolean;
  setIsAgidPinnedToGps: (p: boolean) => void;
  isManualSelection: boolean;
  setIsManualSelection: (m: boolean) => void;
  setClickedAgid: (a: AGIDResult | null) => void;
  setClickedAddress: (addr: string) => void;
  isQrVisible: boolean;
  setIsQrVisible: (v: boolean) => void;
  clickedAddress: string;
  clickedAddressMap: Record<string, string>;
  clickedAddressTab: string;
  setClickedAddressTab: (t: string) => void;
  clickedAddressTranslated: string;
  clickedAddressDetails: AddressDetails | null;
  clickedActiveLangs: string[];
  copied: string | null;
  setCopied: (s: string | null) => void;
  userLocation: { lat: number, lng: number } | null;
  mapRef: React.MutableRefObject<maplibregl.Map | null>;
  mapPitch: number;
  getDeviceZoom: () => number;
  encodeAGID: (lat: number, lng: number) => AGIDResult;
  reverseGeocode: (lat: number, lng: number, prefix: string, isSea: boolean, force?: boolean) => void;
  fetchAddressForLang: (lat: number, lon: number, langCode: string, isNative: boolean, countryCode: string, force?: boolean) => void;
  saveAgid: (agid: AGIDResult) => void;
  setShowLocationAnalysis: (s: boolean) => void;
  showLocationAnalysis: boolean;
  saveQrCode: () => void;
  setDestination: React.Dispatch<React.SetStateAction<RouteStop | null>>;
  setDestinationQuery: (q: string) => void;
  setIsRoutePlanning: (r: boolean) => void;
  setIsNavigating: (n: boolean) => void;
  setOrigin: React.Dispatch<React.SetStateAction<RouteStop | null>>;
  setOriginQuery: (q: string) => void;
  fastJapaneseTransliterate: (text: string) => string;
  showAlert: (title: string, message: string) => void;
  showPostalCodeLab: boolean;
  setShowPostalCodeLab: (s: boolean) => void;
  showGeoArchitect: boolean;
  setShowGeoArchitect: (s: boolean) => void;
  setIsGridVisible?: (visible: boolean) => void;
  t: (key: string) => string;
}

export const GridDetailPanel: React.FC<GridDetailPanelProps> = ({
  clickedAgid,
  isAgidPanelCollapsed,
  setIsAgidPanelCollapsed,
  isAgidPinnedToGps,
  setIsManualSelection,
  setClickedAgid,
  setClickedAddress,
  isQrVisible,
  setIsQrVisible,
  clickedAddress,
  clickedAddressMap,
  clickedAddressTab,
  setClickedAddressTab,
  clickedAddressTranslated,
  clickedAddressDetails,
  copied,
  setCopied,
  userLocation,
  mapRef,
  mapPitch,
  getDeviceZoom,
  saveAgid,
  saveQrCode,
  setDestination,
  setDestinationQuery,
  setIsRoutePlanning,
  setIsNavigating,
  setOrigin,
  setOriginQuery,
  fastJapaneseTransliterate,
  showAlert,
  setIsGridVisible,
  t
}) => {
  const [shippingLabel, setShippingLabel] = React.useState<string>("");
  const [addressFormat, setAddressFormat] = React.useState<AddressFormat | null>(null);
  const [territoryClaimDisplayPolicy, setTerritoryClaimDisplayPolicy] = React.useState<TerritoryClaimDisplayPolicy>('neutral-first');
  const [selectedTerritoryClaimId, setSelectedTerritoryClaimId] = React.useState<string | null>(null);
  const [isAddressFeedbackOpen, setIsAddressFeedbackOpen] = React.useState(false);
  const claimPolicyRef = React.useRef<TerritoryClaimDisplayPolicy>(territoryClaimDisplayPolicy);

  const openAddressFeedbackPanel = React.useCallback(() => {
    setIsGridVisible?.(true);
    setIsAddressFeedbackOpen(true);
  }, [setIsGridVisible]);

  // Move derived constants and hooks to the top to satisfy Rules of Hooks
  const regionCodeFromAgid = (!clickedAgid?.isSea && clickedAgid?.regionCode ? clickedAgid.regionCode : "").toLowerCase();
  const countryCodeFromPrefix = (clickedAgid?.prefix || "").toLowerCase();
  const countryCodeFromId = (clickedAgid?.id?.slice(0, 2) || "").toLowerCase();
  const countryCodeFromDetails = (clickedAddressDetails?.country_code || "").toLowerCase();
  const countryCode = regionCodeFromAgid || countryCodeFromDetails || countryCodeFromPrefix || countryCodeFromId || "";
  const territoryClaimOptions = React.useMemo(() => getTerritoryClaimOptions({
    regionCode: clickedAgid?.regionCode,
    countryCode,
    regionName: clickedAgid?.regionName || clickedAddressDetails?.country,
  }, territoryClaimDisplayPolicy), [
    clickedAgid?.regionCode,
    clickedAgid?.regionName,
    clickedAddressDetails?.country,
    countryCode,
    territoryClaimDisplayPolicy,
  ]);

  const officialLangs = React.useMemo(() => {
    const formatLanguages = addressFormat?.addressRules?.languages
      ?.map(language => language.code)
      .filter(Boolean) || [];
    if (territoryClaimOptions.length > 0 && formatLanguages.length > 0) {
      return formatLanguages;
    }

    return getAgidAddressTabLanguages({
      countryCode: countryCode || countryCodeFromDetails,
      countryLanguages: COUNTRY_LANGUAGES[countryCode] || ['en'],
      knownLanguageCodes: LANGUAGES.map(lang => lang.code),
    });
  }, [addressFormat, countryCode, countryCodeFromDetails, territoryClaimOptions.length]);

  const displayTabs = React.useMemo(() => {
    return getAgidAddressDisplayTabs(officialLangs);
  }, [officialLangs]);
  const addressVerificationLanguage = React.useMemo(
    () => (
      displayTabs.find(tab => !tab.startsWith('en') && !isInternationalShippingEnglishTab(tab)) ||
      displayTabs[0] ||
      clickedAddressTab
    ),
    [clickedAddressTab, displayTabs]
  );

  React.useEffect(() => {
    let cancelled = false;
    if (!countryCode) {
      setAddressFormat(null);
      return;
    }

    getAddressFormat(countryCode)
      .then(format => {
        if (!cancelled) setAddressFormat(format);
      })
      .catch(() => {
        if (!cancelled) setAddressFormat(null);
      });

    return () => {
      cancelled = true;
    };
  }, [countryCode]);

  React.useEffect(() => {
    const policyChanged = claimPolicyRef.current !== territoryClaimDisplayPolicy;
    claimPolicyRef.current = territoryClaimDisplayPolicy;

    if (territoryClaimOptions.length === 0) {
      if (selectedTerritoryClaimId !== null) setSelectedTerritoryClaimId(null);
      return;
    }
    if (policyChanged || !selectedTerritoryClaimId || !territoryClaimOptions.some(option => option.id === selectedTerritoryClaimId)) {
      setSelectedTerritoryClaimId(territoryClaimOptions[0].id);
    }
  }, [selectedTerritoryClaimId, territoryClaimDisplayPolicy, territoryClaimOptions]);

  const verifiedAddressTranslation = React.useMemo(() => {
    if (!clickedAddressDetails) return null;
    try {
      const evidenceSources = collectOpenSourceAddressEvidenceSources(clickedAddressDetails);
      return executeVerifiedAddressTranslationSync({
        countryCode,
        language: addressVerificationLanguage,
        details: clickedAddressDetails as unknown as Record<string, unknown>,
        format: addressFormat,
        sources: [
          ...(clickedAddressDetails?.address_analysis?.sources || []),
          ...evidenceSources,
        ],
        referenceMatches: clickedAddressDetails?.address_analysis?.referenceMatches || clickedAddressDetails?.openaddresses_matches || [],
      });
    } catch (error) {
      console.warn('Verified address translation fallback:', error);
      return null;
    }
  }, [clickedAddressDetails, addressFormat, countryCode, addressVerificationLanguage]);
  const addressValidation = verifiedAddressTranslation?.validation || null;
  const canonicalClickedAddress = React.useMemo(
    () => clickedAddressDetails ? createCanonicalAddress(clickedAddressDetails) : null,
    [clickedAddressDetails]
  );
  const isInternationalEnglishDisplayTab = React.useCallback(
    (tab: string) => (
      isInternationalShippingEnglishTab(tab) ||
      tab === 'en' ||
      (tab.startsWith('en') && tab !== 'en_domestic' && countryCode.length > 0 && !isEnglishAddressCountry(countryCode))
    ),
    [countryCode]
  );

  React.useEffect(() => {
    if (clickedAddressTab === 'shipping_label' && clickedAddressDetails) {
      generateInternationalShippingLabel(clickedAddressDetails)
        .then(setShippingLabel)
        .catch(() => {
          setShippingLabel("Address label unavailable");
        });
    }
  }, [clickedAddressTab, clickedAddressDetails]);

  const getAddressDisplayForTab = React.useCallback((tab: string) => {
    if (tab === 'shipping_label') {
      return verifiedAddressTranslation?.renderings.shippingLabel || shippingLabel || "Generating shipping label...";
    }

    if (clickedAddressDetails && verifiedAddressTranslation) {
      if (isInternationalEnglishDisplayTab(tab)) {
        return canonicalClickedAddress
          ? AddressRenderer.render(tab, canonicalClickedAddress, addressFormat)
            || AddressRenderer.renderInternationalShippingEnglish(canonicalClickedAddress)
          : verifiedAddressTranslation.renderings.internationalEnglish;
      }
      if (tab === 'en_domestic' && verifiedAddressTranslation.renderings.domesticEnglish) {
        return canonicalClickedAddress
          ? AddressRenderer.render(tab, canonicalClickedAddress, addressFormat)
            || verifiedAddressTranslation.renderings.domesticEnglish
          : verifiedAddressTranslation.renderings.domesticEnglish;
      }
    }

    if (canonicalClickedAddress) {
      const countryFormatRendered = AddressRenderer.render(tab, canonicalClickedAddress, addressFormat);
      if (countryFormatRendered) return countryFormatRendered;
      if (isInternationalEnglishDisplayTab(tab)) {
        return AddressRenderer.renderInternationalShippingEnglish(canonicalClickedAddress);
      }
      if (tab === 'en_domestic' && verifiedAddressTranslation?.renderings.domesticEnglish) {
        return verifiedAddressTranslation.renderings.domesticEnglish;
      }
      if (!tab.startsWith('en')) {
        const tabRendered = AddressRenderer.render(tab, canonicalClickedAddress);
        if (tabRendered) return tabRendered;
        if (tab === clickedAddressTab && addressValidation?.displays.native) {
          return addressValidation.displays.native;
        }
      }
      return AddressRenderer.render(tab, canonicalClickedAddress) || AddressRenderer.renderPartialAddress(tab, canonicalClickedAddress);
    }

    return clickedAddressMap[tab] ||
           (tab === 'en' ? (fastJapaneseTransliterate(clickedAddress) || "Translating...") : clickedAddress) ||
           "Resolving...";
  }, [
    addressValidation,
    addressFormat,
    canonicalClickedAddress,
    clickedAddress,
    clickedAddressMap,
    clickedAddressTab,
    fastJapaneseTransliterate,
    isInternationalEnglishDisplayTab,
    shippingLabel,
    verifiedAddressTranslation,
  ]);

  const addressDisplayTextByTab = React.useMemo(() => {
    return Object.fromEntries(displayTabs.map(tab => {
      try {
        return [tab, getAddressDisplayForTab(tab)];
      } catch (error) {
        console.warn('Address tab quality render fallback:', error);
        return [tab, clickedAddressMap[tab] || clickedAddress || ""];
      }
    }));
  }, [clickedAddress, clickedAddressMap, displayTabs, getAddressDisplayForTab]);

  const addressTabQualities = React.useMemo(() => {
    return scoreAddressTabs(displayTabs, {
      countryCode,
      format: addressFormat,
      validation: addressValidation,
      details: clickedAddressDetails as unknown as Record<string, unknown> | null,
      isSea: clickedAgid?.isSea,
      sources: verifiedAddressTranslation?.sources || [],
      displayTextByTab: addressDisplayTextByTab,
    });
  }, [
    addressDisplayTextByTab,
    addressFormat,
    addressValidation,
    clickedAddressDetails,
    clickedAgid?.isSea,
    countryCode,
    displayTabs,
    verifiedAddressTranslation?.sources,
  ]);

  const visibleDisplayTabs = React.useMemo(() => {
    const qualityVisibleTabs = selectVisibleAddressTabs(displayTabs, addressTabQualities);
    const alwaysVisibleTabs = displayTabs.filter(tab =>
      tab === 'en' ||
      tab === 'en_domestic' ||
      isInternationalShippingEnglishTab(tab)
    );
    const visibleSet = new Set([...qualityVisibleTabs, ...alwaysVisibleTabs]);
    return displayTabs.filter(tab => visibleSet.has(tab));
  }, [addressTabQualities, displayTabs]);

  const addressFeedbackSourceIds = React.useMemo(() => {
    const values = verifiedAddressTranslation?.sources || [];
    return values
      .map(source => {
        if (typeof source === 'string') return source;
        if (source && typeof source === 'object') {
          const maybeSource = source as Record<string, unknown>;
          return String(maybeSource.id || maybeSource.source || maybeSource.label || '').trim();
        }
        return '';
      })
      .filter(Boolean);
  }, [verifiedAddressTranslation?.sources]);

  // If current tab is not in display list (e.g. was 'local'), default to the first official lang
  React.useEffect(() => {
    if (!clickedAgid) return;
    if (clickedAddressTab === 'local' || !visibleDisplayTabs.includes(clickedAddressTab)) {
      if (visibleDisplayTabs.length > 0 && !isInternationalShippingEnglishTab(clickedAddressTab) && clickedAddressTab !== 'shipping_label') {
        setClickedAddressTab(visibleDisplayTabs[0]);
      }
    }
  }, [clickedAgid, clickedAddressTab, setClickedAddressTab, visibleDisplayTabs]);

  if (!clickedAgid) return null;

  const getAddressDisplay = () => {
    return getAddressDisplayForTab(clickedAddressTab);
  };

  const getFallbackAddressDisplay = () =>
    clickedAddressMap[clickedAddressTab] ||
    clickedAddress ||
    clickedAgid?.id ||
    "Address unavailable";

  const safeAddressDisplay = () => {
    try {
      return getAddressDisplay();
    } catch (error) {
      console.warn('Address display fallback:', error);
      return getFallbackAddressDisplay();
    }
  };

  const rawAddressDisplay = safeAddressDisplay();
  const addressQuality = assessAddressDisplayQuality(rawAddressDisplay, {
    country: clickedAddressDetails?.country,
    countryCode,
    missingRequiredFields: addressValidation?.missingRequiredFields,
  });
  const resolvedAddressDisplay = (() => {
    try {
      return addressQuality.isWeak && canonicalClickedAddress
        ? AddressRenderer.renderPartialAddress(clickedAddressTab, canonicalClickedAddress)
        : rawAddressDisplay;
    } catch (error) {
      console.warn('Address display fallback:', error);
      return rawAddressDisplay || getFallbackAddressDisplay();
    }
  })();
  const addressDisplayText = formatAddressDisplayText(resolvedAddressDisplay, { tab: clickedAddressTab, countryCode });
  const preserveAddressDisplayLines = shouldPreserveAddressDisplayLines(clickedAddressTab, countryCode);
  const activeAddressTabQuality = addressTabQualities[clickedAddressTab];
  const addressFeedbackQualityScore = addressTabQualities[clickedAddressTab]?.score;
  const addressQualityDecision = decideAddressQuality({
    tabQuality: activeAddressTabQuality,
    validation: addressValidation,
    displayQuality: addressQuality,
  });
  const qualityCopy = getAddressQualityPublicCopy(
    addressQualityDecision,
    typeof document !== 'undefined' ? document.documentElement.lang : 'en',
  );
  const qualityTone = addressQualityDecision.state === 'address-ok'
    ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100'
    : addressQualityDecision.state === 'restricted'
      ? 'border-red-400/25 bg-red-400/10 text-red-100'
      : 'border-amber-300/25 bg-amber-300/10 text-amber-100';
  const missingRequiredFields = addressValidation?.missingRequiredFields || [];
  const selectedTerritoryClaim: TerritoryClaimOption | null =
    territoryClaimOptions.find(option => option.id === selectedTerritoryClaimId) || territoryClaimOptions[0] || null;

  return (
    <>
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.8, opacity: 0, y: 20 }}
      className={cn(
        "bg-slate-900/90 backdrop-blur-xl shadow-2xl border pointer-events-auto text-white transition-all duration-500 overflow-hidden mx-auto",
        clickedAgid.id.startsWith('IN') ? "border-orange-500/30" : clickedAgid.id.startsWith('ZA') ? "border-green-500/30" : "border-slate-800",
        isAgidPanelCollapsed
           ? "w-14 h-14 rounded-xl flex items-center justify-center p-0 cursor-pointer hover:bg-slate-800 hover:scale-110 active:scale-95 shadow-red-500/20 shadow-lg"
           : "w-full rounded-2xl p-4"
      )}
      onClick={isAgidPanelCollapsed ? () => setIsAgidPanelCollapsed(false) : undefined}
    >
      <div className={cn("flex flex-col gap-2 w-full h-full", isAgidPanelCollapsed && "items-center justify-center")}>
        {isAgidPanelCollapsed ? (
           <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center"
           >
               <div className="relative">
                <div className="w-4 h-4 bg-red-500 rounded-sm shadow-[0_0_12px_rgba(239,68,68,0.7)]" />
                <div className={cn(
                  "absolute -top-1.5 -right-1.5 w-2.5 h-2.5 rounded-full animate-pulse",
                  isAgidPinnedToGps ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                )} />
               </div>
           </motion.div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400">
                <div className="p-1.5 bg-red-500/10 rounded-lg">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.1em] text-red-400/90 truncate max-w-[150px]">
                  {clickedAgid.isSea ? t('agid_code') : t('country_code')}
                </span>
                {isAgidPinnedToGps && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded-full animate-pulse">
                    <Target className="w-2 h-2 text-amber-500" />
                    <span className="text-[7px] font-black uppercase text-amber-500 tracking-tighter">GPS Locked</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setIsAgidPanelCollapsed(true); }}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors text-slate-500 hover:text-white"
                  title="Collapse"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                     e.stopPropagation();
                     setIsManualSelection(false);
                     if (mapRef.current) {
                       setClickedAgid(null);
                       setClickedAddress("");
                     }
                     setIsQrVisible(false);
                     setIsAgidPanelCollapsed(false);
                  }}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors text-slate-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
               <div className="flex items-center justify-between gap-3 px-0.5">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <motion.div
                    layoutId="agid-text"
                    className="font-black text-white tracking-widest font-mono truncate text-lg"
                  >
                    {clickedAgid.id}
                  </motion.div>
                  <button
                    onClick={() => {
                       const addr = clickedAddressTab === 'translated' ? clickedAddressTranslated : clickedAddressMap[clickedAddressTab] || clickedAddress;
                       const fullText = `${clickedAgid.id}${addr ? ` (${addr})` : ''}`;
                       navigator.clipboard.writeText(fullText);
                       setCopied('agid');
                       setTimeout(() => setCopied(null), 2000);
                    }}
                    className="p-1 hover:bg-white/10 text-slate-400 rounded-lg transition-all active:scale-95"
                    title="Copy ID & Address"
                  >
                    {copied === 'agid' ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <Copy className="w-2.5 h-2.5" />}
                  </button>
                </div>

                <div className="flex items-center gap-1 font-mono">
                  <button
                    onClick={() => {
                       if (mapRef.current && clickedAgid) {
                         mapRef.current.flyTo({
                           center: [(clickedAgid.bounds.minLon + clickedAgid.bounds.maxLon) / 2, (clickedAgid.bounds.minLat + clickedAgid.bounds.maxLat) / 2],
                           zoom: getDeviceZoom(),
                           pitch: mapPitch,
                           essential: true
                         });
                       }
                    }}
                    className="p-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-all"
                    title="Zoom to location"
                  >
                    <Maximize2 className="w-2.5 h-2.5" />
                  </button>
                  <button
                    onClick={() => {
                       const lat = (clickedAgid.bounds.minLat + clickedAgid.bounds.maxLat) / 2;
                       const lng = (clickedAgid.bounds.minLon + clickedAgid.bounds.maxLon) / 2;
                       const name = clickedAddress || clickedAgid.id;
                       setDestination({ lat, lng, name });
                       setDestinationQuery(name);
                       setIsRoutePlanning(true);
                       setIsNavigating(true);
                       if (userLocation) {
                         setOrigin({ ...userLocation, name: "My Location" });
                         setOriginQuery("My Location");
                       }
                    }}
                    className="p-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-blue-500/30 active:scale-95"
                    title="Get Directions"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-tight">{t('get_directions')}</span>
                  </button>
                </div>
               </div>

               <motion.div
                key="expanded-content"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
               >
                 {/* Territory Info */}
                 {clickedAgid.isSea && clickedAgid.regionName && (
                    <div className="flex items-center gap-2 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full w-fit">
                      <Waves className="w-2.5 h-2.5 text-blue-400" />
                      <span className="text-[9px] font-black text-blue-200">{clickedAgid.regionName}</span>
                    </div>
                 )}

                 {/* Address Area */}
                 <div className="group relative rounded-2xl border border-white/10 bg-slate-800/80 p-3 transition-colors">
                  <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <AddressLanguageTabs
                          tabs={visibleDisplayTabs}
                          activeTab={clickedAddressTab}
                          countryCode={countryCode}
                          qualityByTab={addressTabQualities}
                          onSelect={setClickedAddressTab}
                        />
                      </div>
                      {territoryClaimOptions.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {TERRITORY_CLAIM_DISPLAY_POLICIES.map(policy => {
                              const isActive = territoryClaimDisplayPolicy === policy.id;
                              return (
                                <button
                                  key={policy.id}
                                  onClick={() => setTerritoryClaimDisplayPolicy(policy.id)}
                                  className={cn(
                                    "px-2 py-1 rounded-lg text-[8px] font-black transition-all border",
                                    isActive
                                      ? "bg-white text-slate-900 border-white"
                                      : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
                                  )}
                                  title={policy.description}
                                >
                                  {policy.shortLabel}
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {territoryClaimOptions.map(option => {
                              const isActive = selectedTerritoryClaim?.id === option.id;
                              return (
                                <button
                                  key={option.id}
                                  onClick={() => setSelectedTerritoryClaimId(option.id)}
                                  className={cn(
                                    "px-2 py-1 rounded-lg text-[8px] font-black transition-all flex items-center gap-1.5 border",
                                    isActive
                                      ? "bg-amber-400 text-slate-950 border-amber-300"
                                      : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
                                  )}
                                  title={option.label}
                                >
                                  <Flag className="w-2.5 h-2.5" />
                                  <span>{option.shortLabel}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="text-[11px] font-medium text-slate-200 leading-snug min-h-[2.5em] space-y-2">
                         <div className={cn(
                           "rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-[12px] font-semibold leading-relaxed text-slate-900 shadow-inner",
                           preserveAddressDisplayLines ? "whitespace-pre-line" : "whitespace-normal",
                         )}>
                           {addressDisplayText}
                         </div>
                         <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold leading-snug text-slate-300">
                           <span className={cn('rounded-full border px-2.5 py-1 text-[9px] font-black', qualityTone)}>
                             {qualityCopy.shortLabel}
                           </span>
                           {missingRequiredFields.length > 0 ? (
                             <span className="text-amber-100/90">
                               Missing: {missingRequiredFields.slice(0, 3).join(', ')}
                             </span>
                           ) : (
                             <span className="text-slate-400">{qualityCopy.description}</span>
                           )}
                         </div>
                         {selectedTerritoryClaim && (
                           <div className="rounded-lg border border-amber-400/15 bg-amber-400/10 px-2 py-1.5 text-[9px] font-bold leading-snug text-amber-100">
                             <div className="mb-0.5 flex items-center gap-1.5 text-[8px] font-black uppercase tracking-wider text-amber-300">
                               <Flag className="w-2.5 h-2.5" />
                               <span>{selectedTerritoryClaim.label}</span>
                             </div>
                             <div>{formatTerritoryClaimSummary(selectedTerritoryClaim)}</div>
                           </div>
                         )}
                      </div>

                     <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-white/5">
                        <button onClick={() => saveAgid(clickedAgid)} className="flex items-center justify-center gap-1.5 rounded-lg bg-white/[0.08] px-2 py-2 text-[9px] font-black text-slate-200 hover:bg-white/[0.12]" title="Save AGID"><Bookmark className="w-3 h-3" />Save</button>
                        <button onClick={() => setIsQrVisible(!isQrVisible)} className="flex items-center justify-center gap-1.5 rounded-lg bg-white/[0.08] px-2 py-2 text-[9px] font-black text-slate-200 hover:bg-white/[0.12]" title="QR Code"><QrCode className="w-3 h-3" />QR</button>
                        <button onClick={openAddressFeedbackPanel} className="flex items-center justify-center gap-1.5 rounded-lg bg-white/[0.08] px-2 py-2 text-[9px] font-black text-slate-200 hover:bg-white/[0.12]" title="Address feedback"><MessageSquareWarning className="w-3 h-3" />Report</button>
                     </div>
                  </div>
                 </div>

                 <AnimatePresence>
                  {isQrVisible && (
                     <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="bg-white rounded-[2rem] p-5 flex flex-col items-center gap-3 mt-3"
                     >
                        <div className="p-3 bg-slate-50 rounded-2xl shadow-inner">
                         <QRCodeCanvas value={clickedAgid.id} size={120} level="H" includeMargin={false} id="agid-qr-canvas" />
                        </div>
                        <button onClick={saveQrCode} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5 border border-slate-200">
                         <Download className="w-2.5 h-2.5" /> Save QR
                        </button>
                     </motion.div>
                  )}
                 </AnimatePresence>
               </motion.div>
            </div>
          </>
        )}
      </div>
    </motion.div>
    <AddressFeedbackPanel
      isOpen={isAddressFeedbackOpen}
      onClose={() => setIsAddressFeedbackOpen(false)}
      presentation="map-left"
      closeOnSaved
      agid={clickedAgid.id}
      countryCode={countryCode}
      languageTab={clickedAddressTab}
      addressDisplay={addressDisplayText}
      addressDetails={clickedAddressDetails}
      isSea={clickedAgid.isSea}
      qualityDecision={activeAddressTabQuality?.decision}
      qualityScore={addressFeedbackQualityScore}
      sourceIds={addressFeedbackSourceIds}
      onLearningSaved={(summary) => showAlert(
        "Address feedback saved",
        `Closed local learning updated with ${summary.samples} samples.`,
      )}
      onFieldFeedbackSubmitted={(result) => showAlert(
        result.status === 'sent' ? "Field feedback sent" : "Field feedback queued",
        result.status === 'sent'
          ? "Redacted address-quality feedback was accepted."
          : "Network unavailable or server rejected the request. Redacted feedback remains in the local outbox.",
      )}
      onApplyCorrection={(correctedDisplay) => setClickedAddress(correctedDisplay)}
    />
    </>
  );
};
