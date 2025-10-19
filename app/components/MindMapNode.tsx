'use client';

import { MindMapNode } from '@/types';

interface MindMapNodeProps {
  box: MindMapNode;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent, box: MindMapNode) => void;
  onTextChange: (text: string) => void;
}

export default function MindMapNodeComponent({
  box,
  isSelected,
  onMouseDown,
  onTextChange,
}: MindMapNodeProps) {
  return (
    <div
      className={`absolute cursor-move ${box.style.bg} ${box.style.text} rounded-lg shadow-lg transition-all ${
        isSelected ? 'ring-4 ring-yellow-400' : ''
      }`}
      style={{ left: box.x, top: box.y, width: '150px', padding: '10px' }}
      onMouseDown={(e) => onMouseDown(e, box)}
    >
      <input
        type="text"
        value={box.text}
        onChange={(e) => onTextChange(e.target.value)}
        className="w-full bg-transparent border-none outline-none text-sm font-medium"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}