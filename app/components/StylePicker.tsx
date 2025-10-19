'use client';

import { MindMapNode } from '@/types';

interface StylePickerProps {
  selectedBox: string;
  boxes: MindMapNode[];
  setBoxes: (boxes: MindMapNode[]) => void;
  onClose: () => void;
}

export default function StylePicker({
  selectedBox,
  boxes,
  setBoxes,
  onClose,
}: StylePickerProps) {
  const bgColors = [
    { name: 'Blue', class: 'bg-blue-500' },
    { name: 'Green', class: 'bg-green-500' },
    { name: 'Purple', class: 'bg-purple-500' },
    { name: 'Red', class: 'bg-red-500' },
    { name: 'Yellow', class: 'bg-yellow-500' },
    { name: 'Pink', class: 'bg-pink-500' },
    { name: 'Indigo', class: 'bg-indigo-500' },
    { name: 'Gray', class: 'bg-gray-500' },
    { name: 'Orange', class: 'bg-orange-500' },
    { name: 'Teal', class: 'bg-teal-500' },
    { name: 'Cyan', class: 'bg-cyan-500' },
    { name: 'Emerald', class: 'bg-emerald-500' },
  ];

  const updateBoxStyle = (style: { bg: string; text: string }) => {
    setBoxes(
      boxes.map(b => (b.id === selectedBox ? { ...b, style } : b))
    );
    onClose();
  };

  return (
    <div className="absolute top-20 right-6 bg-slate-700 p-4 rounded-lg shadow-xl z-50 border border-slate-600">
      <h3 className="text-sm font-semibold mb-3">Choose Color</h3>
      <div className="grid grid-cols-4 gap-2 max-w-xs">
        {bgColors.map(color => (
          <button
            key={color.class}
            onClick={() => updateBoxStyle({ bg: color.class, text: 'text-white' })}
            className={`w-10 h-10 ${color.class} rounded-md hover:scale-110 transition-transform border-2 border-slate-600`}
            title={color.name}
          />
        ))}
      </div>
    </div>
  );
}
