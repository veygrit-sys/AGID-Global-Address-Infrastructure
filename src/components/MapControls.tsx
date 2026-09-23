
import {
Layers,
LocateFixed,
Minus,
Plus
} from 'lucide-react';
import type maplibregl from 'maplibre-gl';
import { AnimatePresence,motion } from 'motion/react';
import React from 'react';
import { cn } from '../lib/utils';

interface MapControlsProps {
  mapBearing: number;
  setMapBearing: (b: number) => void;
  isTracking: boolean;
  isLocating: boolean;
  jumpToMyLocation: () => void;
  setShowStyleMenu: (s: boolean) => void;
  clickedAgid: any;
  isAgidPanelCollapsed: boolean;
  mapRef: React.MutableRefObject<maplibregl.Map | null>;
  t: (key: string) => string;
}

export const MapControls: React.FC<MapControlsProps> = ({
  mapBearing,
  setMapBearing,
  isTracking,
  isLocating,
  jumpToMyLocation,
  setShowStyleMenu,
  clickedAgid,
  isAgidPanelCollapsed,
  mapRef,
  t
}) => {
  return (
    <>
      <div className="absolute right-2 top-20 z-50 pointer-events-none md:right-3 md:top-6">
        <div className="pointer-events-auto">
          <button
            type="button"
            onClick={jumpToMyLocation}
            disabled={isLocating}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-2xl border bg-white shadow-xl transition-all active:scale-95 md:h-10 md:w-10",
              isTracking ? "border-blue-200 text-blue-600" : "border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-600",
              isLocating && "cursor-wait opacity-80"
            )}
            title={t('current_location')}
            aria-label={t('current_location')}
          >
            <LocateFixed className={cn("h-5 w-5 md:h-4.5 md:w-4.5", (isTracking || isLocating) && "animate-pulse")} />
          </button>
        </div>
      </div>

      <div className={cn(
        "absolute z-40 flex flex-col gap-2 md:gap-1.5 pointer-events-none transition-all duration-500 items-end",
        "right-2 md:right-3",
        clickedAgid
          ? (isAgidPanelCollapsed ? "bottom-24 md:bottom-8" : "bottom-72 md:bottom-8")
          : "bottom-8 md:bottom-8"
      )}>
      {/* Upper Group: Compass (Only when tilted) */}
      <div className="flex flex-col gap-2 md:gap-2 items-end">
        <AnimatePresence>
          {mapBearing !== 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="pointer-events-auto"
            >
              <button
                onClick={() => {
                  mapRef.current?.setBearing(0);
                  setMapBearing(0);
                }}
                className="w-10 h-10 md:w-8 md:h-8 rounded-xl bg-white shadow-lg border border-slate-200 flex items-center justify-center relative overflow-hidden"
                title={t('reset_compass')}
              >
                <div
                  className="relative w-6 h-6 md:w-5 md:h-5 transition-transform duration-300 ease-out"
                  style={{ transform: `rotate(${-mapBearing}deg)` }}
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-3 md:h-2.5 bg-red-500 rounded-full" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-3 md:h-2.5 bg-slate-400 rounded-full" />
                  <span className="absolute top-[-1px] left-1/2 -translate-x-1/2 text-[9px] font-black text-red-500 select-none">N</span>
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Controls Group: Layers and Zoom */}
      <div className="flex flex-col gap-2 md:gap-0 mt-auto items-end">
        {/* Layer Button */}
        <div className="pointer-events-auto mb-1.5 md:mb-1.5">
          <button
            onClick={() => setShowStyleMenu(true)}
            className="w-9 h-9 md:w-8 md:h-8 rounded-xl bg-white shadow-lg border border-slate-200 flex items-center justify-center group hover:bg-slate-50 transition-all"
            title={t('layers')}
          >
            <Layers className="w-4.5 h-4.5 md:w-4 md:h-4 text-slate-600" />
          </button>
        </div>

        {/* Zoom Controls (PC only) */}
        <div className="hidden md:flex flex-col bg-white rounded-xl shadow-lg border border-slate-200 pointer-events-auto overflow-hidden">
          <button
            onClick={() => mapRef.current?.zoomIn()}
            className="w-7 h-7 flex items-center justify-center hover:bg-slate-50 transition-colors border-b border-slate-100 text-slate-600"
            title={t('zoom_in')}
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => mapRef.current?.zoomOut()}
            className="w-7 h-7 flex items-center justify-center hover:bg-slate-50 transition-colors text-slate-600"
            title={t('zoom_out')}
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
    </>
  );
};
