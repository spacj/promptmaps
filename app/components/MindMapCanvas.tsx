'use client';

import { useRef, useState, useEffect } from 'react';
import { MindMapNode } from '@/types';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

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
  scale: number;
}

function MindMapNodeComponent({
  box,
  isSelected,
  onMouseDown,
  onTouchStart,
  onTextChange,
  isMobile,
  scale,
}: MindMapNodeProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus new nodes (those with placeholder text)
    if (isSelected && (box.text === 'Sibling' || box.text === 'Child' || box.text === 'Root Idea')) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isSelected, box.text]);

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
        touchAction: 'none',
        transformOrigin: 'top left'
      }}
      onMouseDown={(e) => onMouseDown(e, box)}
      onTouchStart={(e) => onTouchStart(e, box)}
    >
      <input
        ref={inputRef}
        type="text"
        value={box.text}
        onChange={(e) => onTextChange(e.target.value)}
        onFocus={(e) => {
          setIsFocused(true);
          e.target.select();
        }}
        onBlur={() => setIsFocused(false)}
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
  const [scale, setScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState(0);
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Virtual canvas size (larger than viewport)
  const CANVAS_WIDTH = 3000;
  const CANVAS_HEIGHT = 2000;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchCenter = (touches: React.TouchList) => {
    if (touches.length === 0) return { x: 0, y: 0 };
    if (touches.length === 1) return { x: touches[0].clientX, y: touches[0].clientY };
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  };

  const handleMouseDown = (e: React.MouseEvent, box: MindMapNode) => {
    if (e.button === 2) return; // Ignore right click
    e.stopPropagation();
    setSelectedBox(box.id);
    setDragging(box.id);
    setDragOffset({
      x: (e.clientX - panOffset.x) / scale - box.x,
      y: (e.clientY - panOffset.y) / scale - box.y,
    });
  };

  const handleTouchStart = (e: React.TouchEvent, box: MindMapNode) => {
    if (e.touches.length === 1) {
      e.stopPropagation();
      const touch = e.touches[0];
      setSelectedBox(box.id);
      setDragging(box.id);
      setDragOffset({
        x: (touch.clientX - panOffset.x) / scale - box.x,
        y: (touch.clientY - panOffset.y) / scale - box.y,
      });
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !dragging) { // Left click and not dragging a node
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      setSelectedBox(null);
    }
  };

  const handleCanvasTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && !dragging) {
      // Single touch - start panning
      const touch = e.touches[0];
      setIsPanning(true);
      setPanStart({ x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y });
    } else if (e.touches.length === 2) {
      // Two fingers - start pinch zoom
      const distance = getTouchDistance(e.touches);
      setLastTouchDistance(distance);
      setIsPanning(false);
      setDragging(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging && canvasRef.current) {
      const newX = (e.clientX - panOffset.x) / scale - dragOffset.x;
      const newY = (e.clientY - panOffset.y) / scale - dragOffset.y;
      setBoxes(
        boxes.map(b => (b.id === dragging ? { ...b, x: newX, y: newY } : b))
      );
    } else if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      if (dragging && canvasRef.current) {
        e.preventDefault();
        const touch = e.touches[0];
        const newX = (touch.clientX - panOffset.x) / scale - dragOffset.x;
        const newY = (touch.clientY - panOffset.y) / scale - dragOffset.y;
        setBoxes(
          boxes.map(b => (b.id === dragging ? { ...b, x: newX, y: newY } : b))
        );
      } else if (isPanning) {
        e.preventDefault();
        const touch = e.touches[0];
        setPanOffset({
          x: touch.clientX - panStart.x,
          y: touch.clientY - panStart.y,
        });
      }
    } else if (e.touches.length === 2) {
      e.preventDefault();
      // Pinch zoom
      const distance = getTouchDistance(e.touches);
      if (lastTouchDistance > 0) {
        const delta = distance / lastTouchDistance;
        const center = getTouchCenter(e.touches);
        
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const x = center.x - rect.left;
          const y = center.y - rect.top;
          
          const newScale = Math.min(Math.max(scale * delta, 0.3), 3);
          const scaleChange = newScale / scale;
          
          setPanOffset({
            x: x - (x - panOffset.x) * scaleChange,
            y: y - (y - panOffset.y) * scaleChange,
          });
          setScale(newScale);
        }
      }
      setLastTouchDistance(distance);
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
    setIsPanning(false);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      setDragging(null);
      setIsPanning(false);
      setLastTouchDistance(0);
    } else if (e.touches.length === 1) {
      setLastTouchDistance(0);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.min(Math.max(scale * delta, 0.3), 3);
      const scaleChange = newScale / scale;
      
      setPanOffset({
        x: x - (x - panOffset.x) * scaleChange,
        y: y - (y - panOffset.y) * scaleChange,
      });
      setScale(newScale);
    }
  };

  const zoomIn = () => {
    const newScale = Math.min(scale * 1.2, 3);
    const scaleChange = newScale / scale;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      setPanOffset({
        x: centerX - (centerX - panOffset.x) * scaleChange,
        y: centerY - (centerY - panOffset.y) * scaleChange,
      });
    }
    setScale(newScale);
  };

  const zoomOut = () => {
    const newScale = Math.max(scale * 0.8, 0.3);
    const scaleChange = newScale / scale;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      setPanOffset({
        x: centerX - (centerX - panOffset.x) * scaleChange,
        y: centerY - (centerY - panOffset.y) * scaleChange,
      });
    }
    setScale(newScale);
  };

  const resetView = () => {
    setScale(1);
    setPanOffset({ x: 0, y: 0 });
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
        ref={containerRef}
        className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border-2 border-slate-700/50 overflow-hidden backdrop-blur-sm shadow-2xl"
        style={{ 
          height: isMobile ? '500px' : '650px',
          touchAction: 'none',
          cursor: isPanning ? 'grabbing' : dragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleCanvasTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        {/* Zoom controls - Desktop only */}
        {!isMobile && (
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
            <button
              onClick={zoomIn}
              className="bg-slate-800/90 hover:bg-slate-700 p-2 rounded-lg border border-slate-600 transition-colors backdrop-blur-sm"
              title="Zoom in"
            >
              <ZoomIn size={20} />
            </button>
            <button
              onClick={zoomOut}
              className="bg-slate-800/90 hover:bg-slate-700 p-2 rounded-lg border border-slate-600 transition-colors backdrop-blur-sm"
              title="Zoom out"
            >
              <ZoomOut size={20} />
            </button>
            <button
              onClick={resetView}
              className="bg-slate-800/90 hover:bg-slate-700 p-2 rounded-lg border border-slate-600 transition-colors backdrop-blur-sm"
              title="Reset view"
            >
              <Maximize2 size={20} />
            </button>
            <div className="bg-slate-800/90 px-2 py-1 rounded-lg border border-slate-600 text-xs text-center backdrop-blur-sm">
              {Math.round(scale * 100)}%
            </div>
          </div>
        )}

        {/* Grid pattern background */}
        <div 
          className="absolute opacity-10"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
            transformOrigin: '0 0',
          }}
        >
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Canvas content */}
        <div
          ref={canvasRef}
          className="absolute"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
            transformOrigin: '0 0',
          }}
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#94a3b8', stopOpacity: 0.8 }} />
                <stop offset="100%" style={{ stopColor: '#64748b', stopOpacity: 0.6 }} />
              </linearGradient>
            </defs>
            {drawConnections()}
          </svg>

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
              scale={scale}
            />
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-3 text-center text-xs text-slate-400">
        {isMobile ? (
          <>Pinch to zoom • Drag with one finger to pan • Drag nodes to move</>
        ) : (
          <>Scroll to zoom • Click & drag to pan • Drag nodes to move</>
        )}
      </div>
    </div>
  );
}