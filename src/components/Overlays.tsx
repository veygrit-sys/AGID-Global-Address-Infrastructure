
import { Target } from 'lucide-react';

export function CenterActionButton({ show, onClick }: { show: boolean; onClick: () => void }) {
  if (!show) return null;

  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 pointer-events-none transition-opacity duration-200">
      <button
        onClick={onClick}
        className="pointer-events-auto flex items-center justify-center w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl transition-all active:scale-95 group"
      >
        <Target className="w-6 h-6 group-hover:scale-110 transition-transform" />
      </button>
    </div>
  );
}
