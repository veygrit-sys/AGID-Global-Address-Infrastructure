import { RotateCcw, Triangle } from 'lucide-react';
import React from 'react';

import {
  buildTopographicTerrainPreviewModel,
} from '../lib/topographicTerrainPreview';
import type {
  TopographicBounds,
  TopographicMesh,
} from '../lib/topographicExport';
import { cn } from '../lib/utils';

export type TopographicTerrainPreviewProps = {
  bounds: TopographicBounds;
  mesh: TopographicMesh;
  sourceBacked: boolean;
  lod?: {
    level: number;
    stride: number;
    maximumAbsoluteVerticalErrorMeters: number;
    maximumAllowedVerticalErrorMeters: number;
  };
};

type RenderStatus = 'loading' | 'ready' | 'blocked';

export function TopographicTerrainPreview({
  bounds,
  mesh,
  sourceBacked,
  lod,
}: TopographicTerrainPreviewProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const resetCameraRef = React.useRef<(() => void) | null>(null);
  const materialRef =
    React.useRef<import('three').MeshStandardMaterial | null>(null);
  const [renderStatus, setRenderStatus] =
    React.useState<RenderStatus>('loading');
  const [renderError, setRenderError] = React.useState<string | null>(null);
  const [wireframe, setWireframe] = React.useState(false);
  const wireframeRef = React.useRef(wireframe);
  wireframeRef.current = wireframe;
  const modelResult = React.useMemo(() => {
    try {
      return {
        model: buildTopographicTerrainPreviewModel(mesh, bounds),
        error: null,
      };
    } catch (error) {
      return {
        model: null,
        error: error instanceof Error
          ? error.message
          : 'terrain-preview-model-failed',
      };
    }
  }, [bounds, mesh]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const model = modelResult.model;
    if (!canvas || !model) {
      setRenderStatus('blocked');
      setRenderError(modelResult.error ?? 'terrain-preview-canvas-unavailable');
      return undefined;
    }

    let disposed = false;
    let animationFrame = 0;
    let resizeObserver: ResizeObserver | null = null;
    setRenderStatus('loading');
    setRenderError(null);

    void Promise.all([
      import('three'),
      import('three/addons/controls/OrbitControls.js'),
    ]).then(([THREE, { OrbitControls }]) => {
      if (disposed) return;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true,
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#dbe7eb');
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100_000);
      const controls = new OrbitControls(camera, canvas);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.screenSpacePanning = true;

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(model.positions, 3),
      );
      geometry.setAttribute(
        'color',
        new THREE.BufferAttribute(model.colors, 3),
      );
      geometry.setIndex(new THREE.BufferAttribute(model.indices, 1));
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();

      const material = new THREE.MeshStandardMaterial({
        color: '#ffffff',
        metalness: 0,
        roughness: 0.82,
        side: THREE.DoubleSide,
        vertexColors: true,
        wireframe: wireframeRef.current,
      });
      materialRef.current = material;
      const terrain = new THREE.Mesh(geometry, material);
      scene.add(terrain);

      scene.add(new THREE.HemisphereLight('#f8fafc', '#475569', 2.25));
      const sun = new THREE.DirectionalLight('#fff7ed', 2.1);
      sun.position.set(1, 2, 0.8);
      scene.add(sun);

      const radius = Math.max(geometry.boundingSphere?.radius ?? 1, 1);
      const grid = new THREE.GridHelper(
        Math.max(model.horizontalSpanMeters * 1.3, 1),
        12,
        '#64748b',
        '#94a3b8',
      );
      grid.position.y = (geometry.boundingBox?.min.y ?? 0) - radius * 0.015;
      scene.add(grid);
      controls.minDistance = radius * 0.15;
      controls.maxDistance = radius * 10;

      const resetCamera = () => {
        const distance = radius / Math.tan(THREE.MathUtils.degToRad(21));
        camera.near = Math.max(radius / 1_000, 0.01);
        camera.far = Math.max(radius * 50, 1_000);
        camera.position.set(
          distance * 0.82,
          distance * 0.66,
          distance * 0.82,
        );
        camera.updateProjectionMatrix();
        controls.target.set(0, 0, 0);
        controls.update();
      };
      resetCameraRef.current = resetCamera;
      resetCamera();

      const resize = () => {
        const width = Math.max(canvas.clientWidth, 1);
        const height = Math.max(canvas.clientHeight, 1);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvas);
      resize();

      let frameCount = 0;
      const render = () => {
        if (disposed) return;
        controls.update();
        renderer.render(scene, camera);
        frameCount += 1;
        canvas.dataset.renderFrames = String(frameCount);
        if (frameCount === 1) setRenderStatus('ready');
        animationFrame = window.requestAnimationFrame(render);
      };
      render();

      const disposeGridMaterial = () => {
        if (Array.isArray(grid.material)) {
          grid.material.forEach(gridMaterial => gridMaterial.dispose());
        } else {
          grid.material.dispose();
        }
      };
      const previousCleanup = () => {
        window.cancelAnimationFrame(animationFrame);
        resizeObserver?.disconnect();
        controls.dispose();
        geometry.dispose();
        material.dispose();
        grid.geometry.dispose();
        disposeGridMaterial();
        renderer.dispose();
        materialRef.current = null;
        resetCameraRef.current = null;
      };
      canvas.dataset.cleanupRegistered = 'true';
      cleanup = previousCleanup;
    }).catch(error => {
      if (disposed) return;
      setRenderStatus('blocked');
      setRenderError(
        error instanceof Error
          ? error.message
          : 'terrain-preview-webgl-initialization-failed',
      );
    });

    let cleanup = () => {};
    return () => {
      disposed = true;
      cleanup();
    };
  }, [modelResult]);

  React.useEffect(() => {
    const material = materialRef.current;
    if (!material) return;
    material.wireframe = wireframe;
    material.needsUpdate = true;
  }, [wireframe]);

  const model = modelResult.model;
  const label = sourceBacked
    ? 'VERIFIED LOCAL TIN'
    : 'SYNTHETIC TIN FIXTURE';
  const lodLabel = lod ? ` LOD${lod.level}` : '';

  return (
    <div
      data-testid="topographic-terrain-preview"
      data-render-status={renderStatus}
      data-source-mode={sourceBacked ? 'source-backed' : 'synthetic'}
      data-vertex-count={model?.vertexCount ?? 0}
      data-triangle-count={model?.triangleCount ?? 0}
      className="relative h-full min-h-[420px] w-full overflow-hidden bg-[#dbe7eb] lg:min-h-[580px]"
    >
      <canvas
        ref={canvasRef}
        aria-label={`${label}${lodLabel} interactive 3D terrain preview`}
        className="block h-full min-h-[420px] w-full touch-none lg:min-h-[580px]"
      />

      <div className="absolute left-3 top-3 flex items-center gap-2">
        <span className={cn(
          'hidden rounded-md border px-2 py-1 text-[10px] font-black shadow-sm sm:inline-flex',
          sourceBacked
            ? 'border-emerald-200 bg-emerald-50/95 text-emerald-800'
            : 'border-cyan-200 bg-cyan-50/95 text-cyan-900',
        )}>
          {label}{lodLabel} · 3D
        </span>
        <span
          aria-live="polite"
          className={cn(
            'rounded-md border px-2 py-1 text-[10px] font-black shadow-sm',
            renderStatus === 'ready'
              ? 'border-emerald-200 bg-white/95 text-emerald-700'
              : renderStatus === 'blocked'
                ? 'border-amber-200 bg-amber-50/95 text-amber-800'
                : 'border-slate-200 bg-white/95 text-slate-600',
          )}
        >
          {renderStatus.toUpperCase()}
        </span>
      </div>

      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-md border border-slate-300 bg-white/95 p-1 shadow-sm">
        <button
          type="button"
          title="Reset 3D camera"
          aria-label="Reset 3D camera"
          onClick={() => resetCameraRef.current?.()}
          disabled={renderStatus !== 'ready'}
          className="flex h-8 w-8 items-center justify-center rounded text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Toggle terrain wireframe"
          aria-label="Toggle terrain wireframe"
          aria-pressed={wireframe}
          onClick={() => setWireframe(current => !current)}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded transition',
            wireframe
              ? 'bg-slate-900 text-white'
              : 'text-slate-700 hover:bg-slate-100',
          )}
        >
          <Triangle className="h-4 w-4" />
        </button>
      </div>

      {model && (
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md bg-slate-950/88 px-3 py-2 text-[10px] font-bold text-white">
          <span>{model.vertexCount.toLocaleString()} vertices</span>
          <span>{model.triangleCount.toLocaleString()} triangles</span>
          <span>{model.horizontalSpanMeters.toFixed(1)} m span</span>
          <span>{model.verticalExaggeration.toFixed(2)}x display relief</span>
          {lod && (
            <span>
              LOD{lod.level} · stride {lod.stride} · {lod.maximumAbsoluteVerticalErrorMeters.toFixed(3)} m grid residual / {lod.maximumAllowedVerticalErrorMeters.toFixed(3)} m cap
            </span>
          )}
          <span className="text-slate-300">ENU horizontal · relative source height</span>
        </div>
      )}

      {renderStatus === 'blocked' && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100/95 p-6 text-center">
          <div>
            <p className="text-sm font-black text-slate-900">3D preview blocked</p>
            <p className="mt-2 max-w-md break-words text-xs font-semibold text-slate-600">
              {renderError}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default TopographicTerrainPreview;
