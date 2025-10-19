'use client';

import { useRef, useState } from 'react';
import { MindMapNode } from '@/types';
import MindMapNodeComponent from './MindMapNode';

interface MindMapCanvasProps {
  boxes: MindMapNode[];
  setBoxes: (boxes: MindMapNode[]) => void;
  selectedBox: string | null;
  setSelectedBox: (id: string | null) => void;
}

export default function MindMapCanvas({
  boxes,
  setBoxes,
  selectedBox,
  setSelectedBox,
}: MindMapCanvasProps) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent, box: MindMapNode) => {
    e.stopPropagation();
    setSelectedBox(box.id);
    setDragging(box.id);
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left - box.x,
      y: e.clientY - rect.top - box.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const newX = e.clientX - rect.left - dragOffset.x;
      const newY = e.clientY - rect.top - dragOffset.y;
      setBoxes(
        boxes.map(b => (b.id === dragging ? { ...b, x: newX, y: newY } : b))
      );
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const drawConnections = () => {
    return boxes.map(box => {
      if (!box.parentId) return null;
      const parent = boxes.find(b => b.id === box.parentId);
      if (!parent) return null;

      return (
        <line
          key={`line-${box.id}`}
          x1={parent.x + 75}
          y1={parent.y + 20}
          x2={box.x + 75}
          y2={box.y + 20}
          stroke="#94a3b8"
          strokeWidth="2"
        />
      );
    });
  };

  return (
    <div className="p-6">
      <div
        ref={canvasRef}
        className="relative bg-slate-800/50 rounded-xl border-2 border-slate-700 overflow-hidden"
        style={{ height: '600px' }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {drawConnections()}
        </svg>

        {boxes.map(box => (
          <MindMapNodeComponent
            key={box.id}
            box={box}
            isSelected={selectedBox === box.id}
            onMouseDown={handleMouseDown}
            onTextChange={(text) => {
              setBoxes(boxes.map(b => (b.id === box.id ? { ...b, text } : b)));
            }}
          />
        ))}
      </div>
    </div>
  );
}