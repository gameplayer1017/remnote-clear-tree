import React, { useMemo, useRef, useState } from 'react';
import { layoutTree, TreeNode } from './model';
import './tree.css';
export function TreeView({ root, warnings = [], onClose, onRefresh, onOpen, busy = false }: {
  root: TreeNode; warnings?: string[]; onClose?: () => void; onRefresh?: () => void;
  onOpen?: (id: string) => void; busy?: boolean;
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(1), [border, setBorder] = useState(true);
  const [selected, setSelected] = useState<string>(root.id);
  const svgRef = useRef<SVGSVGElement>(null), viewport = useRef<HTMLDivElement>(null);
  const graph = useMemo(() => layoutTree(root, collapsed), [root, collapsed]);
  function toggle(id: string) { setCollapsed(old => { const next = new Set(old); next.has(id) ? next.delete(id) : next.add(id); return next; }); }
  function fit() { if (viewport.current) setZoom(Math.max(.1, Math.min(1.5, (viewport.current.clientWidth - 24) / graph.width, (viewport.current.clientHeight - 24) / graph.height))); }
  function save() {
    if (!svgRef.current) return;
    const copy = svgRef.current.cloneNode(true) as SVGSVGElement;
    copy.setAttribute('width', String(graph.width)); copy.setAttribute('height', String(graph.height));
    const data = new XMLSerializer().serializeToString(copy);
    const url = URL.createObjectURL(new Blob([data], { type: 'image/svg+xml;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `${root.title.slice(0, 60).replace(/[\\/:*?"<>|]/g, '_') || 'tree'}.svg`; a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <main className="ct-app">
    <header className="ct-header"><div><div className="ct-eyebrow">CLEAR TREE</div><h1>{root.title}</h1><p>노드를 누르면 가지를 접거나 펼칠 수 있어요.</p></div>{onClose && <button aria-label="트리 창 닫기" onClick={onClose}>닫기 ×</button>}</header>
    <div className="ct-toolbar" aria-label="트리 도구">
      <button aria-label="축소" onClick={() => setZoom(z => Math.max(.1, z - .1))}>−</button><output aria-label="확대 비율">{Math.round(zoom * 100)}%</output><button aria-label="확대" onClick={() => setZoom(z => Math.min(2, z + .1))}>＋</button>
      <button onClick={fit}>화면에 맞춤</button><button onClick={() => setCollapsed(new Set())}>모두 펼치기</button>
      <label><input type="checkbox" checked={border} onChange={e => setBorder(e.target.checked)} />테두리</label>
      {onRefresh && <button disabled={busy} onClick={onRefresh}>{busy ? '불러오는 중…' : '새로고침'}</button>}
      {onOpen && <button onClick={() => onOpen(selected)}>선택한 원문 열기 ↗</button>}
      <button className="ct-primary" onClick={save}>SVG 저장</button>
    </div>
    {warnings.map(w => <div className="ct-warning" key={w}>{w}</div>)}
    {!root.children.length && <div className="ct-warning">이 항목에 하위 항목이 없습니다. 부모 항목에서 다시 열어보세요.</div>}
    <div ref={viewport} className="ct-viewport" tabIndex={0} aria-label="스크롤 가능한 트리">
      <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" width={graph.width * zoom} height={graph.height * zoom} viewBox={`0 0 ${graph.width} ${graph.height}`} role="group" aria-label={`${root.title} 트리`}>
        <rect width={graph.width} height={graph.height} fill="#f6f8fc" />
        {graph.links.map(({ from, to }) => { const x = from.x + from.width, y = from.y + from.height / 2, ty = to.y + to.height / 2; return <path key={`${from.node.id}-${to.node.id}`} d={`M ${x} ${y} C ${x + 32} ${y}, ${to.x - 32} ${ty}, ${to.x} ${ty}`} stroke="#a1b3ce" strokeWidth="2" fill="none" />; })}
        {graph.boxes.map(b => {
          const isRoot = b.depth === 0, fill = isRoot ? '#1f4e79' : '#ffffff', text = isRoot ? '#ffffff' : '#183b59';
          const active = selected === b.node.id;
          return <g key={b.node.id} role="button" tabIndex={0} aria-label={`${b.node.title}${b.node.children.length ? collapsed.has(b.node.id) ? ', 펼치기' : ', 접기' : ''}`} aria-expanded={b.node.children.length ? !collapsed.has(b.node.id) : undefined}
            onClick={() => { setSelected(b.node.id); if (b.node.children.length) toggle(b.node.id); }}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(b.node.id); if (b.node.children.length) toggle(b.node.id); } }} style={{ cursor: 'pointer' }}>
            <title>{b.node.title}</title>
            <rect x={b.x} y={b.y} width={b.width} height={b.height} rx="12" fill={fill} stroke={border ? active ? '#4c88cc' : '#d1ddea' : 'none'} strokeWidth={active ? 2.5 : 1.2} />
            <text x={b.x + 16} y={b.y + 16 + (b.height - 32 - (b.lines.length - 1) * 22) / 2} fill={text} fontFamily="Arial, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif" fontSize="15" fontWeight={isRoot ? '700' : '500'} dominantBaseline="middle">
              {b.lines.map((line, i) => <tspan key={i} x={b.x + 16} dy={i ? 22 : 0}>{line}</tspan>)}
            </text>
            {b.node.children.length > 0 && <g><circle cx={b.x + b.width - 3} cy={b.y + b.height / 2} r="10" fill="#edf3fb" stroke="#b5c8e2" /><text x={b.x + b.width - 3} y={b.y + b.height / 2 + 1} textAnchor="middle" dominantBaseline="middle" fill="#1f4e79" fontSize="14">{collapsed.has(b.node.id) ? '+' : '−'}</text></g>}
          </g>;
        })}
      </svg>
    </div><footer className="ct-footer">{graph.boxes.length}개 항목 표시 · 좌우·상하 스크롤 가능</footer>
  </main>;
}
