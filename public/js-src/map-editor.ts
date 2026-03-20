import * as d3 from 'd3';

interface Pin {
  id: string;
  map_id: string;
  element_id: string | null;
  x: number;
  y: number;
  label: string;
  icon: string;
  color: string;
  element_name?: string;
  element_domain?: string;
}

interface Region {
  id: string;
  map_id: string;
  points: string;
  fill_color: string;
  border_color: string;
  label: string;
}

const container = document.getElementById('map-container');
if (!container) throw new Error('No map container');

const worldId = container.dataset.worldId;
const mapId = container.dataset.mapId;
const mapWidth = parseInt(container.dataset.width || '1200');
const mapHeight = parseInt(container.dataset.height || '800');

let pins: Pin[] = [];
let regions: Region[] = [];
let currentTool = 'select';
let regionPoints: [number, number][] = [];

try { pins = JSON.parse(container.dataset.pins || '[]'); } catch {}
try { regions = JSON.parse(container.dataset.regions || '[]'); } catch {}

const tooltip = document.createElement('div');
tooltip.className = 'graph-tooltip';
tooltip.style.display = 'none';
container.appendChild(tooltip);

container.querySelector('.graph-loading')?.remove();

const svg = d3.select(container)
  .append('svg')
  .attr('viewBox', `0 0 ${mapWidth} ${mapHeight}`)
  .attr('width', '100%')
  .attr('height', '100%')
  .style('background', '#1a1d27');

const mainG = svg.append('g');

// Zoom
svg.call(d3.zoom<SVGSVGElement, unknown>()
  .scaleExtent([0.2, 5])
  .on('zoom', (event) => {
    mainG.attr('transform', event.transform);
  })
);

// Grid
const gridG = mainG.append('g').attr('class', 'map-grid');
const gridSize = 50;
for (let x = 0; x <= mapWidth; x += gridSize) {
  gridG.append('line')
    .attr('x1', x).attr('y1', 0).attr('x2', x).attr('y2', mapHeight)
    .attr('stroke', '#2d3148').attr('stroke-width', 0.5);
}
for (let y = 0; y <= mapHeight; y += gridSize) {
  gridG.append('line')
    .attr('x1', 0).attr('y1', y).attr('x2', mapWidth).attr('y2', y)
    .attr('stroke', '#2d3148').attr('stroke-width', 0.5);
}

// Regions layer
const regionsG = mainG.append('g').attr('class', 'regions-layer');

// Pins layer
const pinsG = mainG.append('g').attr('class', 'pins-layer');

// Temporary region drawing layer
const drawG = mainG.append('g').attr('class', 'draw-layer');

function renderRegions() {
  regionsG.selectAll('*').remove();
  for (const region of regions) {
    let pts: [number, number][] = [];
    try { pts = JSON.parse(region.points); } catch {}
    if (pts.length < 3) continue;

    const path = d3.line()(pts);
    if (!path) continue;

    regionsG.append('path')
      .attr('d', path + 'Z')
      .attr('fill', region.fill_color)
      .attr('stroke', region.border_color)
      .attr('stroke-width', 2);

    // Region label at centroid
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    if (region.label) {
      regionsG.append('text')
        .attr('x', cx).attr('y', cy)
        .attr('text-anchor', 'middle')
        .attr('fill', region.border_color)
        .style('font-size', '14px')
        .style('font-weight', '600')
        .text(region.label);
    }
  }
}

function renderPins() {
  pinsG.selectAll('*').remove();
  const pinGroups = pinsG.selectAll('g')
    .data(pins)
    .join('g')
    .attr('transform', (d: Pin) => `translate(${d.x * mapWidth},${d.y * mapHeight})`);

  // Pin circle
  pinGroups.append('circle')
    .attr('r', 8)
    .attr('fill', (d: Pin) => d.color)
    .attr('stroke', '#0f1117')
    .attr('stroke-width', 2)
    .style('cursor', currentTool === 'select' ? 'grab' : 'default');

  // Pin label
  pinGroups.append('text')
    .attr('y', -14)
    .attr('text-anchor', 'middle')
    .attr('fill', '#e4e6ed')
    .style('font-size', '11px')
    .style('font-weight', '500')
    .text((d: Pin) => d.label || d.element_name || '');

  // Hover tooltip
  pinGroups.on('mouseover', (event: MouseEvent, d: Pin) => {
    tooltip.style.display = 'block';
    tooltip.textContent = '';
    const nameDiv = document.createElement('div');
    nameDiv.className = 'tooltip-name';
    nameDiv.textContent = d.label || d.element_name || 'Pin';
    tooltip.appendChild(nameDiv);
    if (d.element_domain) {
      const domainDiv = document.createElement('div');
      domainDiv.className = 'tooltip-domain';
      domainDiv.textContent = d.element_domain.replace(/_/g, ' ');
      tooltip.appendChild(domainDiv);
    }
  }).on('mousemove', (event: MouseEvent) => {
    const rect = container!.getBoundingClientRect();
    tooltip.style.left = (event.clientX - rect.left + 12) + 'px';
    tooltip.style.top = (event.clientY - rect.top - 10) + 'px';
  }).on('mouseout', () => {
    tooltip.style.display = 'none';
  });

  // Drag pins in select mode
  if (currentTool === 'select') {
    pinGroups.call(d3.drag<SVGGElement, Pin>()
      .on('drag', (event, d) => {
        const newX = (event.x) / mapWidth;
        const newY = (event.y) / mapHeight;
        d.x = Math.max(0, Math.min(1, newX));
        d.y = Math.max(0, Math.min(1, newY));
        d3.select(event.sourceEvent.target.parentNode)
          .attr('transform', `translate(${d.x * mapWidth},${d.y * mapHeight})`);
      })
      .on('end', (_event, d) => {
        fetch(`/worlds/${worldId}/maps/${mapId}/pins/${d.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ x: d.x, y: d.y, label: d.label, color: d.color }),
        });
      })
    );
  }
}

// Click handler for placing pins
svg.on('click', (event: MouseEvent) => {
  if (currentTool === 'pin') {
    const transform = d3.zoomTransform(svg.node()!);
    const [mx, my] = d3.pointer(event);
    const x = (transform.invertX(mx)) / mapWidth;
    const y = (transform.invertY(my)) / mapHeight;

    const label = prompt('Pin label:') || '';
    const color = '#ffffff';

    fetch(`/worlds/${worldId}/maps/${mapId}/pins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ x, y, label, color }),
    }).then(r => r.json()).then(pin => {
      pins.push(pin);
      renderPins();
    });
  } else if (currentTool === 'region') {
    const transform = d3.zoomTransform(svg.node()!);
    const [mx, my] = d3.pointer(event);
    const px = transform.invertX(mx);
    const py = transform.invertY(my);
    regionPoints.push([px, py]);

    // Draw preview
    drawG.selectAll('*').remove();
    if (regionPoints.length > 1) {
      const path = d3.line()(regionPoints);
      drawG.append('path')
        .attr('d', path!)
        .attr('fill', 'rgba(100,100,255,0.2)')
        .attr('stroke', '#6464ff')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');
    }
    for (const pt of regionPoints) {
      drawG.append('circle')
        .attr('cx', pt[0]).attr('cy', pt[1])
        .attr('r', 4).attr('fill', '#6464ff');
    }
  }
});

// Double-click to finish region
svg.on('dblclick', (event: MouseEvent) => {
  if (currentTool === 'region' && regionPoints.length >= 3) {
    event.preventDefault();
    const label = prompt('Region label:') || '';

    fetch(`/worlds/${worldId}/maps/${mapId}/regions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ points: regionPoints, label, fill_color: 'rgba(100,100,255,0.2)', border_color: '#6464ff' }),
    }).then(r => r.json()).then(region => {
      regions.push(region);
      regionPoints = [];
      drawG.selectAll('*').remove();
      renderRegions();
    });
  }
});

// Tool buttons
document.querySelectorAll('.map-tool').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.map-tool').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTool = (btn as HTMLElement).dataset.tool || 'select';
    regionPoints = [];
    drawG.selectAll('*').remove();
    renderPins(); // re-render to update cursor
  });
});

renderRegions();
renderPins();
