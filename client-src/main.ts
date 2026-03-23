import { store } from './store.js';
import { parseRoute, navigate } from './router.js';
import { ALL_DOMAINS, DOMAIN_CATEGORIES, getDomainConfig } from './domains-bundle.js';
import { ALL_BLUEPRINTS, BLUEPRINT_TAGS, getBlueprint } from './blueprints-bundle.js';
import { getPairs } from './blueprints-bundle.js';
import type { DomainConfig, Archetype } from './domains-bundle.js';

// Make everything available to Alpine.js templates via window
declare global {
  interface Window {
    store: typeof store;
    navigate: typeof navigate;
    parseRoute: typeof parseRoute;
    ALL_DOMAINS: typeof ALL_DOMAINS;
    DOMAIN_CATEGORIES: typeof DOMAIN_CATEGORIES;
    getDomainConfig: typeof getDomainConfig;
    ALL_BLUEPRINTS: typeof ALL_BLUEPRINTS;
    BLUEPRINT_TAGS: typeof BLUEPRINT_TAGS;
    getBlueprint: typeof getBlueprint;
    getPairs: typeof getPairs;
    app: any;
    downloadJSON: (data: any, filename: string) => void;
    handleFileUpload: (event: Event) => void;
    RELATIONSHIP_TYPES: string[];
    formatFieldName: (name: string) => string;
    truncate: (str: string, len: number) => string;
    relativeTime: (dateStr: string) => string;
    parseProps: (el: any) => Record<string, any>;
  }
}

window.store = store;
window.navigate = navigate;
window.parseRoute = parseRoute;
window.ALL_DOMAINS = ALL_DOMAINS;
window.DOMAIN_CATEGORIES = DOMAIN_CATEGORIES;
window.getDomainConfig = getDomainConfig;
window.ALL_BLUEPRINTS = ALL_BLUEPRINTS;
window.BLUEPRINT_TAGS = BLUEPRINT_TAGS;
window.getBlueprint = getBlueprint;
window.getPairs = getPairs;

window.RELATIONSHIP_TYPES = [
  'contains', 'located_in', 'borders', 'influences', 'depends_on',
  'evolved_from', 'created_by', 'trades_with', 'conflicts_with',
  'allied_with', 'worships', 'uses', 'consumes', 'produces',
  'part_of', 'variant_of', 'powers', 'inhibits', 'custom',
];

window.formatFieldName = (name: string) => {
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

window.truncate = (str: string, len: number) => {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
};

window.relativeTime = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

window.parseProps = (el: any) => {
  if (!el || !el.properties) return {};
  try {
    return typeof el.properties === 'string' ? JSON.parse(el.properties) : el.properties;
  } catch { return {}; }
};

window.downloadJSON = (data: any, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

window.handleFileUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const json = JSON.parse(e.target?.result as string);
      if (!json.version || !json.type) {
        alert('Invalid file format. Expected a Worldwright export file.');
        return;
      }
      const result = store.importData(json);
      const worldCount = result.worldIds.length;
      const msg = result.constellationId
        ? `Imported constellation with ${worldCount} world${worldCount !== 1 ? 's' : ''}.`
        : `Imported ${worldCount} world${worldCount !== 1 ? 's' : ''}.`;
      alert(msg);
      navigate('/worlds');
      // Force Alpine to re-render
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    } catch (err) {
      alert('Error importing file: ' + (err as Error).message);
    }
  };
  reader.readAsText(file);
  // Reset input so the same file can be re-uploaded
  input.value = '';
};

// Initialize the Alpine.js app store
document.addEventListener('alpine:init', () => {
  const Alpine = (window as any).Alpine;

  Alpine.store('app', {
    route: parseRoute(),

    init() {
      window.addEventListener('hashchange', () => {
        this.route = parseRoute();
      });
    },

    get page() { return this.route.page; },
    get params() { return this.route.params; },
    get query() { return this.route.query; },
  });
});

console.log(`Worldwright (Client) — ${ALL_DOMAINS.length} domains, ${ALL_BLUEPRINTS.length} blueprints, ${ALL_DOMAINS.reduce((s, d) => s + (d.archetypes?.length || 0), 0)} archetypes`);
