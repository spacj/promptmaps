'use client';

import { Download, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { downloadTextFile } from '@/lib/utils';

interface PromptGeneratorProps {
  prompt: string;
}

export default function PromptGenerator({ prompt }: PromptGeneratorProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadTextFile(prompt, 'ai-optimized-prompt.txt');
  };

  return (
    <div className="px-6 pb-6">
      <div className="max-w-4xl mx-auto bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold">Generated AI Prompt</h2>
            <p className="text-sm text-slate-400 mt-1">
              Optimized by Mistral AI for best results
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleDownload}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Download size={18} />
              Download
            </button>
          </div>
        </div>
        <pre className="whitespace-pre-wrap text-sm bg-slate-900 p-4 rounded-lg overflow-auto max-h-96 font-mono leading-relaxed">
          {prompt}
        </pre>
      </div>
    </div>
  );
}
