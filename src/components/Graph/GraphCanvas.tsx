/**
 * Graph Canvas Component
 * Interactive D3 force-directed graph visualization
 */

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { GraphData, SimulationNode } from '../../utils/graphDataProcessor';
import {
  createForceSimulation,
  stopSimulation,
} from '../../utils/graphSimulation';
import {
  calculateAllLinkStrengths,
  getEdgeKey,
  getLinkOpacity,
} from '../../utils/graphLinkStrength';
import type { SearchResult } from '../../utils/graphSearch';
import { getSearchHighlightStyle } from '../../utils/graphSearch';

interface GraphCanvasProps {
  data: GraphData;
  onNodeClick?: (nodeId: string, nodeType: 'note' | 'tag') => void;
  onNodeDoubleClick?: (nodeId: string, nodeType: 'note' | 'tag') => void;
  focusNodeId?: string | null;
  width?: number;
  height?: number;
  /** Search result for highlighting */
  searchResult?: SearchResult | null;
  /** Whether to show link strength visualization */
  showLinkStrength?: boolean;
  /** Set of orphan node IDs */
  orphanIds?: Set<string>;
}

export function GraphCanvas({
  data,
  onNodeClick,
  onNodeDoubleClick,
  focusNodeId,
  width = 1200,
  height = 800,
  searchResult = null,
  showLinkStrength = false,
  orphanIds = new Set(),
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [isSimulating, setIsSimulating] = useState(true);
  const [dimensions, setDimensions] = useState({ width, height });

  // Update canvas dimensions dynamically from container
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        if (w > 0 && h > 0) {
          setDimensions({ width: w, height: h });
        }
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || data.nodes.length === 0) return;

    setIsSimulating(true);
    const activeWidth = dimensions.width || width;
    const activeHeight = dimensions.height || height;

    // Calculate link strengths for visualization
    const linkStrengthMap = showLinkStrength
      ? calculateAllLinkStrengths(data.edges)
      : new Map();

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    // Create container group for zoom/pan
    const g = svg.append('g');

    // Setup zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create simulation and get actual simulated nodes and links
    const simulation = createForceSimulation(data.nodes, data.edges, activeWidth, activeHeight);
    const simNodes = simulation.nodes();
    const simLinks = (simulation.force('link') as d3.ForceLink<SimulationNode, any>)?.links() || [];

    // Create arrow marker for directed edges
    svg
      .append('defs')
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 20) // Position at end of line
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', 'var(--border-light)')
      .attr('class', 'dark:fill-border-dark');

    // Create links bound to simLinks
    const link = g
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(simLinks)
      .join('line')
      .attr('stroke', (d) => {
        if (showLinkStrength) {
          const key = getEdgeKey(d.source as any, d.target as any);
          const strengthInfo = linkStrengthMap.get(key);
          if (strengthInfo?.isTagBased) {
            return 'var(--border-light)';
          }
        }
        return d.type === 'backlink' ? 'var(--accent-primary)' : 'var(--border-light)';
      })
      .attr('stroke-opacity', (d) => {
        if (showLinkStrength) {
          const key = getEdgeKey(d.source as any, d.target as any);
          const strengthInfo = linkStrengthMap.get(key);
          if (strengthInfo) {
            return getLinkOpacity(strengthInfo);
          }
        }
        return d.type === 'backlink' ? 0.6 : 0.4;
      })
      .attr('stroke-width', (d) => {
        if (showLinkStrength) {
          const key = getEdgeKey(d.source as any, d.target as any);
          const strengthInfo = linkStrengthMap.get(key);
          if (strengthInfo) {
            return strengthInfo.thickness;
          }
        }
        return d.type === 'backlink' ? 2 : 1;
      })
      .attr('stroke-dasharray', (d) => {
        if (showLinkStrength) {
          const key = getEdgeKey(d.source as any, d.target as any);
          const strengthInfo = linkStrengthMap.get(key);
          if (strengthInfo?.isDashed) {
            return '4,4';
          }
        }
        return 'none';
      })
      .attr('marker-end', (d) => (d.type === 'backlink' ? 'url(#arrowhead)' : ''))
      .attr('class', 'dark:stroke-border-dark');

    // Create node groups bound to simNodes
    const node = g
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(simNodes)
      .join('g')
      .attr('cursor', 'pointer');

    // Add drag behavior with proper typing
    const dragBehavior = d3
      .drag<SVGGElement, SimulationNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    // D3's join() returns a base Selection type; cast to the concrete element type for call()
    (node as d3.Selection<SVGGElement, SimulationNode, SVGGElement, unknown>).call(dragBehavior);

    // Add circles to nodes
    node
      .append('circle')
      .attr('r', (d) => {
        // Get search highlight style
        const highlightStyle = getSearchHighlightStyle(d.id, searchResult);

        // Make focused node larger
        if (focusNodeId && d.id === focusNodeId) {
          return d.size * 1.5;
        }

        // Apply search scaling
        return d.size * highlightStyle.scale;
      })
      .attr('fill', (d) => {
        // Highlight focused node with gold color
        if (focusNodeId && d.id === focusNodeId) {
          return '#FFD700'; // Gold
        }

        // Orphan nodes get a distinct color
        if (orphanIds.has(d.id)) {
          return 'var(--accent-primary)';
        }

        return d.color;
      })
      .attr('stroke', (d) => {
        // Focused node gets accent border
        if (focusNodeId && d.id === focusNodeId) {
          return 'var(--accent-primary)';
        }

        // Orphan nodes get warning-style border
        if (orphanIds.has(d.id)) {
          return '#f59e0b'; // Orange/amber
        }

        return 'var(--surface-light-base)';
      })
      .attr('stroke-width', (d) => {
        // Get search highlight style
        const highlightStyle = getSearchHighlightStyle(d.id, searchResult);

        // Focused node gets thicker border
        if (focusNodeId && d.id === focusNodeId) {
          return 4;
        }

        // Orphan nodes get thicker border
        if (orphanIds.has(d.id)) {
          return 3;
        }

        return highlightStyle.strokeWidth;
      })
      .attr('opacity', (d) => {
        // Get search highlight style
        const highlightStyle = getSearchHighlightStyle(d.id, searchResult);
        return highlightStyle.opacity;
      })
      .attr('class', 'dark:stroke-surface-dark-base transition-all duration-300');

    // Add labels to nodes
    node
      .append('text')
      .text((d) => d.label)
      .attr('x', 0)
      .attr('y', (d) => d.size + 15)
      .attr('text-anchor', 'middle')
      .attr('opacity', (d) => {
        // Match label opacity to node opacity from search
        const highlightStyle = getSearchHighlightStyle(d.id, searchResult);
        return highlightStyle.opacity;
      })
      .attr('class', 'text-xs fill-text-light-primary dark:fill-text-dark-primary')
      .attr('pointer-events', 'none');

    // Add tooltips to nodes (P1: Show connections and tags)
    node.append('title').text((d) => {
      const parts: string[] = [d.label];

      // Add connection count
      if (d.connections !== undefined) {
        parts.push(`${d.connections} 个关联`);
      }

      // Add primary tag (for notes)
      if (d.type === 'note' && d.metadata.tags && d.metadata.tags.length > 0) {
        parts.push(`标签: ${d.metadata.tags[0]}`);
      }

      // Add folder (for notes)
      if (d.type === 'note' && d.metadata.folder) {
        parts.push(`文件夹: ${d.metadata.folder}`);
      }

      return parts.join('\n');
    });

    // Add click handler (single-click for focus)
    node.on('click', (event, d) => {
      event.stopPropagation();
      if (onNodeClick) {
        onNodeClick(d.id, d.type);
      }
    });

    // Add double-click handler (navigate to note)
    node.on('dblclick', (event, d) => {
      event.stopPropagation();
      if (onNodeDoubleClick) {
        onNodeDoubleClick(d.id, d.type);
      }
    });

    // Add hover effect
    node.on('mouseenter', function () {
      d3.select(this).select('circle').attr('stroke-width', 3);
    });

    node.on('mouseleave', function () {
      d3.select(this).select('circle').attr('stroke-width', 2);
    });

    // Update positions on simulation tick
    // D3 replaces string IDs with actual node objects in simLinks during simulation
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => ((d as any).source?.x) ?? 0)
        .attr('y1', (d) => ((d as any).source?.y) ?? 0)
        .attr('x2', (d) => ((d as any).target?.x) ?? 0)
        .attr('y2', (d) => ((d as any).target?.y) ?? 0);

      node.attr('transform', (d) => {
        const simNode = d as SimulationNode;
        const x = simNode.x ?? 0;
        const y = simNode.y ?? 0;
        return `translate(${x},${y})`;
      });

      if (simulation.alpha() < 0.05) {
        setIsSimulating(false);
      }
    });

    // Stop simulating after it settles
    simulation.on('end', () => {
      setIsSimulating(false);
    });

    // Safety timeout to dismiss layout indicator
    const layoutTimer = setTimeout(() => {
      setIsSimulating(false);
    }, 2500);

    // Cleanup
    return () => {
      clearTimeout(layoutTimer);
      stopSimulation(simulation);
    };
  }, [data, dimensions.width, dimensions.height, onNodeClick, onNodeDoubleClick, focusNodeId, searchResult, showLinkStrength, orphanIds]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[500px]">
      {isSimulating && (
        <div className="absolute top-4 right-4 text-xs text-text-light-secondary dark:text-text-dark-secondary bg-surface-light-elevated/90 dark:bg-surface-dark-elevated/90 backdrop-blur px-2.5 py-1 rounded-md border border-border-light dark:border-border-dark shadow-sm z-10">
          正在计算图谱布局...
        </div>
      )}
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="w-full h-full border border-border-light dark:border-border-dark rounded-lg bg-surface-light-base dark:bg-surface-dark-base"
      />
    </div>
  );
}
