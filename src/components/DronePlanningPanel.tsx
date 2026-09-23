import { AlertTriangle,CheckCircle2,Clock,CloudSun,Compass,MountainSnow,RadioTower,Route,ShieldAlert,Wind,X } from 'lucide-react';
import { motion } from 'motion/react';
import React from 'react';

import type { DroneLandingAssessment } from '../lib/droneAssessment';
import type { DroneCorridorReport } from '../lib/droneCorridor';
import type { DroneMissionPlan } from '../lib/droneMissionPlan';
import { formatPublicConfidenceBand } from '../lib/publicDecisionDisplay';
import { cn } from '../lib/utils';
import type { DroneNavigationPoint } from '../services/DroneNavigationService';

type DronePlanningPanelProps = {
  isOpen: boolean;
  isLoading: boolean;
  targetLabel: string;
  target?: { lat: number; lon: number };
  assessment: DroneLandingAssessment | null;
  missionPlan?: DroneMissionPlan | null;
  corridorReport?: DroneCorridorReport | null;
  isCorridorLoading?: boolean;
  navigationPoint?: DroneNavigationPoint | null;
  onClose: () => void;
  onRefresh: () => void;
  onCheckCorridor?: () => void;
  onEnableTerrain: () => void;
  onSavePlan?: () => void;
};

function scoreColor(label?: DroneLandingAssessment['label']) {
  if (label === 'Low risk') return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (label === 'Caution') return 'text-amber-600 bg-amber-50 border-amber-200';
  if (label === 'High caution') return 'text-orange-600 bg-orange-50 border-orange-200';
  return 'text-rose-600 bg-rose-50 border-rose-200';
}

export const DronePlanningPanel: React.FC<DronePlanningPanelProps> = ({
  isOpen,
  isLoading,
  targetLabel,
  target,
  assessment,
  missionPlan,
  corridorReport,
  isCorridorLoading = false,
  navigationPoint,
  onClose,
  onRefresh,
  onCheckCorridor,
  onEnableTerrain,
  onSavePlan,
}) => {
  if (!isOpen) return null;

  return (
    <motion.section
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      className="absolute right-14 top-24 z-40 w-[min(390px,calc(100vw-72px))] pointer-events-auto"
      aria-label="Drone planning panel"
    >
      <div className="rounded-2xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
              <RadioTower className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Drone Mode</p>
              <h2 className="truncate text-sm font-black text-slate-900">{targetLabel}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close drone mode"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 p-4">
          <div className={cn(
            "flex items-center justify-between rounded-xl border px-3 py-3",
            assessment ? scoreColor(assessment.label) : 'border-slate-200 bg-slate-50 text-slate-500',
          )}>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Landing Zone Score</p>
              <p className="text-lg font-black">{assessment ? assessment.label : 'Checking'}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black">{assessment ? assessment.score : '--'}</p>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-70">
                Proof {formatPublicConfidenceBand(assessment?.confidence)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-sky-500">AGL</p>
              <p className="mt-1 text-sm font-black text-sky-900">
                {navigationPoint?.altitudeAglM !== null && navigationPoint?.altitudeAglM !== undefined
                  ? `${navigationPoint.altitudeAglM.toFixed(1)} m`
                  : '--'}
              </p>
            </div>
            <div className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-sky-500">MSL</p>
              <p className="mt-1 text-sm font-black text-sky-900">
                {navigationPoint?.altitudeMslM !== null && navigationPoint?.altitudeMslM !== undefined
                  ? `${navigationPoint.altitudeMslM.toFixed(1)} m`
                  : '--'}
              </p>
            </div>
            <div className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-sky-500">Step</p>
              <p className="mt-1 text-sm font-black text-sky-900">
                {navigationPoint ? `${navigationPoint.stepCm} cm` : '10 cm'}
              </p>
            </div>
          </div>

          {navigationPoint && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-sky-100 bg-white px-3 py-2 text-[10px] font-bold text-sky-800">
              <RadioTower className="h-3.5 w-3.5" />
              <span className="font-black uppercase tracking-widest">3D destination</span>
              <span>Safety {navigationPoint.safety}</span>
              <span>Proof {formatPublicConfidenceBand(navigationPoint.confidence)}</span>
            </div>
          )}

          {missionPlan && (
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Flight Plan</p>
                  <p className={cn(
                    "mt-1 inline-flex rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-widest",
                    missionPlan.status === 'field-check' && 'bg-emerald-50 text-emerald-700',
                    missionPlan.status === 'hold' && 'bg-amber-50 text-amber-700',
                    missionPlan.status === 'avoid' && 'bg-rose-50 text-rose-700',
                  )}>
                    {missionPlan.status === 'field-check' ? 'Field Check' : missionPlan.status}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-slate-900">{Math.round(missionPlan.distanceMeters)} m</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Route</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-slate-50 px-2 py-2">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Compass className="h-3 w-3" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Bearing</span>
                  </div>
                  <p className="mt-1 text-xs font-black text-slate-800">{missionPlan.bearingDegrees}°</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-2 py-2">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="h-3 w-3" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Time</span>
                  </div>
                  <p className="mt-1 text-xs font-black text-slate-800">{missionPlan.estimatedFlightMinutes} min</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-2 py-2">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <MountainSnow className="h-3 w-3" />
                    <span className="text-[8px] font-black uppercase tracking-widest">AGL</span>
                  </div>
                  <p className="mt-1 text-xs font-black text-slate-800">{missionPlan.recommendedAltitudeAglM} m</p>
                </div>
              </div>

              <p className="mt-3 text-[11px] font-bold leading-relaxed text-slate-500">
                {missionPlan.riskSummary}
              </p>

              <div className="mt-3 grid grid-cols-5 gap-1.5">
                {missionPlan.routeSamples.map(sample => (
                  <div
                    key={sample.index}
                    className={cn(
                      "h-1.5 rounded-full",
                      missionPlan.status === 'avoid' ? 'bg-rose-300' : missionPlan.status === 'hold' ? 'bg-amber-300' : 'bg-emerald-300',
                    )}
                    title={`${Math.round(sample.progress * 100)}% ${Math.round(sample.distanceFromStartMeters)}m`}
                  />
                ))}
              </div>
            </div>
          )}

          {missionPlan && onCheckCorridor ? (
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Corridor Check</p>
                  <p className="mt-1 text-xs font-bold leading-relaxed text-slate-500">
                    Route samples use the same open-data landing checks as the target.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onCheckCorridor}
                  disabled={isCorridorLoading}
                  className="shrink-0 rounded-lg bg-slate-900 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-white transition-all active:scale-95 disabled:opacity-50"
                >
                  {isCorridorLoading ? 'Checking' : 'Check'}
                </button>
              </div>

              {corridorReport ? (
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-slate-50 px-2 py-2">
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Status</p>
                      <p className={cn(
                        "mt-1 truncate text-xs font-black",
                        corridorReport.status === 'field-check' && 'text-emerald-700',
                        corridorReport.status === 'hold' && 'text-amber-700',
                        corridorReport.status === 'avoid' && 'text-rose-700',
                      )}>
                        {corridorReport.status === 'field-check' ? 'Field Check' : corridorReport.status}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-2 py-2">
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Min Score</p>
                      <p className="mt-1 text-xs font-black text-slate-800">
                        {corridorReport.minScore !== null ? corridorReport.minScore : '--'}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-2 py-2">
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Worst</p>
                      <p className="mt-1 truncate text-xs font-black text-slate-800">{corridorReport.worstLabel}</p>
                    </div>
                  </div>

                  <p className="text-[11px] font-bold leading-relaxed text-slate-500">{corridorReport.summary}</p>

                  <div className="grid grid-cols-5 gap-1.5">
                    {corridorReport.samples.map(result => (
                      <div
                        key={result.sample.index}
                        className={cn(
                          "h-1.5 rounded-full",
                          !result.assessment && 'bg-slate-300',
                          result.assessment?.label === 'Low risk' && 'bg-emerald-300',
                          result.assessment?.label === 'Caution' && 'bg-amber-300',
                          result.assessment?.label === 'High caution' && 'bg-orange-300',
                          result.assessment?.label === 'Avoid' && 'bg-rose-300',
                        )}
                        title={`${Math.round(result.sample.progress * 100)}% ${result.assessment?.label || 'Unchecked'}`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <span>Proof {formatPublicConfidenceBand(corridorReport.confidence)}</span>
                    {corridorReport.worstSample ? (
                      <span>Sample {corridorReport.worstSample.sample.index + 1}</span>
                    ) : null}
                  </div>

                  {corridorReport.warnings.slice(0, 3).map(warning => (
                    <div key={warning} className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-800">
                      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
              <div className="flex items-center gap-2 text-slate-500">
                <MountainSnow className="h-3.5 w-3.5" />
                <span className="text-[9px] font-black uppercase tracking-widest">Elevation</span>
              </div>
              <p className="mt-1 text-sm font-black text-slate-800">
                {assessment?.elevationMeters !== null && assessment?.elevationMeters !== undefined
                  ? `${Math.round(assessment.elevationMeters)} m`
                  : 'Unknown'}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
              <div className="flex items-center gap-2 text-slate-500">
                <Wind className="h-3.5 w-3.5" />
                <span className="text-[9px] font-black uppercase tracking-widest">Wind</span>
              </div>
              <p className="mt-1 text-sm font-black text-slate-800">
                {assessment?.windSpeedMs !== null && assessment?.windSpeedMs !== undefined
                  ? `${assessment.windSpeedMs.toFixed(1)} m/s`
                  : 'Unknown'}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
              <div className="flex items-center gap-2 text-slate-500">
                <CloudSun className="h-3.5 w-3.5" />
                <span className="text-[9px] font-black uppercase tracking-widest">Water</span>
              </div>
              <p className="mt-1 truncate text-sm font-black text-slate-800">{assessment?.waterRisk || 'Unknown'}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
              <div className="flex items-center gap-2 text-slate-500">
                <Route className="h-3.5 w-3.5" />
                <span className="text-[9px] font-black uppercase tracking-widest">Highest</span>
              </div>
              <p className="mt-1 truncate text-sm font-black text-slate-800">
                {assessment?.highestNearbyPeak
                  ? `${assessment.highestNearbyPeak.name}${assessment.highestNearbyPeak.elevation ? ` ${assessment.highestNearbyPeak.elevation}m` : ''}`
                  : 'None nearby'}
              </p>
            </div>
          </div>

          {target && (
            <div className="rounded-xl border border-slate-100 bg-white px-3 py-2 font-mono text-[11px] font-bold text-slate-500">
              {target.lat.toFixed(6)}, {target.lon.toFixed(6)}
            </div>
          )}

          <div className="space-y-2">
            {(missionPlan?.risks.length ? missionPlan.risks : assessment?.warnings.length ? assessment.warnings : ['This is a planning aid, not flight authorization.']).slice(0, 5).map((warning) => (
              <div key={warning} className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{warning}</span>
              </div>
            ))}
            {assessment?.strengths.slice(0, 2).map((strength) => (
              <div key={strength} className="flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{strength}</span>
              </div>
            ))}
          </div>

          {navigationPoint?.candidates?.length ? (
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Mapped Obstacles</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {navigationPoint.candidates.slice(0, 5).map(candidate => (
                  <span key={candidate.id} className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-slate-600">
                    {candidate.kind} {Math.round(candidate.distanceMeters)}m
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {missionPlan?.checklist?.length ? (
            <div className="rounded-xl border border-slate-100 bg-white px-3 py-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Field Checklist</p>
              <ul className="mt-2 space-y-1.5">
                {missionPlan.checklist.slice(0, 4).map(item => (
                  <li key={item} className="flex gap-2 text-[11px] font-bold leading-snug text-slate-600">
                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="flex-1 rounded-xl bg-slate-900 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-white transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoading ? 'Checking...' : 'Recheck'}
            </button>
            <button
              type="button"
              onClick={onEnableTerrain}
              className="flex-1 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-blue-700 transition-all active:scale-95"
            >
              3D Terrain
            </button>
            {missionPlan && onSavePlan ? (
              <button
                type="button"
                onClick={onSavePlan}
                className="flex-1 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-emerald-700 transition-all active:scale-95"
              >
                Save QR
              </button>
            ) : null}
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[10px] font-bold text-slate-500">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Sources: {(missionPlan?.sources || assessment?.sources || ['Open-Meteo', 'OpenStreetMap/Overpass', 'open elevation']).slice(0, 5).join(', ')}
            </span>
          </div>
        </div>
      </div>
    </motion.section>
  );
};
