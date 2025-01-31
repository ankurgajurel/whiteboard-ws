export interface Point {
  x: number;
  y: number;
}

export type DrawingTool = 'rectangle' | 'circle' | 'line' | 'freehand';

export interface Shape {
  id: string;
  type: DrawingTool;
  points: Point[];
  color: string;
  strokeWidth: number;
}

export interface WhiteboardState {
  shapes: Shape[];
}

export interface WhiteboardMessage {
  type: 'draw' | 'clear' | 'sync';
  payload: Shape | Shape[] | null;
  roomId: string;
}

export interface WhiteboardProps {
  roomId: string;
  isHost?: boolean;
}

export interface ToolbarProps {
  selectedTool: DrawingTool;
  selectedColor: string;
  strokeWidth: number;
  onToolChange: (tool: DrawingTool) => void;
  onColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onClear: () => void;
} 