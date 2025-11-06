'use client';

import { useRef, useState, useEffect, useCallback, memo } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

// Types
interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  level: number;
  parentId: string | null;
  style: { bg: string; text: string };
}

interface MindMapCanvasProps {
  boxes: MindMapNode[];
  setBoxes: (boxes: MindMapNode[] | ((prev: MindMapNode[]) => MindMapNode[])) => void;
  selectedBox: string | null;
  setSelectedBox: (id: string | null) => void;
}

interface MindMapNodeProps {
  box: MindMapNode;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent, box: MindMapNode) => void;
  onTouchStart: (e: React.TouchEvent, box: MindMapNode) => void;
  onTextChange: (id: string, text: string) => void;
  isMobile: boolean;
}

// Ultra-optimized Node Component with aggressive memoization
const MindMapNodeComponent = memo(({
  box,
  isSelected,
  onMouseDown,
  onTouchStart,
  onTextChange,
  isMobile,
}: MindMapNodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastTapRef = useRef<number>(0);
  const hasAutoFocusedRef = useRef(false);

  // Auto-focus new nodes only once - with cleanup flag
  useEffect(() => {
    if (isSelected && !isEditing && !isMobile && !hasAutoFocusedRef.current &&
        (box.text === 'Sibling' || box.text === 'Child' || box.text === 'Root Idea')) {
      hasAutoFocusedRef.current = true;
      setIsEditing(true);
      // Use double RAF for more reliable focus
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          inputRef.current?.focus();
          inputRef.current?.select();
        });
      });
    }
    
    // Reset flag when box changes
    if (!isSelected) {
      hasAutoFocusedRef.current = false;
    }
  }, [isSelected, box.text, box.id, isEditing, isMobile]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isSelected && !isEditing && !isMobile) {
      setIsEditing(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          inputRef.current?.focus();
          inputRef.current?.select();
        });
      });
    }
  }, [isSelected, isEditing, isMobile]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    
    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      e.stopPropagation();
      e.preventDefault();
      // Double tap detected
      if (isSelected && !isEditing) {
        setIsEditing(true);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
          });
        });
      }
    }
    lastTapRef.current = now;
  }, [isSelected, isEditing]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onTextChange(box.id, e.target.value);
  }, [box.id, onTextChange]);

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  }, []);

  // Prevent drag start when editing
  const handleMouseDownNode = useCallback((e: React.MouseEvent) => {
    if (isEditing) {
      e.stopPropagation();
      return;
    }
    onMouseDown(e, box);
  }, [isEditing, onMouseDown, box]);

  const handleTouchStartNode = useCallback((e: React.TouchEvent) => {
    if (isEditing) {
      e.stopPropagation();
      return;
    }
    onTouchStart(e, box);
  }, [isEditing, onTouchStart, box]);

  return (
    <div
      className={`absolute cursor-move ${box.style.bg} ${box.style.text} rounded-xl shadow-xl transition-all duration-200 ${
        isSelected ? 'ring-4 ring-yellow-400 z-10' : 'hover:shadow-2xl'
      }`}
      style={{ 
        left: `${box.x}px`, 
        top: `${box.y}px`, 
        width: isMobile ? '130px' : '160px', 
        padding: isMobile ? '12px' : '14px',
        touchAction: 'none',
        willChange: 'transform',
        transform: 'translate3d(0,0,0)', // Force GPU acceleration
      }}
      onMouseDown={handleMouseDownNode}
      onTouchStart={handleTouchStartNode}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="text"
        value={box.text}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onMouseDown={(e) => isEditing && e.stopPropagation()}
        onTouchStart={(e) => isEditing && e.stopPropagation()}
        className="w-full bg-transparent border-none outline-none text-sm font-semibold placeholder-white/50"
        placeholder="Enter text..."
        readOnly={!isEditing}
        style={{ 
          fontSize: isMobile ? '13px' : '14px',
          cursor: isEditing ? 'text' : 'inherit',
          pointerEvents: isEditing ? 'auto' : 'none',
          userSelect: isEditing ? 'text' : 'none',
        }}
      />
      {isSelected && !isEditing && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Ultra-aggressive comparison - only re-render when truly necessary
  return (
    prevProps.box.id === nextProps.box.id &&
    prevProps.box.text === nextProps.box.text &&
    prevProps.box.x === nextProps.box.x &&
    prevProps.box.y === nextProps.box.y &&
    prevProps.box.style.bg === nextProps.box.style.bg &&
    prevProps.box.style.text === nextProps.box.style.text &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isMobile === nextProps.isMobile
  );
});

MindMapNodeComponent.displayName = 'MindMapNodeComponent';

// Memoized SVG connections component
const SVGConnections = memo(({ boxes, isMobile }: { boxes: MindMapNode[], isMobile: boolean }) => {
  const nodeWidth = isMobile ? 130 : 160;
  const nodeHeight = 40;

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#94a3b8', stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: '#64748b', stopOpacity: 0.6 }} />
        </linearGradient>
      </defs>
      {boxes.map(box => {
        if (!box.parentId) return null;
        const parent = boxes.find(b => b.id === box.parentId);
        if (!parent) return null;

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
      })}
    </svg>
  );
}, (prevProps, nextProps) => {
  // Only re-render if positions or parent relationships changed
  if (prevProps.boxes.length !== nextProps.boxes.length) return false;
  if (prevProps.isMobile !== nextProps.isMobile) return false;
  
  for (let i = 0; i < prevProps.boxes.length; i++) {
    const prev = prevProps.boxes[i];
    const next = nextProps.boxes[i];
    if (prev.x !== next.x || prev.y !== next.y || prev.parentId !== next.parentId) {
      return false;
    }
  }
  return true;
});

SVGConnections.displayName = 'SVGConnections';

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
  const animationFrameRef = useRef<number | null>(null);
  const isDraggingNodeRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const draggedBoxRef = useRef<string | null>(null);

  const CANVAS_WIDTH = 3000;
  const CANVAS_HEIGHT = 2000;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    const debouncedResize = debounce(checkMobile, 150);
    window.addEventListener('resize', debouncedResize);
    
    return () => {
      window.removeEventListener('resize', debouncedResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Debounce helper
  const debounce = <T extends (...args: any[]) => any>(func: T, wait: number) => {
    let timeout: NodeJS.Timeout | undefined;
    return (...args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const getTouchDistance = useCallback((touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const getTouchCenter = useCallback((touches: React.TouchList) => {
    if (touches.length === 0) return { x: 0, y: 0 };
    if (touches.length === 1) return { x: touches[0].clientX, y: touches[0].clientY };
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  }, []);

  // Batch update helper for better performance
  const updateBoxPositionBatched = useCallback((boxId: string, x: number, y: number) => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      setBoxes((prevBoxes: MindMapNode[]) => prevBoxes.map((b: MindMapNode) => (b.id === boxId ? { ...b, x, y } : b)));
    });
  }, [setBoxes]);

  const handleMouseDown = useCallback((e: React.MouseEvent, box: MindMapNode) => {
    if (e.button !== 0) return; // Only left click
    e.stopPropagation();
    e.preventDefault();
    
    setSelectedBox(box.id);
    setDragging(box.id);
    isDraggingNodeRef.current = true;
    draggedBoxRef.current = box.id;
    
    const offsetX = (e.clientX - panOffset.x) / scale - box.x;
    const offsetY = (e.clientY - panOffset.y) / scale - box.y;
    setDragOffset({ x: offsetX, y: offsetY });
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  }, [panOffset, scale, setSelectedBox]);

  const handleTouchStart = useCallback((e: React.TouchEvent, box: MindMapNode) => {
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    setSelectedBox(box.id);
    setDragging(box.id);
    isDraggingNodeRef.current = true;
    draggedBoxRef.current = box.id;
    
    const offsetX = (touch.clientX - panOffset.x) / scale - box.x;
    const offsetY = (touch.clientY - panOffset.y) / scale - box.y;
    setDragOffset({ x: offsetX, y: offsetY });
    lastMousePosRef.current = { x: touch.clientX, y: touch.clientY };
  }, [panOffset, scale, setSelectedBox]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0 || isDraggingNodeRef.current) return;
    
    e.preventDefault();
    setIsPanning(true);
    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    setSelectedBox(null);
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  }, [panOffset, setSelectedBox]);

  const handleCanvasTouchStart = useCallback((e: React.TouchEvent) => {
    if (isDraggingNodeRef.current) return;
    
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsPanning(true);
      setPanStart({ x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y });
      lastMousePosRef.current = { x: touch.clientX, y: touch.clientY };
    } else if (e.touches.length === 2) {
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      setLastTouchDistance(distance);
      setIsPanning(false);
      setDragging(null);
      isDraggingNodeRef.current = false;
    }
  }, [panOffset, getTouchDistance]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    // Check if mouse actually moved (avoid unnecessary updates)
    const moved = Math.abs(e.clientX - lastMousePosRef.current.x) > 0 || 
                  Math.abs(e.clientY - lastMousePosRef.current.y) > 0;
    
    if (!moved) return;
    
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    if (dragging && isDraggingNodeRef.current) {
      const newX = (e.clientX - panOffset.x) / scale - dragOffset.x;
      const newY = (e.clientY - panOffset.y) / scale - dragOffset.y;
      updateBoxPositionBatched(dragging, newX, newY);
    } else if (isPanning && !isDraggingNodeRef.current) {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      animationFrameRef.current = requestAnimationFrame(() => {
        setPanOffset({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
      });
    }
  }, [dragging, isPanning, panOffset, scale, dragOffset, panStart, updateBoxPositionBatched]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      
      // Check if touch actually moved
      const moved = Math.abs(touch.clientX - lastMousePosRef.current.x) > 1 || 
                    Math.abs(touch.clientY - lastMousePosRef.current.y) > 1;
      
      if (!moved) return;
      
      lastMousePosRef.current = { x: touch.clientX, y: touch.clientY };

      if (dragging && isDraggingNodeRef.current) {
        e.preventDefault();
        const newX = (touch.clientX - panOffset.x) / scale - dragOffset.x;
        const newY = (touch.clientY - panOffset.y) / scale - dragOffset.y;
        updateBoxPositionBatched(dragging, newX, newY);
      } else if (isPanning && !isDraggingNodeRef.current) {
        e.preventDefault();
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        
        animationFrameRef.current = requestAnimationFrame(() => {
          setPanOffset({
            x: touch.clientX - panStart.x,
            y: touch.clientY - panStart.y,
          });
        });
      }
    } else if (e.touches.length === 2) {
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      
      if (lastTouchDistance > 0 && Math.abs(distance - lastTouchDistance) > 1) {
        const delta = distance / lastTouchDistance;
        const center = getTouchCenter(e.touches);
        
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const x = center.x - rect.left;
          const y = center.y - rect.top;
          
          if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
          }
          
          animationFrameRef.current = requestAnimationFrame(() => {
            const newScale = Math.min(Math.max(scale * delta, 0.3), 3);
            const scaleChange = newScale / scale;
            
            setPanOffset(prev => ({
              x: x - (x - prev.x) * scaleChange,
              y: y - (y - prev.y) * scaleChange,
            }));
            setScale(newScale);
          });
        }
      }
      setLastTouchDistance(distance);
    }
  }, [dragging, isPanning, panOffset, scale, dragOffset, panStart, lastTouchDistance, getTouchDistance, getTouchCenter, updateBoxPositionBatched]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(null);
    setIsPanning(false);
    isDraggingNodeRef.current = false;
    draggedBoxRef.current = null;
    
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      setDragging(null);
      setIsPanning(false);
      isDraggingNodeRef.current = false;
      draggedBoxRef.current = null;
      setLastTouchDistance(0);
      
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    } else if (e.touches.length === 1) {
      setLastTouchDistance(0);
    }
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Smoother zoom with smaller delta
      const delta = e.deltaY > 0 ? 0.95 : 1.05;
      const newScale = Math.min(Math.max(scale * delta, 0.3), 3);
      const scaleChange = newScale / scale;
      
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      animationFrameRef.current = requestAnimationFrame(() => {
        setPanOffset(prev => ({
          x: x - (x - prev.x) * scaleChange,
          y: y - (y - prev.y) * scaleChange,
        }));
        setScale(newScale);
      });
    }
  }, [scale]);

  const zoomIn = useCallback(() => {
    const newScale = Math.min(scale * 1.2, 3);
    const scaleChange = newScale / scale;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      setPanOffset(prev => ({
        x: centerX - (centerX - prev.x) * scaleChange,
        y: centerY - (centerY - prev.y) * scaleChange,
      }));
    }
    setScale(newScale);
  }, [scale]);

  const zoomOut = useCallback(() => {
    const newScale = Math.max(scale * 0.8, 0.3);
    const scaleChange = newScale / scale;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      setPanOffset(prev => ({
        x: centerX - (centerX - prev.x) * scaleChange,
        y: centerY - (centerY - prev.y) * scaleChange,
      }));
    }
    setScale(newScale);
  }, [scale]);

  const resetView = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setScale(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const handleTextChange = useCallback((id: string, text: string) => {
    setBoxes((prevBoxes: MindMapNode[]) => prevBoxes.map((b: MindMapNode) => (b.id === id ? { ...b, text } : b)));
  }, [setBoxes]);

  return (
    <div className={`${isMobile ? 'p-3' : 'p-6'} max-w-7xl mx-auto`}>
      <div
        ref={containerRef}
        className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border-2 border-slate-700/50 overflow-hidden backdrop-blur-sm shadow-2xl"
        style={{ 
          height: isMobile ? '500px' : '650px',
          touchAction: 'none',
          cursor: isPanning ? 'grabbing' : dragging ? 'grabbing' : 'grab',
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
        {!isMobile && (
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
            <button
              onClick={zoomIn}
              className="bg-slate-800/90 hover:bg-slate-700 p-2 rounded-lg border border-slate-600 transition-colors backdrop-blur-sm"
              title="Zoom in"
              type="button"
            >
              <ZoomIn size={20} />
            </button>
            <button
              onClick={zoomOut}
              className="bg-slate-800/90 hover:bg-slate-700 p-2 rounded-lg border border-slate-600 transition-colors backdrop-blur-sm"
              title="Zoom out"
              type="button"
            >
              <ZoomOut size={20} />
            </button>
            <button
              onClick={resetView}
              className="bg-slate-800/90 hover:bg-slate-700 p-2 rounded-lg border border-slate-600 transition-colors backdrop-blur-sm"
              title="Reset view"
              type="button"
            >
              <Maximize2 size={20} />
            </button>
            <div className="bg-slate-800/90 px-2 py-1 rounded-lg border border-slate-600 text-xs text-center backdrop-blur-sm">
              {Math.round(scale * 100)}%
            </div>
          </div>
        )}

        <div 
          className="absolute opacity-10 pointer-events-none"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            willChange: 'transform',
            backfaceVisibility: 'hidden',
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

        <div
          ref={canvasRef}
          className="absolute"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            willChange: 'transform',
            backfaceVisibility: 'hidden',
          }}
        >
          <SVGConnections boxes={boxes} isMobile={isMobile} />

          {boxes.map(box => (
            <MindMapNodeComponent
              key={box.id}
              box={box}
              isSelected={selectedBox === box.id}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onTextChange={handleTextChange}
              isMobile={isMobile}
            />
          ))}
        </div>
      </div>

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