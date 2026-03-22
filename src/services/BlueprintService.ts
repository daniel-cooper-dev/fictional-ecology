import { ALL_BLUEPRINTS, getBlueprint, BLUEPRINT_TAGS } from '../blueprints/index.js';
import { getDomainConfig } from '../domains/index.js';
import type { WorldBlueprint, BlueprintSuggestion } from '../types/index.js';
import type { Archetype } from '../types/domains.js';

export interface ResolvedSuggestion extends BlueprintSuggestion {
  domainName: string;
  domainIcon: string;
  domainColor: string;
  archetype: Archetype | null;
}

export interface ResolvedBlueprint extends WorldBlueprint {
  resolvedSuggestions: ResolvedSuggestion[];
}

export class BlueprintService {
  list(): WorldBlueprint[] {
    return ALL_BLUEPRINTS;
  }

  get(id: string): WorldBlueprint | undefined {
    return getBlueprint(id);
  }

  getTags(): string[] {
    return BLUEPRINT_TAGS;
  }

  filterByTag(tag: string): WorldBlueprint[] {
    return ALL_BLUEPRINTS.filter(b => b.tags.includes(tag));
  }

  filterByMagic(magic: boolean): WorldBlueprint[] {
    return ALL_BLUEPRINTS.filter(b => b.magic === magic);
  }

  resolve(blueprint: WorldBlueprint): ResolvedBlueprint {
    const resolvedSuggestions = blueprint.suggestions.map(s => {
      const domainConfig = getDomainConfig(s.domain);
      let archetype: Archetype | null = null;
      if (domainConfig?.archetypes) {
        archetype = domainConfig.archetypes.find(a => a.id === s.archetypeId) || null;
      }
      return {
        ...s,
        domainName: domainConfig?.name || s.domain,
        domainIcon: domainConfig?.icon || 'circle',
        domainColor: domainConfig?.color || '#999',
        archetype,
      };
    });

    return { ...blueprint, resolvedSuggestions };
  }

  getResolved(id: string): ResolvedBlueprint | undefined {
    const blueprint = this.get(id);
    if (!blueprint) return undefined;
    return this.resolve(blueprint);
  }

  getSuggestionsByDomain(blueprintId: string, domainId: string): ResolvedSuggestion[] {
    const resolved = this.getResolved(blueprintId);
    if (!resolved) return [];
    return resolved.resolvedSuggestions.filter(s => s.domain === domainId);
  }
}
