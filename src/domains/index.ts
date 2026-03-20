import type { DomainConfig } from '../types/domains.js';
import { cosmologyConfig } from './cosmology.js';
import { geologyConfig } from './geology.js';
import { hydrologyConfig } from './hydrology.js';
import { atmosphereConfig } from './atmosphere.js';
import { climateConfig } from './climate.js';
import { biomesConfig } from './biomes.js';
import { floraConfig } from './flora.js';
import { faunaConfig } from './fauna.js';
import { ecosystemsConfig } from './ecosystems.js';
import { sentientSpeciesConfig } from './sentient-species.js';
import { civilizationsConfig } from './civilizations.js';
import { culturesConfig } from './cultures.js';
import { magicSystemsConfig } from './magic-systems.js';
import { planarSystemsConfig } from './planar-systems.js';
import { arcaneSciencesConfig } from './arcane-sciences.js';
import { magicEcologyConfig } from './magic-ecology.js';
import { magicEconomyConfig } from './magic-economy.js';
import { historyConfig } from './history.js';
import { geographyConfig } from './geography.js';
import { customConfig } from './custom.js';

export const ALL_DOMAINS: DomainConfig[] = [
  cosmologyConfig,
  geologyConfig,
  hydrologyConfig,
  atmosphereConfig,
  climateConfig,
  biomesConfig,
  floraConfig,
  faunaConfig,
  ecosystemsConfig,
  sentientSpeciesConfig,
  civilizationsConfig,
  culturesConfig,
  magicSystemsConfig,
  planarSystemsConfig,
  arcaneSciencesConfig,
  magicEcologyConfig,
  magicEconomyConfig,
  historyConfig,
  geographyConfig,
  customConfig,
];

export const DOMAIN_MAP = new Map<string, DomainConfig>(
  ALL_DOMAINS.map(d => [d.id, d])
);

export const DOMAIN_CATEGORIES = {
  natural: ALL_DOMAINS.filter(d => d.category === 'natural'),
  sentient: ALL_DOMAINS.filter(d => d.category === 'sentient'),
  magic: ALL_DOMAINS.filter(d => d.category === 'magic'),
  meta: ALL_DOMAINS.filter(d => d.category === 'meta'),
};

export function getDomainConfig(id: string): DomainConfig | undefined {
  return DOMAIN_MAP.get(id);
}
