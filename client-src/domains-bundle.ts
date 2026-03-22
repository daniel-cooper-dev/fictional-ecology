// Re-export domain configs from the server source — esbuild bundles them inline
export { ALL_DOMAINS, DOMAIN_MAP, DOMAIN_CATEGORIES, getDomainConfig } from '../src/domains/index.js';
export type { DomainConfig, FieldDefinition, Archetype, MagicPermeationConfig } from '../src/types/domains.js';
