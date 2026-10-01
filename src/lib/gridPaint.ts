type FillPaint = {
  'fill-color': string;
  'fill-opacity': number;
  'fill-outline-color'?: string;
};

type LinePaint = {
  'line-color': string;
  'line-width': number;
  'line-opacity': number;
};

type GridFillPaintOptions = {
  isSatelliteOrDark: boolean;
  opacityMultiplier: number;
};

type GridLinePaintOptions = {
  isSatelliteOrDark: boolean;
  isCloseDistanceGrid: boolean;
};

type GridLineStyleOptions = GridLinePaintOptions & {
  zoom: number;
  opacityMultiplier: number;
};

export const AGID_SELECTION_COLOR = '#0f172a';
export const AGID_SELECTION_FILL_OPACITY = 0;
const AGID_HOVER_COLOR = '#ef4444';

const gridFillColor = (isSatelliteOrDark: boolean) => (isSatelliteOrDark ? '#94a3b8' : '#475569');
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const interpolate = (value: number, minValue: number, maxValue: number, minOutput: number, maxOutput: number) => {
  if (value <= minValue) return minOutput;
  if (value >= maxValue) return maxOutput;
  const progress = (value - minValue) / (maxValue - minValue);
  return minOutput + (maxOutput - minOutput) * progress;
};

export const getAgidGridCellFillPaint = ({ isSatelliteOrDark }: GridFillPaintOptions): FillPaint => ({
  'fill-color': gridFillColor(isSatelliteOrDark),
  'fill-opacity': 0,
});

export const getAgidGridFocusFillPaint = ({ isSatelliteOrDark }: GridFillPaintOptions): FillPaint => ({
  'fill-color': gridFillColor(isSatelliteOrDark),
  'fill-opacity': 0,
});

export const getAgidSelectionFillPaint = (): FillPaint => ({
  'fill-color': AGID_SELECTION_COLOR,
  'fill-opacity': AGID_SELECTION_FILL_OPACITY,
});

export const getAgidSelectionHaloPaint = (): LinePaint => ({
  'line-color': '#ffffff',
  'line-width': 0,
  'line-opacity': 0,
});

export const getAgidSelectionOutlinePaint = (): LinePaint => ({
  'line-color': AGID_SELECTION_COLOR,
  'line-width': 2.25,
  'line-opacity': 1,
});

export const getAgidHoverCellFillPaint = (): FillPaint => ({
  'fill-color': AGID_HOVER_COLOR,
  'fill-opacity': 0.04,
  'fill-outline-color': 'rgba(239, 68, 68, 0)',
});

export const getAgidHoverCellOutlinePaint = (): LinePaint => ({
  'line-color': AGID_HOVER_COLOR,
  'line-width': 0.85,
  'line-opacity': 0.55,
});

export const getAgidGridLinePaint = ({ isSatelliteOrDark, isCloseDistanceGrid }: GridLinePaintOptions) => ({
  'line-color': isSatelliteOrDark ? '#f1f5f9' : (isCloseDistanceGrid ? '#777777' : '#64748b'),
});

export const getAgidGridLineStyle = ({
  isSatelliteOrDark,
  isCloseDistanceGrid,
  zoom,
  opacityMultiplier,
}: GridLineStyleOptions): LinePaint => {
  const baseOpacity = isSatelliteOrDark ? 0.46 : 0.34;
  const maxOpacity = isSatelliteOrDark ? 0.55 : 0.5;

  return {
    ...getAgidGridLinePaint({ isSatelliteOrDark, isCloseDistanceGrid }),
    'line-width': interpolate(zoom, 17.25, 20, 0.5, 0.85),
    'line-opacity': clamp(baseOpacity * opacityMultiplier, 0, maxOpacity),
  };
};
