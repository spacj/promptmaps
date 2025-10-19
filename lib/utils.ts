import { MindMapNode } from '@/types';

export function generateMindmapText(boxes: MindMapNode[]): string {
  const buildTree = (parentId: string | null, indent = 0): string => {
    const children = boxes.filter(b => b.parentId === parentId);
    return children
      .map(box => {
        const indentation = '  '.repeat(indent);
        const childText = buildTree(box.id, indent + 1);
        return `${indentation}- ${box.text}\n${childText}`;
      })
      .join('');
  };

  const roots = boxes.filter(b => b.parentId === null);
  return roots
    .map(root => {
      const childText = buildTree(root.id, 1);
      return `${root.text}\n${childText}`;
    })
    .join('\n');
}

export function checkDailyReset(lastResetDate: string): boolean {
  const today = new Date().toDateString();
  return today !== lastResetDate;
}

export function downloadTextFile(content: string, filename: string) {
  const element = document.createElement('a');
  const file = new Blob([content], { type: 'text/plain' });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}