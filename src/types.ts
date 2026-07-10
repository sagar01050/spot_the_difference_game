export type ShapeType = 'circle' | 'square' | 'triangle' | 'diamond' | 'star' | 'hexagon' | 'cross';

export interface Shape {
  id: string;
  x: number;
  y: number;
  size: number;
  type: ShapeType;
  color: string;
  rotation: number;
}

export interface Difference {
  id: string;
  x: number;
  y: number;
  radius: number;
  found: boolean;
}

export interface Level {
  shapes: Shape[];
  modifiedShapes: Shape[];
  differences: Difference[];
  totalDifferences: number;
}

export type GameState = 'menu' | 'playing' | 'won' | 'lost';
export type Difficulty = 'easy' | 'medium' | 'hard';
