import { Shape, ShapeType, Difference, Level, Difficulty } from '../types';

const COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#14B8A6',
  '#3B82F6', '#6366F1', '#A855F7', '#EC4899', '#F43F5E',
  '#06B6D4', '#84CC16', '#D946EF', '#FB923C', '#34D399',
];

const SHAPE_TYPES: ShapeType[] = ['circle', 'square', 'triangle', 'diamond', 'star', 'hexagon', 'cross'];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pickRandom<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function shuffleArray<T>(arr: T[], rng: () => number): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const DIFFICULTY_CONFIG = {
  easy: { gridSize: 4, numShapes: 12, numDifferences: 3, timeLimit: 90 },
  medium: { gridSize: 5, numShapes: 20, numDifferences: 5, timeLimit: 60 },
  hard: { gridSize: 6, numShapes: 30, numDifferences: 7, timeLimit: 45 },
};

export function getDifficultyConfig(difficulty: Difficulty) {
  return DIFFICULTY_CONFIG[difficulty];
}

export function generateLevel(seed: number, difficulty: Difficulty): Level {
  const rng = seededRandom(seed);
  const config = DIFFICULTY_CONFIG[difficulty];
  const { gridSize, numShapes, numDifferences } = config;

  const cellSize = 500 / gridSize;
  const shapes: Shape[] = [];

  // Generate grid positions
  const positions: { row: number; col: number }[] = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      positions.push({ row: r, col: c });
    }
  }

  const selectedPositions = shuffleArray(positions, rng).slice(0, numShapes);

  selectedPositions.forEach((pos, i) => {
    const x = pos.col * cellSize + cellSize / 2;
    const y = pos.row * cellSize + cellSize / 2;
    const size = cellSize * 0.3 + rng() * cellSize * 0.15;
    const type = pickRandom(SHAPE_TYPES, rng);
    const color = pickRandom(COLORS, rng);
    const rotation = Math.floor(rng() * 360);

    shapes.push({
      id: `shape-${i}`,
      x,
      y,
      size,
      type,
      color,
      rotation,
    });
  });

  // Pick shapes to modify
  const modifiableIndices = shuffleArray(
    Array.from({ length: shapes.length }, (_, i) => i),
    rng
  ).slice(0, numDifferences);

  const modifiedShapes = shapes.map((s) => ({ ...s }));
  const differences: Difference[] = [];

  modifiableIndices.forEach((idx) => {
    const original = shapes[idx];
    const modified = { ...modifiedShapes[idx] };
    const changeType = Math.floor(rng() * 4);

    switch (changeType) {
      case 0: {
        // Change color
        let newColor = pickRandom(COLORS, rng);
        while (newColor === original.color) {
          newColor = pickRandom(COLORS, rng);
        }
        modified.color = newColor;
        break;
      }
      case 1: {
        // Change shape type
        let newType = pickRandom(SHAPE_TYPES, rng);
        while (newType === original.type) {
          newType = pickRandom(SHAPE_TYPES, rng);
        }
        modified.type = newType;
        break;
      }
      case 2: {
        // Change size
        const sizeMult = rng() > 0.5 ? 1.5 : 0.6;
        modified.size = original.size * sizeMult;
        break;
      }
      case 3: {
        // Change rotation
        modified.rotation = (original.rotation + 45 + Math.floor(rng() * 90)) % 360;
        break;
      }
    }

    modifiedShapes[idx] = modified;

    differences.push({
      id: `diff-${idx}`,
      x: original.x,
      y: original.y,
      radius: cellSize * 0.35,
      found: false,
    });
  });

  return {
    shapes,
    modifiedShapes,
    differences,
    totalDifferences: numDifferences,
  };
}

export function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  scale: number = 1
) {
  const { x, y, size, type, color, rotation } = shape;
  const sx = x * scale;
  const sy = y * scale;
  const ss = size * scale;

  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.fillStyle = color;
  ctx.strokeStyle = darkenColor(color);
  ctx.lineWidth = 2 * scale;

  switch (type) {
    case 'circle':
      ctx.beginPath();
      ctx.arc(0, 0, ss / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;

    case 'square':
      ctx.beginPath();
      ctx.rect(-ss / 2, -ss / 2, ss, ss);
      ctx.fill();
      ctx.stroke();
      break;

    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(0, -ss / 2);
      ctx.lineTo(ss / 2, ss / 2);
      ctx.lineTo(-ss / 2, ss / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;

    case 'diamond':
      ctx.beginPath();
      ctx.moveTo(0, -ss / 2);
      ctx.lineTo(ss / 2, 0);
      ctx.lineTo(0, ss / 2);
      ctx.lineTo(-ss / 2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;

    case 'star': {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const px = Math.cos(angle) * ss / 2;
        const py = Math.sin(angle) * ss / 2;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'hexagon': {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const px = Math.cos(angle) * ss / 2;
        const py = Math.sin(angle) * ss / 2;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'cross': {
      const w = ss / 3;
      ctx.beginPath();
      ctx.rect(-w / 2, -ss / 2, w, ss);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.rect(-ss / 2, -w / 2, ss, w);
      ctx.fill();
      ctx.stroke();
      break;
    }
  }

  ctx.restore();
}

function darkenColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const factor = 0.6;
  return `rgb(${Math.floor(r * factor)}, ${Math.floor(g * factor)}, ${Math.floor(b * factor)})`;
}

export function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // Soft parchment background
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#FEF9EF');
  gradient.addColorStop(0.5, '#FDF6E3');
  gradient.addColorStop(1, '#FAF0D7');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Subtle grid
  ctx.strokeStyle = 'rgba(0,0,0,0.04)';
  ctx.lineWidth = 1;
  const gridSpacing = 25;
  for (let x = 0; x < width; x += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

export function renderCanvas(
  canvas: HTMLCanvasElement,
  shapes: Shape[],
  _foundDifferences: Set<string>,
  differences: Difference[],
  _isRight: boolean,
  canvasSize: number
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const scale = canvasSize / 500;
  canvas.width = canvasSize;
  canvas.height = canvasSize;

  drawBackground(ctx, canvasSize, canvasSize);
  shapes.forEach((shape) => drawShape(ctx, shape, scale));

  // Draw found markers
  differences.forEach((diff) => {
    if (diff.found) {
      ctx.save();
      ctx.strokeStyle = '#22C55E';
      ctx.lineWidth = 3 * scale;
      ctx.setLineDash([6 * scale, 4 * scale]);
      ctx.beginPath();
      ctx.arc(diff.x * scale, diff.y * scale, diff.radius * scale, 0, Math.PI * 2);
      ctx.stroke();

      // Green glow
      ctx.fillStyle = 'rgba(34, 197, 94, 0.12)';
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(diff.x * scale, diff.y * scale, diff.radius * scale, 0, Math.PI * 2);
      ctx.fill();

      // Checkmark
      ctx.strokeStyle = '#16A34A';
      ctx.lineWidth = 3 * scale;
      ctx.setLineDash([]);
      ctx.beginPath();
      const cx = diff.x * scale;
      const cy = diff.y * scale;
      ctx.moveTo(cx - 8 * scale, cy);
      ctx.lineTo(cx - 2 * scale, cy + 6 * scale);
      ctx.lineTo(cx + 8 * scale, cy - 6 * scale);
      ctx.stroke();

      ctx.restore();
    }
  });
}
