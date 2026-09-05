/**
 * Graph View Page
 * Visual network of notes and their connections
 */

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GraphCanvas } from '../components/Graph/GraphCanvas';
import { GraphSearch } from '../components/Graph/GraphSearch';
import { OrphanPanel } from '../components/Graph/OrphanPanel';
import { LinkStrengthLegend } from '../components/Graph/LinkStrengthLegend';
import { useNotesStore } from '../stores/useNotesStore';
import { buildGraphData, type GraphFilters, getUniqueTags, getColorGroups } from '../utils/graphDataProcessor';
import { searchGraphNodes, type SearchResult } from '../utils/graphSearch';
import { getOrphansWithSuggestions, detectOrphans } from '../utils/graphOrphanDetection';
import type { GraphSearchFilters } from '../types/graph';
import { Target, X, Palette, AlertCircle } from 'lucide-react';
import { PageContent } from '../components/PageContent';

export default function GraphView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const notes = useNotesStore((state) => state.notes);
  const updateNote = useNotesStore((state) => state.updateNote);
  const addTag = useNotesStore((state) => state.addTag);

  const [hideOrphans, setHideOrphans] = useState(false);
  const [colorBy, setColorBy] = useState<'none' | 'folder' | 'tag'>('none'); // P1: Color grouping
  const [sizeByConnections, setSizeByConnections] = useState(true); // P1: Node sizing

  // P2: New state for advanced features
  const [showLinkStrength, setShowLinkStrength] = useState(true); // P2: Link strength visualization
  const [graphSearchFilters, setGraphSearchFilters] = useState<GraphSearchFilters>({}); // P2: Graph search
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null); // P2: Search results
  const [showOrphanPanel, setShowOrphanPanel] = useState(false); // P2: Orphan panel

  // Focus mode state
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const [focusDepth, setFocusDepth] = useState(2); // Default 2 hops

  // Get available tags
  const availableTags = useMemo(() => getUniqueTags(notes), [notes]);

  // Persist visual settings to localStorage
  useEffect(() => {
    localStorage.setItem('graph-visual-settings', JSON.stringify({
      colorBy,
      sizeByConnections,
    }));
  }, [colorBy, sizeByConnections]);

  // Restore visual settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('graph-visual-settings');
    if (saved) {
      try {
        const { colorBy: savedColorBy, sizeByConnections: savedSizing } = JSON.parse(saved);
        if (savedColorBy) setColorBy(savedColorBy);
        if (typeof savedSizing === 'boolean') setSizeByConnections(savedSizing);
      } catch (error) {
        // Invalid JSON, ignore
      }
    }
  }, []);

  // URL param support for focus mode
  useEffect(() => {
    const focusParam = searchParams.get('focus');
    if (focusParam && notes[focusParam]) {
      setFocusNodeId(focusParam);
    }
  }, [searchParams, notes]);

  // Persist focus state to localStorage
  useEffect(() => {
    if (focusNodeId) {
      localStorage.setItem('graph-focus', JSON.stringify({ nodeId: focusNodeId, depth: focusDepth }));
    } else {
      localStorage.removeItem('graph-focus');
    }
  }, [focusNodeId, focusDepth]);

  // Restore focus from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('graph-focus');
    if (saved && !searchParams.get('focus')) {
      try {
        const { nodeId, depth } = JSON.parse(saved);
        if (notes[nodeId]) {
          setFocusNodeId(nodeId);
          setFocusDepth(depth);
        } else {
          // Note was deleted, clear saved focus
          localStorage.removeItem('graph-focus');
        }
      } catch (error) {
        localStorage.removeItem('graph-focus');
      }
    }
  }, [notes, searchParams]);

  // Build graph data with filters
  const graphData = useMemo(() => {
    const filters: GraphFilters = {
      hideOrphans,
      focusNodeId: focusNodeId || undefined,
      focusDepth: focusNodeId ? focusDepth : undefined,
      colorBy, // P1: Color grouping
      sizeByConnections, // P1: Node sizing
    };
    return buildGraphData(notes, filters);
  }, [notes, hideOrphans, focusNodeId, focusDepth, colorBy, sizeByConnections]);

  // P1: Get color groups for legend
  const colorGroups = useMemo(() => getColorGroups(graphData, colorBy), [graphData, colorBy]);

  // P2: Detect orphan nodes
  const orphanIds = useMemo(() => {
    return detectOrphans(graphData.nodes, graphData.edges);
  }, [graphData]);

  // P2: Get orphan nodes with suggestions
  const orphanNodes = useMemo(() => {
    if (!showOrphanPanel) return [];
    return getOrphansWithSuggestions(graphData.nodes, graphData.edges, notes);
  }, [graphData, notes, showOrphanPanel]);

  // P2: Perform graph search when filters change
  useEffect(() => {
    if (Object.keys(graphSearchFilters).length === 0) {
      setSearchResult(null);
      return;
    }

    const result = searchGraphNodes(
      graphData.nodes,
      graphData.edges,
      graphSearchFilters
    );
    setSearchResult(result);
  }, [graphData, graphSearchFilters]);

  // Handle node click - focus on node
  const handleNodeClick = useCallback((nodeId: string, nodeType: 'note' | 'tag') => {
    if (nodeType === 'note') {
      setFocusNodeId(nodeId);
      setSearchParams({ focus: nodeId });
    }
  }, [setSearchParams]);

  // Handle node double-click - navigate to note
  const handleNodeDoubleClick = useCallback((nodeId: string, nodeType: 'note' | 'tag') => {
    if (nodeType === 'note') {
      navigate(`/notes?note=${nodeId}`);
    }
  }, [navigate]);

  // Reset focus mode
  const resetFocus = () => {
    setFocusNodeId(null);
    setSearchParams({});
  };

  // P2: Handle creating link from orphan panel
  const handleCreateLink = (orphanId: string, targetId: string) => {
    const orphanNote = notes[orphanId];
    const targetNote = notes[targetId];

    if (!orphanNote || !targetNote) return;

    // Add the target note to the orphan's linkedNotes
    const currentLinkedNotes = orphanNote.linkedNotes || [];
    if (!currentLinkedNotes.includes(targetId)) {
      updateNote(orphanId, {
        linkedNotes: [...currentLinkedNotes, targetId],
        content: orphanNote.content + `\n\n[[${targetNote.title}]]`,
      });
    }
  };

  // P2: Handle adding tag from orphan panel
  const handleAddTag = (orphanId: string, tag: string) => {
    addTag(orphanId, tag);
  };

  // P2: Handle focusing orphan from panel
  const handleFocusOrphan = (nodeId: string) => {
    setFocusNodeId(nodeId);
    setSearchParams({ focus: nodeId });
  };

  // Check if empty
  const hasNotes = Object.keys(notes).length > 0;

  return (
    <PageContent page="graph" variant="full-height">
      <div className="flex-1 flex flex-row overflow-hidden">
        {/* Main graph area */}
        <div className="flex-1 flex flex-col p-6 gap-4 overflow-hidden">
        {/* Focus Mode Banner */}
        {focusNodeId && notes[focusNodeId] && (
          <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 rounded-lg border border-accent-primary/20">
            <Target className="w-4 h-4 text-accent-primary flex-shrink-0" />
            <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
              聚焦节点：{notes[focusNodeId]?.title}
            </span>

            <div className="flex items-center gap-2 ml-auto">
              <label className="flex items-center gap-2">
                <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary whitespace-nowrap">
                  关联深度：
                </span>
                <input
                  type="range"
                  min="1"
                  max="3"
                  value={focusDepth}
                  onChange={(e) => setFocusDepth(parseInt(e.target.value))}
                  className="w-20 accent-accent-primary"
                />
                <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary w-14">
                  {focusDepth} 层关联
                </span>
              </label>

              <button
                onClick={resetFocus}
                className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary transition-colors"
              >
                <X className="w-3 h-3" />
                重置
              </button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col gap-3">
          {/* Row 1: Graph Search Component (P2) */}
          <GraphSearch
            availableTags={availableTags}
            filters={graphSearchFilters}
            onFiltersChange={setGraphSearchFilters}
            resultCount={searchResult?.matchCount}
          />

          {/* Row 2: Visual Controls and Hide Orphans */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Link Strength Toggle (P2) */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showLinkStrength}
                onChange={(e) => setShowLinkStrength(e.target.checked)}
                className="w-4 h-4 rounded border-border-light dark:border-border-dark text-accent-purple focus:ring-accent-purple"
              />
              <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                显示关联强度
              </span>
            </label>

            {/* Hide Orphans Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hideOrphans}
                onChange={(e) => setHideOrphans(e.target.checked)}
                className="w-4 h-4 rounded border-border-light dark:border-border-dark text-accent-primary focus:ring-accent-primary"
              />
              <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                隐藏孤立节点
              </span>
            </label>

            {/* Orphan Panel Toggle (P2) */}
            <button
              onClick={() => setShowOrphanPanel(!showOrphanPanel)}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                showOrphanPanel
                  ? 'bg-accent-primary text-white'
                  : 'bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary border border-border-light dark:border-border-dark hover:border-accent-primary'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              <span>孤立节点 ({orphanIds.size})</span>
            </button>

            {/* P1: Color Grouping */}
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-text-light-tertiary dark:text-text-dark-tertiary" />
              <select
                value={colorBy}
                onChange={(e) => setColorBy(e.target.value as 'none' | 'folder' | 'tag')}
                className="px-3 py-1.5 text-sm rounded-lg border border-border-light dark:border-border-dark bg-surface-light-base dark:bg-surface-dark-base text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              >
                <option value="none">默认配色</option>
                <option value="folder">按文件夹着色</option>
                <option value="tag">按标签着色</option>
              </select>
            </div>

            {/* P1: Node Sizing Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sizeByConnections}
                onChange={(e) => setSizeByConnections(e.target.checked)}
                className="w-4 h-4 rounded border-border-light dark:border-border-dark text-accent-primary focus:ring-accent-primary"
              />
              <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                按连接数调整大小
              </span>
            </label>

            {/* Stats */}
            <div className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary ml-auto">
              {graphData.nodes.length} 个节点 · {graphData.edges.length} 条关联
            </div>
          </div>
        </div>

        {/* Graph or Empty State */}
        {!hasNotes ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-text-light-secondary dark:text-text-dark-secondary mb-2">
                暂无笔记
              </p>
              <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
                创建包含双向链接或标签的笔记，即可在此生成知识网络图谱
              </p>
            </div>
          </div>
        ) : graphData.nodes.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-text-light-secondary dark:text-text-dark-secondary mb-2">
                未找到匹配当前筛选条件的节点
              </p>
              <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
                请尝试调整搜索条件或取消勾选隐藏孤立节点
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <GraphCanvas
              data={graphData}
              onNodeClick={handleNodeClick}
              onNodeDoubleClick={handleNodeDoubleClick}
              focusNodeId={focusNodeId}
              searchResult={searchResult}
              showLinkStrength={showLinkStrength}
              orphanIds={orphanIds}
            />
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-6 text-xs text-text-light-tertiary dark:text-text-dark-tertiary flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[var(--accent-primary)]" />
              <span>笔记</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[var(--accent-secondary)]" />
              <span>标签</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[var(--accent-secondary)] border-2 border-accent-orange" />
              <span>孤立节点</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-[var(--accent-primary)]" />
              <span>双向链接</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-[var(--border-light)] dark:bg-[var(--border-dark)]" />
              <span>标签关联</span>
            </div>
          </div>

          {/* P2: Link Strength Legend */}
          <LinkStrengthLegend enabled={showLinkStrength} />

          {/* P1: Color Groups Legend */}
          {colorBy !== 'none' && colorGroups.size > 0 && (
            <div className="flex items-center gap-4 text-xs text-text-light-tertiary dark:text-text-dark-tertiary flex-wrap">
              <span className="font-medium">{colorBy === 'folder' ? '文件夹：' : '标签：'}</span>
              {Array.from(colorGroups.entries()).map(([name, { color, count }]) => (
                <div key={name} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  <span>{name === 'root' ? '根目录' : name}</span>
                  <span className="opacity-60">({count})</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
          <span className="font-medium">提示：</span>拖动节点可调整位置 · 鼠标滚轮缩放 · 单击聚焦 · 双击打开笔记
        </div>
        </div>

        {/* P2: Orphan Panel (Sidebar) */}
        {showOrphanPanel && (
          <OrphanPanel
            orphans={orphanNodes}
            onFocusOrphan={handleFocusOrphan}
            onCreateLink={handleCreateLink}
            onAddTag={handleAddTag}
            onClose={() => setShowOrphanPanel(false)}
          />
        )}
      </div>
    </PageContent>
  );
}
