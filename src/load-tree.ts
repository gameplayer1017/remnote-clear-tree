import { TreeNode } from './model';
export interface RemReader { read(id: string): Promise<{ title: string; children: string[] } | undefined> }
export async function loadTree(reader: RemReader, rootId: string, maxNodes = 1000, maxDepth = 30) {
  let count = 0;
  const warnings = new Set<string>(), seen = new Set<string>();
  async function visit(id: string, depth: number): Promise<TreeNode | undefined> {
    if (count >= maxNodes) { warnings.add(`최대 ${maxNodes}개 항목까지 표시했습니다. 더 작은 부모 항목에서 열어주세요.`); return; }
    if (seen.has(id)) { warnings.add('반복 참조를 제외했습니다.'); return; }
    seen.add(id); count++;
    const rem = await reader.read(id);
    if (!rem) { warnings.add('접근할 수 없거나 삭제된 항목을 제외했습니다.'); return; }
    const node: TreeNode = { id, title: rem.title || '(빈 항목)', children: [] };
    if (depth >= maxDepth && rem.children.length) { warnings.add(`최대 ${maxDepth}단계까지 표시했습니다.`); return node; }
    for (const childId of rem.children) {
      if (count >= maxNodes) { warnings.add(`최대 ${maxNodes}개 항목까지 표시했습니다. 더 작은 부모 항목에서 열어주세요.`); break; }
      const child = await visit(childId, depth + 1);
      if (child) node.children.push(child);
    }
    return node;
  }
  const root = await visit(rootId, 0);
  if (!root) throw new Error('부모 항목을 읽을 수 없습니다. 항목을 선택한 뒤 다시 실행하세요.');
  return { root, warnings: [...warnings] };
}
