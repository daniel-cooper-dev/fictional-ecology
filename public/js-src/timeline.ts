import * as d3 from 'd3';

interface Era {
  id: string;
  name: string;
  start_year: number;
  end_year: number | null;
  color: string;
  description: string;
}

interface HistoricalEvent {
  id: string;
  name: string;
  summary: string;
  year_in_world: string;
  event_type: string;
  era_id: string;
}

const container = document.getElementById('timeline-container');
if (!container) throw new Error('No timeline container');

const worldId = container.dataset.worldId;
const margin = { top: 40, right: 30, bottom: 40, left: 30 };
const width = container.clientWidth - margin.left - margin.right;
const height = Math.max(400, container.clientHeight - margin.top - margin.bottom);

const svg = d3.select(container)
  .append('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom);

const g = svg.append('g')
  .attr('transform', `translate(${margin.left},${margin.top})`);

const tooltip = document.createElement('div');
tooltip.className = 'graph-tooltip';
tooltip.style.display = 'none';
container.appendChild(tooltip);

async function loadTimeline() {
  container!.querySelector('.graph-loading')?.remove();

  const resp = await fetch(`/worlds/${worldId}/api/timeline`);
  const data = await resp.json();

  if (data.eras.length === 0 && data.events.length === 0) {
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#6b7084')
      .text('Add eras and historical events to see them on the timeline.');
    return;
  }

  // Determine time range
  const allYears: number[] = [];
  for (const era of data.eras) {
    allYears.push(era.start_year);
    if (era.end_year != null) allYears.push(era.end_year);
  }
  for (const event of data.events) {
    const y = parseInt(event.year_in_world);
    if (!isNaN(y)) allYears.push(y);
  }

  if (allYears.length === 0) {
    g.append('text')
      .attr('x', width / 2).attr('y', height / 2)
      .attr('text-anchor', 'middle').attr('fill', '#6b7084')
      .text('No dated content yet.');
    return;
  }

  const minYear = d3.min(allYears)! - 10;
  const maxYear = d3.max(allYears)! + 10;

  const x = d3.scaleLinear()
    .domain([minYear, maxYear])
    .range([0, width]);

  // X axis
  const xAxis = d3.axisBottom(x).tickFormat(d => String(d));
  g.append('g')
    .attr('transform', `translate(0,${height - 20})`)
    .call(xAxis)
    .selectAll('text')
    .attr('fill', '#9ca0ad')
    .style('font-size', '10px');

  g.selectAll('.domain, .tick line').attr('stroke', '#2d3148');

  // Draw eras as colored bands
  const eraHeight = 50;
  g.selectAll('.era-band')
    .data(data.eras)
    .join('rect')
    .attr('class', 'era-band')
    .attr('x', (d: Era) => x(d.start_year))
    .attr('y', 20)
    .attr('width', (d: Era) => {
      const end = d.end_year != null ? d.end_year : maxYear;
      return Math.max(2, x(end) - x(d.start_year));
    })
    .attr('height', eraHeight)
    .attr('fill', (d: Era) => d.color + '33')
    .attr('stroke', (d: Era) => d.color)
    .attr('stroke-width', 1)
    .attr('rx', 4);

  // Era labels
  g.selectAll('.era-label')
    .data(data.eras)
    .join('text')
    .attr('class', 'era-label')
    .attr('x', (d: Era) => {
      const end = d.end_year != null ? d.end_year : maxYear;
      return x(d.start_year) + (x(end) - x(d.start_year)) / 2;
    })
    .attr('y', 20 + eraHeight / 2)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'central')
    .attr('fill', (d: Era) => d.color)
    .style('font-size', '11px')
    .style('font-weight', '600')
    .text((d: Era) => d.name);

  // Draw events as dots
  const eventY = eraHeight + 50;
  const eventRadius = 6;

  g.selectAll('.event-dot')
    .data(data.events.filter((e: HistoricalEvent) => {
      const y = parseInt(e.year_in_world);
      return !isNaN(y);
    }))
    .join('circle')
    .attr('class', 'event-dot')
    .attr('cx', (d: HistoricalEvent) => x(parseInt(d.year_in_world)))
    .attr('cy', (d: HistoricalEvent, i: number) => eventY + (i % 5) * 25)
    .attr('r', eventRadius)
    .attr('fill', '#6c5ce7')
    .attr('stroke', '#0f1117')
    .attr('stroke-width', 2)
    .style('cursor', 'pointer')
    .on('mouseover', (event: MouseEvent, d: HistoricalEvent) => {
      tooltip.style.display = 'block';
      tooltip.textContent = '';
      const nameDiv = document.createElement('div');
      nameDiv.className = 'tooltip-name';
      nameDiv.textContent = d.name;
      tooltip.appendChild(nameDiv);
      const domainDiv = document.createElement('div');
      domainDiv.className = 'tooltip-domain';
      domainDiv.textContent = 'Year ' + d.year_in_world + (d.event_type ? ' - ' + d.event_type.replace(/_/g, ' ') : '');
      tooltip.appendChild(domainDiv);
      if (d.summary) {
        const summaryDiv = document.createElement('div');
        summaryDiv.style.cssText = 'margin-top:4px;font-size:0.7rem;color:#9ca0ad';
        summaryDiv.textContent = d.summary.substring(0, 100);
        tooltip.appendChild(summaryDiv);
      }
    })
    .on('mousemove', (event: MouseEvent) => {
      const rect = container!.getBoundingClientRect();
      tooltip.style.left = (event.clientX - rect.left + 12) + 'px';
      tooltip.style.top = (event.clientY - rect.top - 10) + 'px';
    })
    .on('mouseout', () => {
      tooltip.style.display = 'none';
    })
    .on('click', (_event: MouseEvent, d: HistoricalEvent) => {
      window.location.href = `/worlds/${worldId}/history/${d.id}`;
    });

  // Event labels
  g.selectAll('.event-label')
    .data(data.events.filter((e: HistoricalEvent) => !isNaN(parseInt(e.year_in_world))))
    .join('text')
    .attr('class', 'event-label')
    .attr('x', (d: HistoricalEvent) => x(parseInt(d.year_in_world)))
    .attr('y', (d: HistoricalEvent, i: number) => eventY + (i % 5) * 25 - eventRadius - 4)
    .attr('text-anchor', 'middle')
    .attr('fill', '#9ca0ad')
    .style('font-size', '9px')
    .text((d: HistoricalEvent) => d.name.length > 12 ? d.name.substring(0, 11) + '...' : d.name);
}

loadTimeline();
