export const INLINE_POWERUP = 'clear_tree_inline';
export const HOST_STYLE_MESSAGE = 'clear-tree-host-style';
export const stateKey = (id: string) => `inline-state:${id}`;
export interface InlineState { portalId?: string }
// Scope host styling to the exact root Rem. Never move editor rows with flex/position.
export function hostCSS(id: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error('지원하지 않는 Rem ID');
  const root = `[data-rem-container-id="${id}"]`;
  return `${root} > .tree-node--parent .rem-text,
${root} > .tree-node--parent .rn-rem-bullet,
${root} > .tree-node--parent .rn-bullet-container,
${root} > .rn-fast-rem-editor-container .rem-text,
${root} > .rn-fast-rem-editor-container .rn-rem-bullet { visibility: hidden !important; }
${root} > .tree-node--parent { min-height: 0 !important; }
`;
}
