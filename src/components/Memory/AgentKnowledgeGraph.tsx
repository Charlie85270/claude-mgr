'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, RefreshCw, ZoomIn, ZoomOut, Maximize2, X, Save, Eye, Pencil } from 'lucide-react';
import type { AgentStatus, ProjectMemory } from '@/types/electron';
import { SimpleMarkdown } from '@/components/VaultView/components/MarkdownRenderer';

// ── Node / edge types ─────────────────────────────────────────────────────────

type NodeKind = 'agent' | 'skill' | 'memory' | 'instructions' | 'plugin' | 'mcp';
type NodeShape = 'circle' | 'tag';

interface NodeMeta {
  filePath?: string;     // for memory / instructions
  skillPath?: string;    // for skill nodes — path on disk
  description?: string;  // for plugins / skills
  command?: string;      // for mcp nodes
  args?: string;         // for mcp nodes
  editable?: boolean;    // whether the panel allows editing
}

interface GraphNode {
  id: string;
  label: string;
  kind: NodeKind;
  shape?: NodeShape;
  character?: string;
  meta?: NodeMeta;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  fixed?: boolean;
}

const CHARACTER_EMOJIS: Record<string, string> = {
  robot:     '🤖',
  ninja:     '🥷',
  wizard:    '🧙',
  astronaut: '👨‍🚀',
  knight:    '⚔️',
  pirate:    '🏴‍☠️',
  alien:     '👽',
  viking:    '🪓',
  frog:      '🐸',
};

interface GraphEdge {
  source: string;
  target: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ── Visual config ─────────────────────────────────────────────────────────────

const KIND_COLOR: Record<NodeKind, { fill: string; glow: string; label: string; text: string }> = {
  agent:        { fill: '#8b5cf6', glow: 'rgba(139,92,246,0.7)',  label: '#ede9fe', text: '#ffffff' },
  skill:        { fill: '#3b82f6', glow: 'rgba(59,130,246,0.5)',  label: '#bfdbfe', text: '#dbeafe' },
  memory:       { fill: '#10b981', glow: 'rgba(16,185,129,0.5)',  label: '#a7f3d0', text: '#d1fae5' },
  instructions: { fill: '#0ea5e9', glow: 'rgba(14,165,233,0.5)',  label: '#bae6fd', text: '#e0f2fe' },
  plugin:       { fill: '#f59e0b', glow: 'rgba(245,158,11,0.5)',  label: '#fde68a', text: '#fef3c7' },
  mcp:          { fill: '#ec4899', glow: 'rgba(236,72,153,0.5)',  label: '#fbcfe8', text: '#fce7f3' },
};

const KIND_RADIUS: Record<NodeKind, number> = {
  agent:        20,
  skill:        10,
  memory:       9,
  instructions: 9,
  plugin:       10,
  mcp:          10,
};

// ── Rounded rect helper (avoids ctx.roundRect browser/TS compatibility) ────────

function strokeRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// ── Force simulation ──────────────────────────────────────────────────────────

const REPULSION   = 4500;
const ATTRACTION  = 0.032;
const DAMPING     = 0.85;
const ITERATIONS  = 1;

// Returns total kinetic energy after the tick so the rAF loop can decide
// whether the sim has converged and it's safe to pause until the next
// interaction or data change. Without this, the O(n²) loop runs forever
// at 60fps even when the layout has fully settled.
function tickForce(nodes: GraphNode[], edges: GraphEdge[]): number {
  const n = nodes.length;
  const idx = new Map(nodes.map((nd, i) => [nd.id, i]));

  for (let iter = 0; iter < ITERATIONS; iter++) {
    // Repulsion between all pairs
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = b.x - a.x || 0.1;
        const dy = b.y - a.y || 0.1;
        const dist2 = Math.max(dx * dx + dy * dy, 100);
        const d = Math.sqrt(dist2);
        const force = REPULSION / dist2;
        const fx = force * dx / d;
        const fy = force * dy / d;
        a.vx -= fx; a.vy -= fy;
        b.vx += fx; b.vy += fy;
      }
    }

    // Spring attraction along edges
    for (const edge of edges) {
      const ai = idx.get(edge.source);
      const bi = idx.get(edge.target);
      if (ai === undefined || bi === undefined) continue;
      const a = nodes[ai], b = nodes[bi];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const idealLen = (a.r + b.r) * 5;
      const delta = (dist - idealLen) * ATTRACTION;
      const fx = (dx / dist) * delta;
      const fy = (dy / dist) * delta;
      a.vx += fx; a.vy += fy;
      b.vx -= fx; b.vy -= fy;
    }

    // Integrate + accumulate kinetic energy (sum of v²).
    let energy = 0;
    for (const nd of nodes) {
      if (nd.fixed) continue;
      nd.vx *= DAMPING;
      nd.vy *= DAMPING;
      nd.x += nd.vx;
      nd.y += nd.vy;
      energy += nd.vx * nd.vx + nd.vy * nd.vy;
    }
    if (iter === ITERATIONS - 1) return energy;
  }
  return 0;
}

// When summed kinetic energy stays below this threshold for a few frames
// in a row, the simulation is considered converged and the rAF loop is
// paused. Any user interaction or data reload will kick it back alive.
const ENERGY_EPSILON = 0.05;
const IDLE_FRAMES_TO_PAUSE = 30;

// ── Data types ────────────────────────────────────────────────────────────────

type McpEntry = { command?: string; args?: string[] };
type ClaudeDataType = {
  plugins: Array<{ name?: string; displayName?: string; enabled?: boolean }>;
  skills: Array<{ name: string; source: string; path: string; description?: string }>;
  settings?: unknown;
  mcpServers?: Record<string, McpEntry>;
  projectMcpServers?: Record<string, McpEntry & { projectPaths: string[] }>;
};

// { filePath → agentId[] | 'global' }
type InstructionFiles = Record<string, string[] | 'global'>;

// ── Build graph ───────────────────────────────────────────────────────────────

function buildGraph(
  agents: AgentStatus[],
  claudeData: ClaudeDataType | null,
  memories: ProjectMemory[],
  instructions: InstructionFiles,
  selectedAgentId: string | null,
  cx: number,
  cy: number,
): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const added = new Set<string>();
  const edgeSet = new Set<string>();

  const addNode = (node: Omit<GraphNode, 'vx' | 'vy'> & { vx?: number; vy?: number }) => {
    if (added.has(node.id)) return;
    added.add(node.id);
    nodes.push({ vx: 0, vy: 0, ...node });
  };

  const addEdge = (source: string, target: string) => {
    const key = `${source}→${target}`;
    if (edgeSet.has(key)) return;
    edgeSet.add(key);
    edges.push({ source, target });
  };

  const relevantAgents = selectedAgentId
    ? agents.filter(a => a.id === selectedAgentId)
    : agents;

  const count = Math.max(relevantAgents.length, 1);
  const angleStep = (2 * Math.PI) / count;

  // ── Agent nodes ──
  relevantAgents.forEach((agent, i) => {
    const spread = Math.min(180, 60 + count * 28);
    const ax = cx + Math.cos(i * angleStep) * spread * 0.5;
    const ay = cy + Math.sin(i * angleStep) * spread * 0.5;

    addNode({
      id: agent.id,
      label: agent.name || `Agent ${agent.id.slice(0, 6)}`,
      kind: 'agent',
      character: agent.character ?? 'robot',
      x: ax, y: ay,
      r: KIND_RADIUS.agent,
    });

    // ── Agent skills ──
    for (const skillName of agent.skills ?? []) {
      const skillId = `skill:${skillName}`;
      if (!added.has(skillId)) {
        const theta = Math.random() * 2 * Math.PI;
        const skillMeta = claudeData?.skills?.find(s => s.name === skillName);
        addNode({
          id: skillId, label: skillName, kind: 'skill',
          x: ax + Math.cos(theta) * 75, y: ay + Math.sin(theta) * 75,
          r: KIND_RADIUS.skill,
          meta: { skillPath: skillMeta?.path, description: skillMeta?.description },
        });
      }
      addEdge(agent.id, skillId);
    }

    // ── Memory files (MEMORY.md etc.) for this agent's project ──
    const normalPath = (p: string) => p?.replace(/\/$/, '').toLowerCase();
    const agentPath = normalPath(agent.projectPath ?? '');
    const agentMemory = memories.find(m =>
      normalPath(m.projectPath) === agentPath ||
      normalPath(m.projectPath).endsWith('/' + agentPath.split('/').pop())
    );

    if (agentMemory?.hasMemory && agentMemory.files?.length) {
      agentMemory.files.forEach((file, fi) => {
        const memId = `mem:${file.path}`;
        if (!added.has(memId)) {
          const theta = fi * (2 * Math.PI / agentMemory.files.length) + Math.PI * 0.3;
          addNode({
            id: memId, label: file.name, kind: 'memory', shape: 'tag',
            x: ax + Math.cos(theta) * 95, y: ay + Math.sin(theta) * 95,
            r: 9, meta: { filePath: file.path, editable: true },
          });
        }
        addEdge(agent.id, memId);
      });
    }
    // No fallback node — if there's no memory file, don't show one
  });

  // ── Instruction files (CLAUDE.md) ──
  // Show a clean ~/-prefixed path as label
  const toShortPath = (fp: string) =>
    fp.replace(/^\/(?:Users|home)\/[^/]+\//, '~/').replace(/^\/Users\/[^/]+\//, '~/');

  for (const [filePath, scope] of Object.entries(instructions)) {
    const label = toShortPath(filePath);
    const instrId = `instr:${filePath}`;
    const connectTo = scope === 'global' ? relevantAgents.map(a => a.id) : (scope as string[]);

    if (!added.has(instrId)) {
      const theta = Math.random() * 2 * Math.PI;
      const dist = 110 + Math.random() * 60;
      addNode({
        id: instrId, label, kind: 'instructions', shape: 'tag',
        x: cx + Math.cos(theta) * dist, y: cy + Math.sin(theta) * dist,
        r: 9, meta: { filePath, editable: true },
      });
    }
    for (const agentId of connectTo) {
      if (relevantAgents.some(a => a.id === agentId)) addEdge(agentId, instrId);
    }
  }

  // ── Global plugins (connect to all agents) ──
  if (claudeData?.plugins?.length) {
    for (const plugin of claudeData.plugins.slice(0, 15)) {
      const p = plugin as { name?: string; displayName?: string };
      const name = (p.name ?? p.displayName ?? 'plugin').toString();
      const pluginId = `plugin:${name}`;
      if (!added.has(pluginId)) {
        const theta = Math.random() * 2 * Math.PI;
        const dist = 150 + Math.random() * 70;
        const pFull = plugin as { name?: string; displayName?: string; description?: string };
        addNode({
          id: pluginId, label: name, kind: 'plugin',
          x: cx + Math.cos(theta) * dist, y: cy + Math.sin(theta) * dist,
          r: KIND_RADIUS.plugin,
          meta: { description: pFull.description ?? '' },
        });
      }
      for (const agent of relevantAgents) {
        addEdge(agent.id, pluginId);
      }
    }
  }

  // ── MCP servers from ~/.claude/mcp.json (global — connect to all agents) ──
  const mcpServers = claudeData?.mcpServers;
  if (mcpServers) {
    for (const [mcpName, mcpCfg] of Object.entries(mcpServers).slice(0, 20)) {
      const mcpId = `mcp:${mcpName}`;
      if (!added.has(mcpId)) {
        const theta = Math.random() * 2 * Math.PI;
        const dist = 160 + Math.random() * 60;
        addNode({
          id: mcpId, label: mcpName, kind: 'mcp',
          x: cx + Math.cos(theta) * dist, y: cy + Math.sin(theta) * dist,
          r: KIND_RADIUS.mcp,
          meta: {
            command: mcpCfg?.command ?? '',
            args: mcpCfg?.args ? JSON.stringify(mcpCfg.args) : '',
          },
        });
      }
      for (const agent of relevantAgents) {
        addEdge(agent.id, mcpId);
      }
    }
  }

  // ── Per-project MCP servers (only for agents whose project has that MCP) ──
  const projectMcpServers = claudeData?.projectMcpServers;
  if (projectMcpServers) {
    for (const [mcpName, entry] of Object.entries(projectMcpServers).slice(0, 30)) {
      for (const agent of relevantAgents) {
        const hasAccess = entry.projectPaths.some(p => agent.projectPath === p);
        if (!hasAccess) continue;
        const mcpId = `mcp:${mcpName}`;
        if (!added.has(mcpId)) {
          const theta = Math.random() * 2 * Math.PI;
          const dist = 160 + Math.random() * 60;
          addNode({
            id: mcpId, label: mcpName, kind: 'mcp',
            x: cx + Math.cos(theta) * dist, y: cy + Math.sin(theta) * dist,
            r: KIND_RADIUS.mcp,
            meta: { command: entry.command ?? '', args: entry.args ? JSON.stringify(entry.args) : '' },
          });
        }
        addEdge(agent.id, mcpId);
      }
    }
  }

  return { nodes, edges };
}

// ── Canvas renderer ───────────────────────────────────────────────────────────

function drawGraph(
  ctx: CanvasRenderingContext2D,
  graph: GraphData,
  hoveredId: string | null,
  transform: { x: number; y: number; scale: number },
) {
  const dpr = window.devicePixelRatio || 1;
  const w = ctx.canvas.offsetWidth;
  const h = ctx.canvas.offsetHeight;

  // DPR-aware clear: draw in CSS pixel space
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  ctx.save();
  ctx.translate(transform.x, transform.y);
  ctx.scale(transform.scale, transform.scale);

  // Build a node lookup for edge drawing
  const nodeMap = new Map(graph.nodes.map(n => [n.id, n]));

  // ── Draw edges ──
  for (const edge of graph.edges) {
    const a = nodeMap.get(edge.source);
    const b = nodeMap.get(edge.target);
    if (!a || !b) continue;
    const hovered = hoveredId === a.id || hoveredId === b.id;

    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);

    if (hovered) {
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 1.8;
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.30)';
      ctx.lineWidth = 1.2;
    }
    ctx.stroke();
  }

  // ── Draw nodes ──
  for (const nd of graph.nodes) {
    const colors = KIND_COLOR[nd.kind];
    const hovered = nd.id === hoveredId;

    if (nd.shape === 'tag') {
      // Tag / pill shape for memory files
      const TAG_FONT = `500 9.5px ui-sans-serif,system-ui,sans-serif`;
      ctx.font = TAG_FONT;
      const textW = ctx.measureText(nd.label).width;
      const tw = textW + 16;
      const th = 20;
      const rx = nd.x - tw / 2;
      const ry = nd.y - th / 2;

      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = hovered ? 14 : 6;

      strokeRoundRect(ctx, rx, ry, tw, th, 5);
      ctx.fillStyle = hovered ? colors.fill + 'ee' : colors.fill + '2a';
      ctx.fill();
      ctx.strokeStyle = hovered ? colors.fill + 'ff' : colors.fill + 'aa';
      ctx.lineWidth = hovered ? 1.5 : 1;
      strokeRoundRect(ctx, rx, ry, tw, th, 5);
      ctx.stroke();

      ctx.shadowBlur = 0;

      ctx.font = TAG_FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Readable text shadow
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillText(nd.label, nd.x + 0.5, nd.y + 0.5);
      ctx.fillStyle = hovered ? '#ffffff' : colors.text;
      ctx.fillText(nd.label, nd.x, nd.y);

    } else if (nd.kind === 'agent') {
      // Agent node: emoji avatar inside a circle
      const r = nd.r * (hovered ? 1.3 : 1);
      const emoji = CHARACTER_EMOJIS[nd.character ?? 'robot'] ?? '🤖';

      // Subtle glow on hover only
      if (hovered) {
        ctx.shadowColor = 'rgba(255,255,255,0.4)';
        ctx.shadowBlur = 22;
        ctx.beginPath();
        ctx.arc(nd.x, nd.y, r, 0, Math.PI * 2);
        ctx.fillStyle = '#0d0d14';
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Solid background circle matching canvas bg
      ctx.beginPath();
      ctx.arc(nd.x, nd.y, r, 0, Math.PI * 2);
      ctx.fillStyle = '#0d0d14';
      ctx.fill();

      // Clip emoji to circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(nd.x, nd.y, r - 1, 0, Math.PI * 2);
      ctx.clip();
      ctx.font = `${Math.round(r * 1.5)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, nd.x, nd.y + r * 0.05);
      ctx.restore();

      // Label below
      ctx.font = `600 11px ui-sans-serif,system-ui,sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const ly = nd.y + r + 5;
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillText(nd.label, nd.x + 0.5, ly + 0.5);
      ctx.fillStyle = hovered ? '#ffffff' : colors.label;
      ctx.fillText(nd.label, nd.x, ly);

    } else {
      // Circle node (skill, plugin, mcp)
      const r = nd.r * (hovered ? 1.3 : 1);

      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = hovered ? 16 : 8;

      ctx.beginPath();
      ctx.arc(nd.x, nd.y, r, 0, Math.PI * 2);
      ctx.fillStyle = hovered ? colors.fill : colors.fill + 'dd';
      ctx.fill();

      ctx.shadowBlur = 0;

      // Labels: always for plugin/mcp, threshold for others
      const showLabel = hovered || nd.kind === 'plugin' || nd.kind === 'mcp' || nd.r >= 9;
      if (showLabel) {
        ctx.font = `400 9px ui-sans-serif,system-ui,sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const ly = nd.y + r + 4;
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillText(nd.label, nd.x + 0.5, ly + 0.5);
        ctx.fillStyle = hovered ? '#ffffff' : colors.label;
        ctx.fillText(nd.label, nd.x, ly);
      }
    }
  }

  ctx.restore();
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AgentKnowledgeGraph() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const animRef      = useRef<number>(0);
  const graphRef     = useRef<GraphData>({ nodes: [], edges: [] });
  const transformRef = useRef({ x: 0, y: 0, scale: 1 });
  const hoveredRef   = useRef<string | null>(null);
  const dragRef      = useRef<{ nodeId: string | null; panStart: { x: number; y: number } | null }>({ nodeId: null, panStart: null });
  const warmupRef    = useRef(0);
  // When the sim has converged (kinetic energy ~0 for several frames in a
  // row), the loop pauses itself. `kickSimulation` restarts it on user
  // interaction or data changes. Without this, the O(n²) force tick burned
  // CPU at 60fps indefinitely.
  const idleFramesRef = useRef(0);
  const runningRef = useRef(false);
  const kickSimulationRef = useRef<() => void>(() => {});
  const claudeDataRef    = useRef<ClaudeDataType | null>(null);
  const memoriesRef      = useRef<ProjectMemory[]>([]);
  const instructionsRef  = useRef<InstructionFiles>({});

  const [loading, setLoading] = useState(true);
  const [graphBuilding, setGraphBuilding] = useState(false);
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [legendOpen, setLegendOpen] = useState(true);
  const [nodeCount, setNodeCount] = useState(0);
  const [edgeCount, setEdgeCount] = useState(0);

  // ── Side panel state ──
  const [panelNode, setPanelNode] = useState<GraphNode | null>(null);
  const [panelContent, setPanelContent] = useState('');
  const [panelDraft, setPanelDraft] = useState('');
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelTab, setPanelTab] = useState<'write' | 'preview'>('write');

  // ── Load all data ──
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [agentList, claudeData, memResult, mcpResult] = await Promise.all([
        window.electronAPI?.agent.list().catch(() => []) ?? [],
        window.electronAPI?.claude?.getData().catch(() => null) ?? null,
        window.electronAPI?.memory?.listProjects().catch(() => ({ projects: [], error: null })) ?? { projects: [], error: null },
        window.electronAPI?.shell?.readFileAbs({ absolutePath: '~/.claude/mcp.json' }).catch(() => null) ?? null,
      ]);

      const typedAgents = agentList as AgentStatus[];
      const typedClaude = claudeData as ClaudeDataType | null;
      const memories = (memResult as { projects: ProjectMemory[] })?.projects ?? [];

      // Parse MCP servers from mcp.json
      let mcpServers: Record<string, McpEntry> | undefined;
      try {
        const mcpJson = (mcpResult as { output?: string } | null)?.output;
        if (mcpJson) {
          const parsed = JSON.parse(mcpJson);
          mcpServers = parsed?.mcpServers ?? undefined;
        }
      } catch { /* ignore parse errors */ }

      // enrichedClaude is built later after project MCPs are loaded
      // (placeholder — filled in after CLAUDE.md/MCP discovery below)
      claudeDataRef.current = null; // reset; will be set after discovery
      memoriesRef.current = memories;

      // ── Discover CLAUDE.md instruction files ──
      const typedAgentsCast = typedAgents as AgentStatus[];
      const uniqueProjectPaths = [...new Set(typedAgentsCast.map(a => a.projectPath).filter(Boolean))];

      // Only include the CLAUDE.md files that are actually loaded per agent:
      // - ~/.claude/CLAUDE.md  (global Claude config)
      // - ~/.dorothy/CLAUDE.md (global Echelon config)
      // - {projectPath}/CLAUDE.md and {projectPath}/.claude/CLAUDE.md per agent
      // The checkFiles handler expands leading `~/` to os.homedir() in main.
      const candidatePaths: string[] = [
        '~/.claude/CLAUDE.md',
        '~/.dorothy/CLAUDE.md',
        '~/.echelon/CLAUDE.md',
        ...uniqueProjectPaths.flatMap(p => [`${p}/CLAUDE.md`, `${p}/.claude/CLAUDE.md`]),
      ];
      const claudeMdResult = await window.electronAPI?.shell?.checkFiles({ paths: candidatePaths }).catch(() => null);
      const instrFiles: InstructionFiles = {};
      const foundPaths = claudeMdResult?.success ? claudeMdResult.existing : [];
      for (const fp of foundPaths) {
        // Global: ~/.claude/ or ~/.dorothy/ files
        const isGlobal = (fp.includes('/.claude/') && !fp.includes('/.claude/projects/'))
          || fp.includes('/.dorothy/');
        if (isGlobal) {
          instrFiles[fp] = 'global';
        } else {
          // Project-specific: match to agents whose projectPath contains this file
          const matchingIds = typedAgentsCast
            .filter(a => a.projectPath && fp.startsWith(a.projectPath + '/'))
            .map(a => a.id);
          instrFiles[fp] = matchingIds.length > 0 ? matchingIds : 'global';
        }
      }
      instructionsRef.current = instrFiles;

      // ── Load per-project MCP servers (.mcp.json / .claude/mcp.json) ──
      const projectMcpResults = await Promise.all(
        uniqueProjectPaths.map(async p => {
          // Try both locations; readFile with projectRoot=p scopes the read
          // to inside the project dir, no shell involved.
          const tryPaths = ['.mcp.json', '.claude/mcp.json'];
          let output = '';
          for (const rel of tryPaths) {
            const res = await window.electronAPI?.shell?.readFile({
              projectRoot: p,
              relativePath: rel,
            }).catch(() => null);
            if (res?.success && res.output) {
              output = res.output.replace(/\r/g, '').trim();
              if (output) break;
            }
          }
          if (!output) return null;
          try {
            const parsed = JSON.parse(output);
            const servers = parsed?.mcpServers ?? parsed;
            return { projectPath: p, servers };
          } catch { return null; }
        }),
      );
      const projectMcpServers: Record<string, McpEntry & { projectPaths: string[] }> = {};
      for (const result of projectMcpResults) {
        if (!result) continue;
        for (const [name, cfg] of Object.entries(result.servers ?? {})) {
          const c = cfg as McpEntry;
          if (!projectMcpServers[name]) {
            projectMcpServers[name] = { command: c.command, args: c.args, projectPaths: [] };
          }
          projectMcpServers[name].projectPaths.push(result.projectPath);
        }
      }

      // Build final enriched claude data including project MCPs
      const enrichedClaude: ClaudeDataType | null = typedClaude
        ? { ...typedClaude, mcpServers, projectMcpServers }
        : (mcpServers || Object.keys(projectMcpServers).length > 0)
          ? { plugins: [], skills: [], mcpServers, projectMcpServers }
          : null;
      claudeDataRef.current = enrichedClaude;

      setAgents(typedAgents);

      // Default to first agent
      const firstId = typedAgents[0]?.id ?? null;
      setSelectedAgentId(firstId);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const cx = canvas.offsetWidth / 2;
      const cy = canvas.offsetHeight / 2;

      const graph = buildGraph(typedAgents, enrichedClaude, memories, instrFiles, firstId, cx, cy);
      graphRef.current = graph;
      setNodeCount(graph.nodes.length);
      setEdgeCount(graph.edges.length);
      warmupRef.current = 150;
      kickSimulationRef.current();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Rebuild when agent filter changes
  useEffect(() => {
    if (loading) return;
    setGraphBuilding(true);
    const canvas = canvasRef.current;
    if (!canvas) { setGraphBuilding(false); return; }
    const cx = canvas.offsetWidth / 2;
    const cy = canvas.offsetHeight / 2;
    const graph = buildGraph(
      agents,
      claudeDataRef.current,
      memoriesRef.current,
      instructionsRef.current,
      selectedAgentId,
      cx, cy,
    );
    graphRef.current = graph;
    setNodeCount(graph.nodes.length);
    setEdgeCount(graph.edges.length);
    warmupRef.current = 120;
    kickSimulationRef.current();
    // Brief delay so the spinner is visible before the new graph renders
    setTimeout(() => setGraphBuilding(false), 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAgentId, agents]);

  // ── Animation loop ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      const graph = graphRef.current;
      const t = transformRef.current;
      const energy = tickForce(graph.nodes, graph.edges);

      if (energy < ENERGY_EPSILON) {
        idleFramesRef.current++;
      } else {
        idleFramesRef.current = 0;
      }

      if (warmupRef.current > 0) {
        warmupRef.current--;
      } else {
        drawGraph(ctx, graph, hoveredRef.current, t);
      }

      // Pause the loop once the sim has been idle for enough frames.
      // It'll be resumed by kickSimulation() on interaction or data change.
      if (idleFramesRef.current >= IDLE_FRAMES_TO_PAUSE) {
        runningRef.current = false;
        return;
      }
      animRef.current = requestAnimationFrame(loop);
    };

    const kick = () => {
      idleFramesRef.current = 0;
      if (runningRef.current) return;
      runningRef.current = true;
      animRef.current = requestAnimationFrame(loop);
    };
    kickSimulationRef.current = kick;

    runningRef.current = true;
    animRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animRef.current);
      runningRef.current = false;
    };
  }, [loading]);

  // ── Canvas resize (DPR-aware) ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = canvas.offsetWidth  * dpr;
      canvas.height = canvas.offsetHeight * dpr;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    return () => ro.disconnect();
  }, []);

  // ── Hit-test ──
  const hitTest = useCallback((ex: number, ey: number) => {
    const t = transformRef.current;
    const wx = (ex - t.x) / t.scale;
    const wy = (ey - t.y) / t.scale;
    for (const nd of [...graphRef.current.nodes].reverse()) {
      if (nd.shape === 'tag') {
        const canvas = canvasRef.current;
        if (!canvas) continue;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        ctx.font = '500 9.5px ui-sans-serif,system-ui,sans-serif';
        const tw = ctx.measureText(nd.label).width + 16;
        if (Math.abs(wx - nd.x) <= tw / 2 + 4 && Math.abs(wy - nd.y) <= 14) return nd;
      } else {
        const dx = wx - nd.x, dy = wy - nd.y;
        if (dx * dx + dy * dy <= (nd.r + 6) ** 2) return nd;
      }
    }
    return null;
  }, []);

  // ── Pointer handlers ──
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const ex = e.clientX - rect.left;
    const ey = e.clientY - rect.top;

    if (dragRef.current.nodeId) {
      const t = transformRef.current;
      const nd = graphRef.current.nodes.find(n => n.id === dragRef.current.nodeId);
      if (nd) { nd.x = (ex - t.x) / t.scale; nd.y = (ey - t.y) / t.scale; nd.vx = 0; nd.vy = 0; }
      kickSimulationRef.current();
      return;
    }
    if (dragRef.current.panStart) {
      const { x: sx, y: sy } = dragRef.current.panStart;
      transformRef.current = { ...transformRef.current, x: transformRef.current.x + (ex - sx), y: transformRef.current.y + (ey - sy) };
      dragRef.current.panStart = { x: ex, y: ey };
      kickSimulationRef.current();
      return;
    }

    const hit = hitTest(ex, ey);
    const prev = hoveredRef.current;
    hoveredRef.current = hit?.id ?? null;
    if (canvasRef.current) canvasRef.current.style.cursor = hit ? 'pointer' : 'grab';
    if (prev !== hoveredRef.current) {
      warmupRef.current = 0;
      kickSimulationRef.current();
    }
  }, [hitTest]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const ex = e.clientX - rect.left;
    const ey = e.clientY - rect.top;
    const hit = hitTest(ex, ey);
    if (hit) dragRef.current.nodeId = hit.id;
    else dragRef.current.panStart = { x: ex, y: ey };
  }, [hitTest]);

  const handleMouseUp = useCallback(() => {
    // Pin dragged node so it stays where dropped
    if (dragRef.current.nodeId) {
      const nd = graphRef.current.nodes.find(n => n.id === dragRef.current.nodeId);
      if (nd) { nd.fixed = true; nd.vx = 0; nd.vy = 0; }
    }
    dragRef.current.nodeId = null;
    dragRef.current.panStart = null;
    if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    const ex = e.clientX - rect.left;
    const ey = e.clientY - rect.top;
    const delta = e.deltaY < 0 ? 1.1 : 0.9;
    const t = transformRef.current;
    const newScale = Math.min(5, Math.max(0.15, t.scale * delta));
    transformRef.current = {
      scale: newScale,
      x: ex - (ex - t.x) * (newScale / t.scale),
      y: ey - (ey - t.y) * (newScale / t.scale),
    };
  }, []);

  const openPanel = useCallback(async (node: GraphNode) => {
    setPanelNode(node);
    setPanelLoading(true);
    setPanelTab('preview');
    try {
      let content = '';
      if (node.kind === 'memory' && node.meta?.filePath) {
        const res = await window.electronAPI?.memory?.readFile(node.meta.filePath);
        content = res?.content ?? '';
      } else if (node.kind === 'instructions' && node.meta?.filePath) {
        // filePath may start with `~` or be an absolute path under $HOME.
        const fp = node.meta.filePath;
        const res = await window.electronAPI?.shell?.readFileAbs({ absolutePath: fp });
        content = res?.output ?? '';
      } else if (node.kind === 'skill' && node.meta?.skillPath) {
        const p = node.meta.skillPath;
        const res = await window.electronAPI?.shell?.readAny({
          paths: [
            `${p}/AGENTS.md`,
            `${p}/SKILL.md`,
            `${p}/skills/SKILL.md`,
            `${p}/README.md`,
          ],
        });
        content = res?.output || '_No documentation found._';
        setPanelTab('preview');
      } else if (node.kind === 'plugin') {
        content = node.meta?.description
          ? `# ${node.label}\n\n${node.meta.description}`
          : `# ${node.label}\n\n_No description available._`;
        setPanelTab('preview');
      } else if (node.kind === 'mcp') {
        const cmd = node.meta?.command ?? '';
        const args = node.meta?.args ?? '';
        content = `# ${node.label}\n\n**Command:** \`${cmd}\`\n\n**Args:** \`${args || 'none'}\``;
        setPanelTab('preview');
      }
      setPanelContent(content);
      setPanelDraft(content);
    } finally {
      setPanelLoading(false);
    }
  }, []);

  const savePanel = useCallback(async () => {
    if (!panelNode?.meta?.filePath) return;
    const fp = panelNode.meta.filePath;
    if (panelNode.kind === 'memory') {
      await window.electronAPI?.memory?.writeFile(fp, panelDraft);
    } else {
      // For instruction files (.md/.json) anywhere under $HOME. The handler
      // validates the extension allowlist + bounds the write to $HOME.
      await window.electronAPI?.shell?.writeTextFile({
        absolutePath: fp,
        content: panelDraft,
      });
    }
    setPanelContent(panelDraft);
  }, [panelNode, panelDraft]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const hit = hitTest(e.clientX - rect.left, e.clientY - rect.top);
    if (!hit) return;
    if (hit.kind === 'agent') {
      setSelectedAgentId(hit.id);
    } else if (['memory', 'instructions', 'skill', 'plugin', 'mcp'].includes(hit.kind)) {
      openPanel(hit);
    }
  }, [hitTest, openPanel]);

  const resetView = () => {
    transformRef.current = { x: 0, y: 0, scale: 1 };
    warmupRef.current = 0;
    kickSimulationRef.current();
  };

  const zoom = (factor: number) => {
    const t = transformRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.offsetWidth / 2;
    const cy = canvas.offsetHeight / 2;
    const newScale = Math.min(5, Math.max(0.15, t.scale * factor));
    transformRef.current = { scale: newScale, x: cx - (cx - t.x) * (newScale / t.scale), y: cy - (cy - t.y) * (newScale / t.scale) };
    warmupRef.current = 0;
    kickSimulationRef.current();
  };

  return (
    <div className="relative w-full h-full bg-[#0d0d14] rounded-xl overflow-hidden border border-border">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ cursor: 'grab' }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleClick}
      />

      {/* Loading overlay */}
      {(loading || graphBuilding) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] transition-opacity">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
            {graphBuilding && !loading && (
              <span className="text-[11px] text-white/50">Switching agent…</span>
            )}
          </div>
        </div>
      )}

      {/* Top controls */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        {/* Agent filter pills */}
        <div className="flex flex-wrap gap-1.5 pointer-events-auto">
          {agents.map(agent => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgentId(prev => prev === agent.id ? null : agent.id)}
              className={`px-2.5 py-1 text-[10px] font-medium rounded-full border transition-colors ${
                selectedAgentId === agent.id
                  ? 'bg-violet-500/30 border-violet-500/60 text-violet-200'
                  : 'bg-black/40 border-white/10 text-white/50 hover:text-white/80'
              }`}
            >
              {agent.name || agent.id.slice(0, 8)}
            </button>
          ))}
        </div>

        {/* Zoom + reset */}
        <div className="flex items-center gap-1 pointer-events-auto">
          <button onClick={() => zoom(1.25)} className="p-1.5 rounded-lg bg-black/50 border border-white/10 text-white/60 hover:text-white transition-colors">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => zoom(0.8)} className="p-1.5 rounded-lg bg-black/50 border border-white/10 text-white/60 hover:text-white transition-colors">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button onClick={resetView} className="p-1.5 rounded-lg bg-black/50 border border-white/10 text-white/60 hover:text-white transition-colors">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={loadData} className="p-1.5 rounded-lg bg-black/50 border border-white/10 text-white/60 hover:text-white transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 right-3">
        {legendOpen ? (
          <div className="bg-black/70 border border-white/10 rounded-xl p-3 text-[10px] text-white/70 space-y-1.5 backdrop-blur-sm min-w-[140px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/40 uppercase tracking-wider text-[9px]">Legend</span>
              <button onClick={() => setLegendOpen(false)} className="text-white/30 hover:text-white/70">✕</button>
            </div>
            {(Object.entries(KIND_COLOR) as [NodeKind, typeof KIND_COLOR[NodeKind]][]).map(([kind, c]) => (
              <div key={kind} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.fill }} />
                <span className="capitalize">{kind === 'mcp' ? 'MCP server' : kind === 'instructions' ? 'CLAUDE.md' : kind}</span>
              </div>
            ))}
            <p className="text-white/30 text-[9px] mt-2 border-t border-white/10 pt-2">Scroll to zoom · drag to pan<br/>Click agent to isolate</p>
          </div>
        ) : (
          <button
            onClick={() => setLegendOpen(true)}
            className="px-2.5 py-1 text-[10px] bg-black/50 border border-white/10 rounded-lg text-white/40 hover:text-white/70 transition-colors"
          >
            Legend
          </button>
        )}
      </div>

      {/* Node/edge count */}
      <div className="absolute bottom-3 left-3 text-[10px] text-white/25">
        {nodeCount} nodes · {edgeCount} edges
      </div>

      {/* Side panel */}
      {panelNode && (
        <div className="absolute top-0 right-0 bottom-0 w-[360px] bg-background border-l border-border flex flex-col z-20">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: KIND_COLOR[panelNode.kind].fill }}
            />
            <span className="flex-1 text-sm font-medium text-foreground truncate">{panelNode.label}</span>
            {panelNode.meta?.editable && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPanelTab('write')}
                  className={`p-1.5 rounded transition-colors ${panelTab === 'write' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  title="Edit"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPanelTab('preview')}
                  className={`p-1.5 rounded transition-colors ${panelTab === 'preview' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  title="Preview"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <button
              onClick={() => setPanelNode(null)}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {panelLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : panelNode.meta?.editable && panelTab === 'write' ? (
              <textarea
                value={panelDraft}
                onChange={e => setPanelDraft(e.target.value)}
                className="w-full h-full bg-transparent p-4 text-sm font-mono text-foreground resize-none outline-none leading-relaxed"
                spellCheck={false}
              />
            ) : (
              <div className="p-4 text-sm text-foreground">
                <SimpleMarkdown content={panelTab === 'write' ? panelContent : panelDraft} />
              </div>
            )}
          </div>

          {/* Footer — save button for editable files */}
          {panelNode.meta?.editable && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border shrink-0">
              {panelDraft !== panelContent && (
                <span className="text-[10px] text-muted-foreground">Unsaved changes</span>
              )}
              <button
                onClick={savePanel}
                disabled={panelDraft === panelContent}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-3 h-3" />
                Save
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
