import * as d3 from 'd3';

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  domain: string;
  element_type: string;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  relationship_type: string;
  strength: string;
}

const container = document.getElementById('graph-container');
if (!container) throw new Error('No graph container');

const worldId = container.dataset.worldId;
let domainColors: Record<string, string> = {};

try {
  const domains = JSON.parse(container.dataset.domains || '[]');
  for (const d of domains) {
    domainColors[d.id] = d.color;
  }
} catch { /* ignore */ }

const tooltip = document.createElement('div');
tooltip.className = 'graph-tooltip';
tooltip.style.display = 'none';
container.appendChild(tooltip);

const width = container.clientWidth;
const height = container.clientHeight;

const svg = d3.select(container)
  .append('svg')
  .attr('viewBox', [0, 0, width, height])
  .attr('width', '100%')
  .attr('height', '100%');

const g = svg.append('g');

// Zoom
svg.call(d3.zoom<SVGSVGElement, unknown>()
  .scaleExtent([0.1, 4])
  .on('zoom', (event) => {
    g.attr('transform', event.transform);
  })
);

let simulation: d3.Simulation<GraphNode, GraphLink>;

async function loadGraph() {
  const checkedDomains = Array.from(
    document.querySelectorAll<HTMLInputElement>('.domain-filter:checked')
  ).map(cb => cb.value);

  const params = checkedDomains.length > 0 ? `?domains=${checkedDomains.join(',')}` : '';
  const resp = await fetch(`/worlds/${worldId}/api/graph${params}`);
  const data = await resp.json();

  renderGraph(data.nodes, data.links);
}

function renderGraph(nodes: GraphNode[], links: GraphLink[]) {
  g.selectAll('*').remove();
  container!.querySelector('.graph-loading')?.remove();

  if (nodes.length === 0) {
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#6b7084')
      .text('No elements with relationships yet. Create elements and link them.');
    return;
  }

  // Build node map for links
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const validLinks = links.filter(l => {
    const source = typeof l.source === 'string' ? l.source : (l.source as any)?.id;
    const target = typeof l.target === 'string' ? l.target : (l.target as any)?.id;
    return nodeMap.has(source) && nodeMap.has(target);
  });

  // Count connections per node
  const connectionCount = new Map<string, number>();
  for (const link of validLinks) {
    const s = typeof link.source === 'string' ? link.source : (link.source as any)?.id;
    const t = typeof link.target === 'string' ? link.target : (link.target as any)?.id;
    connectionCount.set(s, (connectionCount.get(s) || 0) + 1);
    connectionCount.set(t, (connectionCount.get(t) || 0) + 1);
  }

  simulation = d3.forceSimulation<GraphNode>(nodes)
    .force('link', d3.forceLink<GraphNode, GraphLink>(validLinks).id(d => d.id).distance(100))
    .force('charge', d3.forceManyBody().strength(-200))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(30));

  // Links
  const link = g.append('g')
    .selectAll('line')
    .data(validLinks)
    .join('line')
    .attr('class', 'graph-link')
    .attr('stroke-width', d => d.strength === 'strong' ? 2.5 : d.strength === 'weak' ? 0.5 : 1.5);

  // Nodes
  const node = g.append('g')
    .selectAll<SVGGElement, GraphNode>('g')
    .data(nodes)
    .join('g')
    .attr('class', 'graph-node')
    .call(d3.drag<SVGGElement, GraphNode>()
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
      })
    );

  node.append('circle')
    .attr('r', d => 6 + (connectionCount.get(d.id) || 0) * 2)
    .attr('fill', d => domainColors[d.domain] || '#999')
    .on('mouseover', (event, d) => {
      tooltip.style.display = 'block';
      tooltip.textContent = '';
      const nameDiv = document.createElement('div');
      nameDiv.className = 'tooltip-name';
      nameDiv.textContent = d.name;
      tooltip.appendChild(nameDiv);
      const domainDiv = document.createElement('div');
      domainDiv.className = 'tooltip-domain';
      domainDiv.textContent = d.domain.replace(/_/g, ' ') + (d.element_type ? ' / ' + d.element_type.replace(/_/g, ' ') : '');
      tooltip.appendChild(domainDiv);
    })
    .on('mousemove', (event) => {
      const rect = container!.getBoundingClientRect();
      tooltip.style.left = (event.clientX - rect.left + 12) + 'px';
      tooltip.style.top = (event.clientY - rect.top - 10) + 'px';
    })
    .on('mouseout', () => {
      tooltip.style.display = 'none';
    })
    .on('click', (_event, d) => {
      window.location.href = `/worlds/${worldId}/${d.domain}/${d.id}`;
    });

  node.append('text')
    .text(d => d.name.length > 15 ? d.name.substring(0, 14) + '...' : d.name)
    .attr('dy', d => -(10 + (connectionCount.get(d.id) || 0) * 2))
    .attr('font-size', '10px');

  simulation.on('tick', () => {
    link
      .attr('x1', d => (d.source as GraphNode).x!)
      .attr('y1', d => (d.source as GraphNode).y!)
      .attr('x2', d => (d.target as GraphNode).x!)
      .attr('y2', d => (d.target as GraphNode).y!);

    node.attr('transform', d => `translate(${d.x},${d.y})`);
  });
}

// Expose for filter controls
(window as any).updateGraph = loadGraph;

loadGraph();
