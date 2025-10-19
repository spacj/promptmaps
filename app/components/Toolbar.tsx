'use client';

import { useState, useEffect } from 'react';
import { Plus, Wand2, Palette, Trash2, Menu, X } from 'lucide-react';
import { MindMapNode, PromptType } from '@/types';

interface ToolbarProps {
  selectedBox: string | null;
  boxes: MindMapNode[];
  setBoxes: (boxes: MindMapNode[]) => void;
  setSelectedBox: (id: string | null) => void;
  onGenerate: (type: PromptType) => void;
  isPremium: boolean;
  isGenerating: boolean;
}

// Separate StylePicker component
function StylePicker({ selectedBox, boxes, setBoxes, onClose }: any) {
  const styles = [
    { bg: 'bg-blue-500', text: 'text-white', label: 'Blue' },
    { bg: 'bg-green-500', text: 'text-white', label: 'Green' },
    { bg: 'bg-purple-500', text: 'text-white', label: 'Purple' },
    { bg: 'bg-pink-500', text: 'text-white', label: 'Pink' },
    { bg: 'bg-yellow-500', text: 'text-gray-900', label: 'Yellow' },
    { bg: 'bg-red-500', text: 'text-white', label: 'Red' },
    { bg: 'bg-indigo-500', text: 'text-white', label: 'Indigo' },
    { bg: 'bg-orange-500', text: 'text-white', label: 'Orange' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Choose Style</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {styles.map((style) => (
            <button
              key={style.label}
              onClick={() => {
                setBoxes(
                  boxes.map((b: MindMapNode) =>
                    b.id === selectedBox ? { ...b, style } : b
                  )
                );
                onClose();
              }}
              className={`${style.bg} ${style.text} p-4 rounded-xl font-semibold transition-all hover:scale-105 hover:shadow-lg`}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Toolbar({
  selectedBox,
  boxes,
  setBoxes,
  setSelectedBox,
  onGenerate,
  isPremium,
  isGenerating,
}: ToolbarProps) {
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [showPromptTypeModal, setShowPromptTypeModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const addBox = (type: 'sibling' | 'child') => {
    if (!selectedBox) {
      alert('Please select a box first');
      return;
    }

    const parent = boxes.find(b => b.id === selectedBox);
    if (!parent) return;

    const newBox: MindMapNode = {
      id: Date.now().toString(),
      text: type === 'sibling' ? 'Sibling' : 'Child',
      x: parent.x + (type === 'sibling' ? (isMobile ? 150 : 200) : 0),
      y: parent.y + (type === 'sibling' ? 0 : (isMobile ? 80 : 100)),
      level: type === 'sibling' ? parent.level : parent.level + 1,
      parentId: type === 'sibling' ? parent.parentId : parent.id,
      style: { bg: 'bg-blue-500', text: 'text-white' },
    };

    setBoxes([...boxes, newBox]);
    setShowMobileMenu(false);
  };

  const deleteBox = (id: string) => {
    if (boxes.length === 1) {
      alert('Cannot delete the last box');
      return;
    }
    setBoxes(boxes.filter(b => b.id !== id && b.parentId !== id));
    setSelectedBox(null);
    setShowMobileMenu(false);
  };

  const promptTypes: { type: PromptType; label: string; description: string; icon: string }[] = [
    {
      type: 'code',
      label: 'Code Generation',
      description: 'Optimize for programming and development tasks',
      icon: '💻',
    },
    {
      type: 'research',
      label: 'Research & Analysis',
      description: 'Perfect for academic research and data analysis',
      icon: '🔬',
    },
    {
      type: 'creative',
      label: 'Creative Content',
      description: 'For writing, storytelling, and creative projects',
      icon: '🎨',
    },
    {
      type: 'business',
      label: 'Business',
      description: 'Business plans, strategies, and presentations',
      icon: '💼',
    },
    {
      type: 'education',
      label: 'Education',
      description: 'Learning materials, courses, and tutorials',
      icon: '📚',
    },
    {
      type: 'general',
      label: 'General Purpose',
      description: 'Balanced optimization for any task',
      icon: '⭐',
    },
  ];

  // Desktop toolbar
  if (!isMobile) {
    return (
      <>
        <div className="bg-slate-800/40 backdrop-blur-lg border-b border-slate-700/50 px-6 py-3 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto flex gap-3 items-center">
            <button
              onClick={() => addBox('sibling')}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              disabled={!selectedBox}
            >
              <Plus size={18} />
              <span className="font-medium">Sibling</span>
            </button>
            <button
              onClick={() => addBox('child')}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              disabled={!selectedBox}
            >
              <Plus size={18} />
              <span className="font-medium">Child</span>
            </button>
            <button
              onClick={() => setShowStylePicker(!showStylePicker)}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              disabled={!selectedBox}
            >
              <Palette size={18} />
              <span className="font-medium">Style</span>
            </button>
            <button
              onClick={() => selectedBox && deleteBox(selectedBox)}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              disabled={!selectedBox}
            >
              <Trash2 size={18} />
              <span className="font-medium">Delete</span>
            </button>
            <div className="flex-1" />
            <button
              onClick={() => setShowPromptTypeModal(true)}
              disabled={isGenerating}
              className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 px-6 py-2.5 rounded-xl flex items-center gap-2 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
            >
              <Wand2 size={18} className={isGenerating ? 'animate-spin' : ''} />
              {isGenerating ? 'Generating...' : 'Generate AI Prompt'}
              {!isPremium && !isGenerating && (
                <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded-lg">-1 credit</span>
              )}
            </button>
          </div>
        </div>

        {showStylePicker && selectedBox && (
          <StylePicker
            selectedBox={selectedBox}
            boxes={boxes}
            setBoxes={setBoxes}
            onClose={() => setShowStylePicker(false)}
          />
        )}

        {showPromptTypeModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl p-8 max-w-4xl w-full border border-slate-700 max-h-[80vh] overflow-y-auto shadow-2xl">
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Choose Prompt Type</h2>
              <p className="text-slate-300 mb-6">
                Select the type of prompt to optimize for your specific use case
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {promptTypes.map((type) => (
                  <button
                    key={type.type}
                    onClick={() => {
                      setShowPromptTypeModal(false);
                      onGenerate(type.type);
                    }}
                    className="bg-slate-700/50 hover:bg-slate-600 p-6 rounded-xl text-left transition-all hover:scale-105 border-2 border-slate-600 hover:border-purple-500 shadow-lg hover:shadow-purple-500/20"
                  >
                    <div className="text-4xl mb-3">{type.icon}</div>
                    <h3 className="text-lg font-semibold mb-2">{type.label}</h3>
                    <p className="text-sm text-slate-400">{type.description}</p>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowPromptTypeModal(false)}
                className="mt-6 w-full bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Mobile toolbar
  return (
    <>
      <div className="bg-slate-800/40 backdrop-blur-lg border-b border-slate-700/50 px-3 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="bg-slate-700 hover:bg-slate-600 p-2.5 rounded-xl transition-colors"
          >
            {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          {selectedBox && (
            <span className="text-xs text-slate-400 flex-1 ml-2">
              Node selected
            </span>
          )}
          
          <button
            onClick={() => setShowPromptTypeModal(true)}
            disabled={isGenerating}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-4 py-2.5 rounded-xl flex items-center gap-2 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-sm"
          >
            <Wand2 size={16} className={isGenerating ? 'animate-spin' : ''} />
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
        </div>

        {/* Mobile menu */}
        {showMobileMenu && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => addBox('sibling')}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              disabled={!selectedBox}
            >
              <Plus size={16} />
              Sibling
            </button>
            <button
              onClick={() => addBox('child')}
              className="bg-green-600 hover:bg-green-700 px-3 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              disabled={!selectedBox}
            >
              <Plus size={16} />
              Child
            </button>
            <button
              onClick={() => {
                setShowStylePicker(true);
                setShowMobileMenu(false);
              }}
              className="bg-purple-600 hover:bg-purple-700 px-3 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              disabled={!selectedBox}
            >
              <Palette size={16} />
              Style
            </button>
            <button
              onClick={() => selectedBox && deleteBox(selectedBox)}
              className="bg-red-600 hover:bg-red-700 px-3 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              disabled={!selectedBox}
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        )}
      </div>

      {showStylePicker && selectedBox && (
        <StylePicker
          selectedBox={selectedBox}
          boxes={boxes}
          setBoxes={setBoxes}
          onClose={() => setShowStylePicker(false)}
        />
      )}

      {showPromptTypeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-lg w-full border border-slate-700 max-h-[85vh] overflow-y-auto shadow-2xl">
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Choose Prompt Type</h2>
            <p className="text-slate-300 mb-4 text-sm">
              Select the type of prompt to optimize for your use case
            </p>
            <div className="grid grid-cols-1 gap-3">
              {promptTypes.map((type) => (
                <button
                  key={type.type}
                  onClick={() => {
                    setShowPromptTypeModal(false);
                    onGenerate(type.type);
                  }}
                  className="bg-slate-700/50 hover:bg-slate-600 p-5 rounded-xl text-left transition-all active:scale-95 border-2 border-slate-600 hover:border-purple-500"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{type.icon}</div>
                    <div>
                      <h3 className="text-base font-semibold mb-1">{type.label}</h3>
                      <p className="text-xs text-slate-400">{type.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowPromptTypeModal(false)}
              className="mt-4 w-full bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-xl transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}