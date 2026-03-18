import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { KnowledgeGraph } from '../types';
import { Loader2 } from 'lucide-react';

interface KnowledgeMapProps {
  graph: KnowledgeGraph | null;
  loading: boolean;
  onNodeClick: (nodeId: string) => void;
}

export default function KnowledgeMap({ graph, loading, onNodeClick }: KnowledgeMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!graph || !svgRef.current) return;

    const width = 384; // 96 * 4 (w-96)
    const height = 600;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous

    const simulation = d3.forceSimulation(graph.nodes as any)
      .force('link', d3.forceLink(graph.links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(40));

    // Define arrow markers for links
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#86868B')
      .style('stroke', 'none');

    const link = svg.append('g')
      .selectAll('line')
      .data(graph.links)
      .enter().append('line')
      .attr('stroke', '#E5E5EA')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrowhead)');

    const linkLabels = svg.append('g')
      .selectAll('text')
      .data(graph.links)
      .enter().append('text')
      .attr('font-size', '10px')
      .attr('fill', '#86868B')
      .attr('text-anchor', 'middle')
      .text((d: any) => d.label);

    const node = svg.append('g')
      .selectAll('g')
      .data(graph.nodes)
      .enter().append('g')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any)
      .on('click', (event, d: any) => onNodeClick(d.id));

    node.append('circle')
      .attr('r', 8)
      .attr('fill', '#007AFF')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');

    node.append('text')
      .attr('dx', 12)
      .attr('dy', 4)
      .text((d: any) => d.label)
      .attr('font-size', '12px')
      .attr('font-family', 'Inter, sans-serif')
      .attr('fill', '#1D1D1F')
      .style('pointer-events', 'none');

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      linkLabels
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [graph, onNodeClick]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[#86868B]">
        <Loader2 size={32} className="animate-spin mb-4" />
        <p className="text-sm font-medium">Generating Knowledge Map...</p>
      </div>
    );
  }

  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[#86868B] text-sm">
        No knowledge map available for this chapter.
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white overflow-hidden">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
}
