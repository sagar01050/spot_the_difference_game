import { useRef, useEffect, useCallback } from 'react';
import { Shape, Difference } from '../types';
import { renderCanvas } from '../utils/patternGenerator';

interface GameCanvasProps {
  shapes: Shape[];
  differences: Difference[];
  foundDifferences: Set<string>;
  onClickCanvas: (x: number, y: number) => void;
  label: string;
  canvasSize: number;
  isRight: boolean;
}

export default function GameCanvas({
  shapes,
  differences,
  foundDifferences,
  onClickCanvas,
  label,
  canvasSize,
  isRight,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderCanvas(canvas, shapes, foundDifferences, differences, isRight, canvasSize);
  }, [shapes, differences, foundDifferences, canvasSize, isRight]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = 500 / rect.width;
      const scaleY = 500 / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      onClickCanvas(x, y);
    },
    [onClickCanvas]
  );

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
        {label}
      </span>
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-xl opacity-20 group-hover:opacity-30 transition-opacity blur-sm" />
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          onClick={handleClick}
          className="relative rounded-lg shadow-lg cursor-crosshair border-2 border-white/80"
          style={{ width: canvasSize, height: canvasSize }}
        />
      </div>
    </div>
  );
}
