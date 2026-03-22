export interface Route {
  page: string;
  params: Record<string, string>;
  query: Record<string, string>;
}

const ROUTE_PATTERNS: Array<{ pattern: RegExp; page: string; paramNames: string[] }> = [
  { pattern: /^\/worlds\/new\/wizard$/, page: 'onboarding', paramNames: [] },
  { pattern: /^\/worlds\/new$/, page: 'world-new', paramNames: [] },
  { pattern: /^\/worlds\/([^/]+)\/([^/]+)\/new$/, page: 'element-new', paramNames: ['worldId', 'domainId'] },
  { pattern: /^\/worlds\/([^/]+)\/([^/]+)\/([^/]+)\/edit$/, page: 'element-edit', paramNames: ['worldId', 'domainId', 'elementId'] },
  { pattern: /^\/worlds\/([^/]+)\/([^/]+)\/([^/]+)$/, page: 'element-detail', paramNames: ['worldId', 'domainId', 'elementId'] },
  { pattern: /^\/worlds\/([^/]+)\/timeline$/, page: 'timeline', paramNames: ['worldId'] },
  { pattern: /^\/worlds\/([^/]+)\/([^/]+)$/, page: 'domain-list', paramNames: ['worldId', 'domainId'] },
  { pattern: /^\/worlds\/([^/]+)$/, page: 'world-dashboard', paramNames: ['worldId'] },
  { pattern: /^\/worlds\/?$/, page: 'home', paramNames: [] },
  { pattern: /^\/constellations\/new$/, page: 'constellation-new', paramNames: [] },
  { pattern: /^\/constellations\/([^/]+)$/, page: 'constellation-detail', paramNames: ['constellationId'] },
  { pattern: /^\/blueprints\/([^/]+)$/, page: 'blueprint-detail', paramNames: ['blueprintId'] },
  { pattern: /^\/blueprints\/?$/, page: 'blueprint-list', paramNames: [] },
  { pattern: /^\/archetypes\/?$/, page: 'archetype-search', paramNames: [] },
  { pattern: /^\/?$/, page: 'home', paramNames: [] },
];

export function parseRoute(): Route {
  const hash = location.hash.slice(1) || '/';
  const [pathPart, queryPart] = hash.split('?');
  const path = pathPart || '/';

  // Parse query string
  const query: Record<string, string> = {};
  if (queryPart) {
    for (const pair of queryPart.split('&')) {
      const [k, v] = pair.split('=');
      if (k) query[decodeURIComponent(k)] = decodeURIComponent(v || '');
    }
  }

  for (const route of ROUTE_PATTERNS) {
    const match = path.match(route.pattern);
    if (match) {
      const params: Record<string, string> = {};
      route.paramNames.forEach((name, i) => {
        params[name] = decodeURIComponent(match[i + 1]);
      });
      return { page: route.page, params, query };
    }
  }

  return { page: '404', params: {}, query };
}

export function navigate(path: string): void {
  location.hash = '#' + path;
}

export function worldUrl(worldId: string): string {
  return `#/worlds/${worldId}`;
}

export function domainUrl(worldId: string, domainId: string): string {
  return `#/worlds/${worldId}/${domainId}`;
}

export function elementUrl(worldId: string, domainId: string, elementId: string): string {
  return `#/worlds/${worldId}/${domainId}/${elementId}`;
}

export function newElementUrl(worldId: string, domainId: string, archetypeId?: string): string {
  let url = `#/worlds/${worldId}/${domainId}/new`;
  if (archetypeId) url += `?archetype=${archetypeId}`;
  return url;
}
