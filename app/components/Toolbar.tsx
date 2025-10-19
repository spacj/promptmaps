'use client';

import { useState } from 'react';
import { Plus, Wand2, Palette, Trash2 } from 'lucide-react';
import { MindMapNode, PromptType } from '@/types';
import StylePicker from './StylePicker';

interface ToolbarProps {
  selectedBox: string | null;
  boxes: MindMapNode[];
  setBoxes: (boxes: MindMapNode[]) => void;
  setSelectedBox: (id: string | null) => void;
  onGenerate: (type: PromptType) => void;
  isPremium: boolean;
  isGenerating: boolean;
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

  const addBox = (type: 'sibling' | 'child') => {
    if (!selectedBox) {
      alert('Please select a box first');
      return;
    }

    const parent = boxes.find(b => b.id === selectedBox);
    if (!parent) return;

    const newBox: MindMapNode = {
      id: Date.now().toString(),
      text: type === 'sibling' ? 'Sibling Node' : 'Child Node',
      x: parent.x + (type === 'sibling' ? 200 : 0),
      y: parent.y + (type === 'sibling' ? 0 : 100),
      level: type === 'sibling' ? parent.level : parent.level + 1,
      parentId: type === 'sibling' ? parent.parentId : parent.id,
      style: { bg: 'bg-blue-500', text: 'text-white' },
    };

    setBoxes([...boxes, newBox]);
  };

  const deleteBox = (id: string) => {
    if (boxes.length === 1) {
      alert('Cannot delete the last box');
      return;
    }
    setBoxes(boxes.filter(b => b.id !== id && b.parentId !== id));
    setSelectedBox(null);
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

  return (
    <>
      <div className="bg-slate-800/30 border-b border-slate-700 px-6 py-3">
        <div className="max-w-7xl mx-auto flex gap-3">
          <button
            onClick={() => addBox('sibling')}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selectedBox}
          >
            <Plus size={18} />
            Add Sibling
          </button>
          <button
            onClick={() => addBox('child')}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selectedBox}
          >
            <Plus size={18} />
            Add Child
          </button>
          <button
            onClick={() => setShowStylePicker(!showStylePicker)}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selectedBox}
          >
            <Palette size={18} />
            Style
          </button>
          <button
            onClick={() => selectedBox && deleteBox(selectedBox)}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selectedBox}
          >
            <Trash2 size={18} />
            Delete
          </button>
          <div className="flex-1" />
          <button
            onClick={() => setShowPromptTypeModal(true)}
            disabled={isGenerating}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-6 py-2 rounded-lg flex items-center gap-2 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Wand2 size={18} className={isGenerating ? 'animate-spin' : ''} />
            {isGenerating ? 'Generating...' : 'Generate AI Prompt'}
            {!isPremium && !isGenerating && (
              <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded">-1 credit</span>
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-4xl w-full border border-slate-700 max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Choose Prompt Type</h2>
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
                  className="bg-slate-700 hover:bg-slate-600 p-6 rounded-xl text-left transition-all hover:scale-105 border-2 border-transparent hover:border-purple-500"
                >
                  <div className="text-4xl mb-3">{type.icon}</div>
                  <h3 className="text-lg font-semibold mb-2">{type.label}</h3>
                  <p className="text-sm text-slate-400">{type.description}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowPromptTypeModal(false)}
              className="mt-6 w-full bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}