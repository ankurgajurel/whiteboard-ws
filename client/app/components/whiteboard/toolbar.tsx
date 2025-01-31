'use client';

import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import { ToolbarProps } from "@/app/types/whiteboard";
import { Square, Circle, Minus, Pencil, Trash2 } from "lucide-react";

const COLORS = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];

export function Toolbar({
  selectedTool,
  selectedColor,
  strokeWidth,
  onToolChange,
  onColorChange,
  onStrokeWidthChange,
  onClear,
}: ToolbarProps) {
  return (
    <div className="fixed left-4 top-4 bg-white p-4 rounded-lg shadow-lg space-y-4">
      <div className="space-y-2">
        <Button
          variant={selectedTool === 'rectangle' ? 'default' : 'outline'}
          size="icon"
          onClick={() => onToolChange('rectangle')}
          className="w-10 h-10"
        >
          <Square className="h-6 w-6" />
        </Button>
        <Button
          variant={selectedTool === 'circle' ? 'default' : 'outline'}
          size="icon"
          onClick={() => onToolChange('circle')}
          className="w-10 h-10"
        >
          <Circle className="h-6 w-6" />
        </Button>
        <Button
          variant={selectedTool === 'line' ? 'default' : 'outline'}
          size="icon"
          onClick={() => onToolChange('line')}
          className="w-10 h-10"
        >
          <Minus className="h-6 w-6" />
        </Button>
        <Button
          variant={selectedTool === 'freehand' ? 'default' : 'outline'}
          size="icon"
          onClick={() => onToolChange('freehand')}
          className="w-10 h-10"
        >
          <Pencil className="h-6 w-6" />
        </Button>
      </div>

      <div className="space-y-2">
        {COLORS.map((color) => (
          <button
            key={color}
            className={`w-10 h-10 rounded-full border-2 ${
              selectedColor === color ? 'border-black' : 'border-gray-200'
            }`}
            style={{ backgroundColor: color }}
            onClick={() => onColorChange(color)}
          />
        ))}
      </div>

      <div className="w-full px-2">
        <Slider
          value={[strokeWidth]}
          onValueChange={(value) => onStrokeWidthChange(value[0])}
          min={1}
          max={20}
          step={1}
          className="w-full"
        />
      </div>

      <Button
        variant="destructive"
        size="icon"
        onClick={onClear}
        className="w-10 h-10"
      >
        <Trash2 className="h-6 w-6" />
      </Button>
    </div>
  );
} 