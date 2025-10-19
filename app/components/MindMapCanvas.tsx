'use client';

import { useRef, useState, useEffect } from 'react';
import { MindMapNode } from '@/types';

interface MindMapCanvasProps {
  boxes: MindMapNode[];
  setBoxes: (boxes: MindMapNode[]) => void;
  selectedBox: string | null;
  setSelectedBox: (id: string | null) => void;
}

interface MindMapNodeProps {
  box: MindMapNode;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent, box: MindMapNode) => void;
  onTouchStart: (e: React.TouchEvent, box: MindMapNode) => void;
  onTextChange: (text: string) => void;
  isMobile: boolean;
}

function MindMapNodeComponent({
  box,
  isSelected,
  onMouseDown,
  onTouchStart,
  onTextChange,
  isMobile,
}: MindMapNodeProps) {
  return (
    <div
      className={`absolute cursor-move ${box.style.bg} ${box.style.text} rounded-xl shadow-xl transition-all duration-200 ${
        isSelected ? 'ring-4 ring-yellow-400 scale-105 z-10' : 'hover:scale-102 hover:shadow-2xl'
      }`}
      style={{ 
        left: box.x, 
        top: box.y, 
        width: isMobile ? '130px' : '160px', 
        padding: isMobile ? '12px' : '14px',
        touchAction: 'none'
      }}
      onMouseDown={(e) => onMouseDown(e, box)}
      onTouchStart={(e) => onTouchStart(e, box)}
    >
      <input
        type="text"
        value={box.text}
        onChange={(e) => onTextChange(e.target.value)}
        className="w-full bg-transparent border-none outline-none text-sm font-semibold placeholder-white/50"
        placeholder="Enter text..."
        onClick={(e) => e.stopPropagation()}
        style={{ fontSize: isMobile ? '13px' : '14px' }}
      />
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
      )}
    </div>
  );
}

export default function MindMapCanvas({
  boxes,
  setBoxes,
  selectedBox,
  setSelectedBox,
}: MindMapCanvasProps) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };
    
    checkMobile();
    updateCanvasSize();
    
    window.addEventListener('resize', checkMobile);
    window.addEventListener('resize', updateCanvasSize);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

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

  const handleTouchStart = (e: React.TouchEvent, box: MindMapNode) => {
    e.stopPropagation();
    const touch = e.touches[0];
    setSelectedBox(box.id);
    setDragging(box.id);
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setDragOffset({
      x: touch.clientX - rect.left - box.x,
      y: touch.clientY - rect.top - box.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const newX = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, rect.width - (isMobile ? 130 : 160)));
      const newY = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, rect.height - 50));
      setBoxes(
        boxes.map(b => (b.id === dragging ? { ...b, x: newX, y: newY } : b))
      );
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragging && canvasRef.current) {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvasRef.current.getBoundingClientRect();
      const newX = Math.max(0, Math.min(touch.clientX - rect.left - dragOffset.x, rect.width - (isMobile ? 130 : 160)));
      const newY = Math.max(0, Math.min(touch.clientY - rect.top - dragOffset.y, rect.height - 50));
      setBoxes(
        boxes.map(b => (b.id === dragging ? { ...b, x: newX, y: newY } : b))
      );
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const handleTouchEnd = () => {
    setDragging(null);
  };

  const drawConnections = () => {
    return boxes.map(box => {
      if (!box.parentId) return null;
      const parent = boxes.find(b => b.id === box.parentId);
      if (!parent) return null;

      const nodeWidth = isMobile ? 130 : 160;
      const nodeHeight = 40;

      return (
        <g key={`line-${box.id}`}>
          <line
            x1={parent.x + nodeWidth / 2}
            y1={parent.y + nodeHeight / 2}
            x2={box.x + nodeWidth / 2}
            y2={box.y + nodeHeight / 2}
            stroke="url(#lineGradient)"
            strokeWidth={isMobile ? "2" : "3"}
            strokeLinecap="round"
            opacity="0.6"
          />
          <circle
            cx={box.x + nodeWidth / 2}
            cy={box.y + nodeHeight / 2}
            r="4"
            fill="#94a3b8"
            opacity="0.8"
          />
        </g>
      );
    });
  };

  return (
    <div className={`${isMobile ? 'p-3' : 'p-6'} max-w-7xl mx-auto`}>
      <div
        ref={canvasRef}
        className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border-2 border-slate-700/50 overflow-hidden backdrop-blur-sm shadow-2xl"
        style={{ 
          height: isMobile ? '500px' : '650px',
          touchAction: 'none'
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Grid pattern background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }} />
        </div>

        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#94a3b8', stopOpacity: 0.8 }} />
              <stop offset="100%" style={{ stopColor: '#64748b', stopOpacity: 0.6 }} />
            </linearGradient>
          </defs>
          {drawConnections()}
        </svg>

        {/* Hint text when empty */}
        {boxes.length === 1 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <p className="text-slate-500 text-sm">
              {isMobile ? 'Tap a node to select it' : 'Click a node to select it, then use the toolbar to add more'}
            </p>
          </div>
        )}

        {boxes.map(box => (
          <MindMapNodeComponent
            key={box.id}
            box={box}
            isSelected={selectedBox === box.id}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTextChange={(text) => {
              setBoxes(boxes.map(b => (b.id === box.id ? { ...b, text } : b)));
            }}
            isMobile={isMobile}
          />
        ))}
      </div>

      {/* Mobile instructions */}
      {isMobile && (
        <div className="mt-3 text-center text-xs text-slate-400">
          Drag nodes to reposition • Use toolbar to add/remove
        </div>
      )}
    </div>
  );
}