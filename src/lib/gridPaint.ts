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

const gridFillColor = (isSatelliteOrDark: boolean) => (isSatelliteOrDark ? '#94a3b8' : '#475569');

export const getAgidGridCellFillPaint = ({ isSatelliteOrDark }: GridFillPaintOptions): FillPaint => ({
  'fill-color': gridFillColor(isSatelliteOrDark),
  'fill-opacity': 0,
});

export const getAgidGridFocusFillPaint = ({ isSatelliteOrDark }: GridFillPaintOptions): FillPaint => ({
  'fill-color': gridFillColor(isSatelliteOrDark),
  'fill-opacity': 0,
});

export const getAgidSelectionFillPaint = (): FillPaint => ({
  'fill-color': '#ef4444',
  'fill-opacity': 0.45,
});

export const getAgidHoverCellFillPaint = (): FillPaint => ({
  'fill-color': '#fdf2f8',
  'fill-opacity': 0.08,
  'fill-outline-color': 'rgba(249, 168, 212, 0)',
});

export const getAgidHoverCellOutlinePaint = (): LinePaint => ({
  'line-color': '#f9a8d4',
  'line-width': 1.25,
  'line-opacity': 0.88,
});

export const getAgidGridLinePaint = ({ isSatelliteOrDark, isCloseDistanceGrid }: GridLinePaintOptions) => ({
  'line-color': isSatelliteOrDark ? '#94a3b8' : (isCloseDistanceGrid ? '#111827' : '#475569'),
});
