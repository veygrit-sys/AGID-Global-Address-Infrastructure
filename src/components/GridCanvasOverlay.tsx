import type maplibregl from 'maplibre-gl';
import React from 'react';

import type { AGIDResult } from '../lib/agid';
import {
  getCloseDistanceGridFade,
  getEffectiveGridOpacityLevel,
  normalizeLongitude,
  shouldShowDisplayGrid,
} from '../lib/gridDisplay';
import { findContainingGridCellPolygon, shouldDisplayGridResponse } from '../lib/gridGeometry';
import { buildRegularMetricGridFeatures } from '../lib/gridWorkerWasm';
import {
  getMapViewportPoints,
  getPaddedGridBounds,
  getVisibleGridBounds,
} from '../lib/gridViewportController';

type GridCanvasOverlayProps = {
  map: React.RefObject<maplibregl.Map | null>;
  isMapLoaded: boolean;
  isGridVisible: boolean;
  gridOpacityLevel: number;
  selectedResult?: AGIDResult | null;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function interpolate(value: number, minValue: number, maxValue: number, minOutput: number, maxOutput: number) {
  if (value <= minValue) return minOutput;
  if (value >= maxValue) return maxOutput;
  const progress = (value - minValue) / (maxValue - minValue);
  return minOutput + (maxOutput - minOutput) * progress;
}

function projectPoint(map: maplibregl.Map, point: number[]) {
  const projected = map.project([normalizeLongitude(point[0]), point[1]]);
  return { x: projected.x, y: projected.y };
}

function drawPolygon(ctx: CanvasRenderingContext2D, map: maplibregl.Map, polygon: number[][]) {
  if (polygon.length < 4) return;
  ctx.beginPath();
  polygon.forEach((point, index) => {
    const projected = projectPoint(map, point);
    if (index === 0) ctx.moveTo(projected.x, projected.y);
    else ctx.lineTo(projected.x, projected.y);
  });
  ctx.closePath();
  ctx.fill();
}

export function GridCanvasOverlay({
  map,
  isMapLoaded,
  isGridVisible,
  gridOpacityLevel,
  selectedResult,
}: GridCanvasOverlayProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    if (!isMapLoaded || !map.current || !canvasRef.current) return;

    const mapInstance = map.current;
    const canvas = canvasRef.current;
    let animationFrame = 0;
    let drawRevision = 0;

    const clearCanvas = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const resizeCanvas = () => {
      const mapCanvas = mapInstance.getCanvas();
      const width = Math.max(1, mapCanvas.clientWidth);
      const height = Math.max(1, mapCanvas.clientHeight);
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const pixelWidth = Math.round(width * dpr);
      const pixelHeight = Math.round(height * dpr);

      if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
      if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { ctx, width, height };
    };

    const draw = (revision: number) => {
      if (revision !== drawRevision) return;
      animationFrame = 0;
      const surface = resizeCanvas();
      if (!surface) return;

      const zoom = mapInstance.getZoom();
      if (!shouldShowDisplayGrid({ zoom, isGridVisible, gridOpacityLevel })) return;

      const viewportPoints = getMapViewportPoints(mapInstance);
      const visibleBounds = getVisibleGridBounds(viewportPoints);
      const renderBounds = getPaddedGridBounds(viewportPoints, mapInstance.getPitch());
      const center = mapInstance.getCenter();
      const features = buildRegularMetricGridFeatures({
        lat: center.lat,
        lon: center.lng,
        zoom,
        columns: 1,
        rows: 1,
        bounds: renderBounds,
        paddingCells: 2,
      });

      if (!shouldDisplayGridResponse(features.gridCells, visibleBounds)) return;

      const effectiveOpacity = getEffectiveGridOpacityLevel({ zoom, isGridVisible, gridOpacityLevel });
      const opacityMultiplier = clamp((effectiveOpacity / 3) * getCloseDistanceGridFade(zoom), 0, 2);
      const lineOpacity = clamp(interpolate(zoom, 17.25, 20, 0.56, 0.92) * opacityMultiplier, 0.42, 0.95);
      const lineWidth = interpolate(zoom, 17.25, 20, 0.8, 1.9);

      const selectedPolygon = selectedResult
        ? findContainingGridCellPolygon(features.gridCells, selectedResult)
        : null;
      if (selectedPolygon) {
        surface.ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
        drawPolygon(surface.ctx, mapInstance, selectedPolygon);
      }

      surface.ctx.beginPath();
      for (const line of features.gridLines) {
        if (line.length < 2) continue;
        const start = projectPoint(mapInstance, line[0]);
        const end = projectPoint(mapInstance, line[1]);
        surface.ctx.moveTo(start.x, start.y);
        surface.ctx.lineTo(end.x, end.y);
      }
      surface.ctx.lineWidth = lineWidth;
      surface.ctx.strokeStyle = `rgba(17, 24, 39, ${lineOpacity})`;
      surface.ctx.stroke();
    };

    const scheduleDraw = () => {
      drawRevision += 1;
      clearCanvas();
      if (animationFrame) cancelAnimationFrame(animationFrame);
      const scheduledRevision = drawRevision;
      animationFrame = requestAnimationFrame(() => draw(scheduledRevision));
    };

    const events = ['move', 'moveend', 'zoom', 'zoomend', 'rotate', 'pitch', 'resize', 'styledata'] as const;
    events.forEach(eventName => mapInstance.on(eventName, scheduleDraw));
    const resizeObserver = new ResizeObserver(scheduleDraw);
    resizeObserver.observe(mapInstance.getCanvas());
    scheduleDraw();

    return () => {
      drawRevision += 1;
      if (animationFrame) cancelAnimationFrame(animationFrame);
      events.forEach(eventName => mapInstance.off(eventName, scheduleDraw));
      resizeObserver.disconnect();
      clearCanvas();
    };
  }, [gridOpacityLevel, isGridVisible, isMapLoaded, map, selectedResult?.id]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 z-[3] pointer-events-none"
      data-testid="agid-grid-canvas-overlay"
    />
  );
}
