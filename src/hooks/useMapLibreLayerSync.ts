import type maplibregl from 'maplibre-gl';
import React from 'react';

export type EnsureSourceAndLayer = (
  id: string,
  type: string,
  data: any,
  paint: any,
  layout?: any,
  filter?: any,
  beforeId?: string,
) => void;

type LayerProps = {
  paint: any;
  layout: any;
};

function sameLayerProps(a: LayerProps | undefined, paint: any, layout: any) {
  return !!a && JSON.stringify(a.paint) === JSON.stringify(paint) && JSON.stringify(a.layout) === JSON.stringify(layout);
}

export function useMapLibreLayerSync(
  map: React.RefObject<maplibregl.Map | null>,
  cacheKey?: string,
): EnsureSourceAndLayer {
  const lastPropsRef = React.useRef<Record<string, LayerProps>>({});

  React.useEffect(() => {
    lastPropsRef.current = {};
  }, [cacheKey]);

  return React.useCallback((id, type, data, paint, layout = {}, filter, beforeId) => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const sourceId = id;
    const layerId = `${id}-layer`;

    try {
      if (!map.current.getSource(sourceId)) {
        map.current.addSource(sourceId, { type: 'geojson', data });
        const layerConfig: any = { id: layerId, type: type as any, source: id, paint, layout };
        if (filter !== undefined) layerConfig.filter = filter;
        map.current.addLayer(layerConfig, (beforeId && map.current.getLayer(beforeId)) ? beforeId : undefined);
        lastPropsRef.current[layerId] = { paint, layout };
        return;
      }

      const source: any = map.current.getSource(sourceId);
      if (source.setData) source.setData(data);

      if (!sameLayerProps(lastPropsRef.current[layerId], paint, layout)) {
        Object.entries(paint).forEach(([key, value]) => {
          map.current?.setPaintProperty(layerId, key, value);
        });
        Object.entries(layout).forEach(([key, value]) => {
          map.current?.setLayoutProperty(layerId, key, value);
        });
        if (filter !== undefined) map.current.setFilter(layerId, filter);
        lastPropsRef.current[layerId] = { paint, layout };
      }

      if (beforeId && map.current.getLayer(beforeId) && map.current.getLayer(layerId)) {
        map.current.moveLayer(layerId, beforeId);
      } else if ((id.includes('selected') || id.includes('selection')) && map.current.getLayer(layerId)) {
        map.current.moveLayer(layerId);
      }
    } catch (e) {
      console.warn(`Layer sync error for ${id}:`, e);
    }
  }, [map]);
}
