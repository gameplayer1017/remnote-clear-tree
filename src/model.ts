export interface TreeNode { id: string; title: string; children: TreeNode[] }
export interface Box { node: TreeNode; x: number; y: number; width: number; height: number; lines: string[]; depth: number }
export const NODE_WIDTH = 260, LEVEL_GAP = 64, SIBLING_GAP = 24;
export function wrapText(text: string, capacity = 14): string[] {
  const result: string[] = [];
  for (const paragraph of (text || '(빈 항목)').split('\n')) {
    let line = '', used = 0;
    for (const char of paragraph) {
      const width = /[\u0000-\u007f]/.test(char) ? 0.68 : 1;
      if (used + width > capacity && line) { result.push(line); line = ''; used = 0; }
      line += char; used += width;
    }
    result.push(line || ' ');
  }
  return result;
}
export function layoutTree(root: TreeNode, collapsed: Set<string>) {
  const boxes: Box[] = [], links: { from: Box; to: Box }[] = [];
  const sizes = new Map<string, { own: number; total: number; lines: string[] }>();
  function measure(n: TreeNode): number {
    const lines = wrapText(n.title), own = Math.max(58, lines.length * 22 + 32);
    const children = collapsed.has(n.id) ? [] : n.children;
    const total = Math.max(own, children.reduce((sum, c) => sum + measure(c), 0) + Math.max(0, children.length - 1) * SIBLING_GAP);
    sizes.set(n.id, { own, total, lines }); return total;
  }
  const height = measure(root) + 64;
  function place(n: TreeNode, depth: number, top: number): Box {
    const size = sizes.get(n.id)!;
    const box = { node: n, x: 32 + depth * (NODE_WIDTH + LEVEL_GAP), y: top + (size.total - size.own) / 2, width: NODE_WIDTH, height: size.own, lines: size.lines, depth };
    boxes.push(box);
    let cursor = top;
    for (const child of collapsed.has(n.id) ? [] : n.children) {
      const to = place(child, depth + 1, cursor); links.push({ from: box, to });
      cursor += sizes.get(child.id)!.total + SIBLING_GAP;
    }
    return box;
  }
  place(root, 0, 32);
  return { boxes, links, width: Math.max(...boxes.map(b => b.x + b.width)) + 32, height };
}
export const demoTree: TreeNode = { id: 'demo-root', title: '자율신경계', children: [
  { id: 'sym', title: '교감신경', children: [ { id: 'sym-nt', title: '신경전달물질', children: [] }, { id: 'sym-r', title: '수용체', children: [] } ] },
  { id: 'para', title: '부교감신경', children: [ { id: 'para-nt', title: '신경전달물질', children: [] }, { id: 'para-r', title: '수용체', children: [] } ] },
] };
