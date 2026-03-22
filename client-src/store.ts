import { generateId, now } from './uuid.js';

// --- Types (mirroring src/types/index.ts but without server dependencies) ---

export interface Constellation {
  id: string;
  name: string;
  description: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface World {
  id: string;
  name: string;
  tagline: string;
  description: string;
  magic_enabled: boolean;
  settings: string;
  created_at: string;
  updated_at: string;
  forked_from: string | null;
  constellation_id: string | null;
  blueprint_id: string | null;
}

export interface WorldElement {
  id: string;
  world_id: string;
  domain: string;
  element_type: string;
  name: string;
  summary: string;
  detailed_notes: string;
  properties: string; // JSON — stores all extension + magic fields
  created_at: string;
  updated_at: string;
}

export interface Relationship {
  id: string;
  world_id: string;
  source_id: string;
  target_id: string;
  relationship_type: string;
  description: string;
  strength: string;
  bidirectional: boolean;
  created_at: string;
}

export interface Tag {
  id: string;
  world_id: string;
  name: string;
  color: string;
}

export interface ElementTag {
  element_id: string;
  tag_id: string;
}

export interface Era {
  id: string;
  world_id: string;
  calendar_id: string | null;
  name: string;
  start_year: number;
  end_year: number | null;
  description: string;
  color: string;
  sort_order: number;
}

// --- localStorage helpers ---

function getJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setJSON(key: string, value: any): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// --- Key scheme ---
const KEYS = {
  worlds: 'fe:worlds',
  constellations: 'fe:constellations',
  elements: (worldId: string) => `fe:world:${worldId}:elements`,
  relationships: (worldId: string) => `fe:world:${worldId}:relationships`,
  tags: (worldId: string) => `fe:world:${worldId}:tags`,
  elementTags: (worldId: string) => `fe:world:${worldId}:element_tags`,
  eras: (worldId: string) => `fe:world:${worldId}:eras`,
};

// --- Store ---

export const store = {
  // ==================== WORLDS ====================

  listWorlds(): World[] {
    return getJSON<World[]>(KEYS.worlds, []).sort(
      (a, b) => b.updated_at.localeCompare(a.updated_at)
    );
  },

  getWorld(id: string): World | undefined {
    return this.listWorlds().find(w => w.id === id);
  },

  createWorld(data: {
    name: string;
    tagline?: string;
    description?: string;
    magic_enabled?: boolean;
    blueprint_id?: string | null;
    constellation_id?: string | null;
  }): World {
    const worlds = getJSON<World[]>(KEYS.worlds, []);
    const world: World = {
      id: generateId(),
      name: data.name,
      tagline: data.tagline || '',
      description: data.description || '',
      magic_enabled: data.magic_enabled !== false,
      settings: '{}',
      created_at: now(),
      updated_at: now(),
      forked_from: null,
      constellation_id: data.constellation_id || null,
      blueprint_id: data.blueprint_id || null,
    };
    worlds.push(world);
    setJSON(KEYS.worlds, worlds);
    // Initialize empty world data
    setJSON(KEYS.elements(world.id), []);
    setJSON(KEYS.relationships(world.id), []);
    setJSON(KEYS.tags(world.id), []);
    setJSON(KEYS.elementTags(world.id), []);
    setJSON(KEYS.eras(world.id), []);
    return world;
  },

  updateWorld(id: string, data: Partial<World>): World | undefined {
    const worlds = getJSON<World[]>(KEYS.worlds, []);
    const idx = worlds.findIndex(w => w.id === id);
    if (idx === -1) return undefined;
    const updated = { ...worlds[idx], ...data, updated_at: now() };
    // Don't allow changing id or created_at
    updated.id = worlds[idx].id;
    updated.created_at = worlds[idx].created_at;
    worlds[idx] = updated;
    setJSON(KEYS.worlds, worlds);
    return updated;
  },

  deleteWorld(id: string): void {
    const worlds = getJSON<World[]>(KEYS.worlds, []).filter(w => w.id !== id);
    setJSON(KEYS.worlds, worlds);
    // Clean up world data
    localStorage.removeItem(KEYS.elements(id));
    localStorage.removeItem(KEYS.relationships(id));
    localStorage.removeItem(KEYS.tags(id));
    localStorage.removeItem(KEYS.elementTags(id));
    localStorage.removeItem(KEYS.eras(id));
  },

  getWorldStats(worldId: string): Record<string, number> {
    const elements = getJSON<WorldElement[]>(KEYS.elements(worldId), []);
    const stats: Record<string, number> = {};
    for (const el of elements) {
      stats[el.domain] = (stats[el.domain] || 0) + 1;
    }
    return stats;
  },

  // ==================== CONSTELLATIONS ====================

  listConstellations(): Constellation[] {
    return getJSON<Constellation[]>(KEYS.constellations, []).sort(
      (a, b) => b.updated_at.localeCompare(a.updated_at)
    );
  },

  getConstellation(id: string): Constellation | undefined {
    return this.listConstellations().find(c => c.id === id);
  },

  createConstellation(data: { name: string; description?: string; color?: string }): Constellation {
    const constellations = getJSON<Constellation[]>(KEYS.constellations, []);
    const constellation: Constellation = {
      id: generateId(),
      name: data.name,
      description: data.description || '',
      color: data.color || '#6366f1',
      created_at: now(),
      updated_at: now(),
    };
    constellations.push(constellation);
    setJSON(KEYS.constellations, constellations);
    return constellation;
  },

  updateConstellation(id: string, data: Partial<Constellation>): Constellation | undefined {
    const constellations = getJSON<Constellation[]>(KEYS.constellations, []);
    const idx = constellations.findIndex(c => c.id === id);
    if (idx === -1) return undefined;
    const updated = { ...constellations[idx], ...data, updated_at: now() };
    updated.id = constellations[idx].id;
    updated.created_at = constellations[idx].created_at;
    constellations[idx] = updated;
    setJSON(KEYS.constellations, constellations);
    return updated;
  },

  deleteConstellation(id: string): void {
    const constellations = getJSON<Constellation[]>(KEYS.constellations, []).filter(c => c.id !== id);
    setJSON(KEYS.constellations, constellations);
    // Unlink worlds
    const worlds = getJSON<World[]>(KEYS.worlds, []);
    for (const w of worlds) {
      if (w.constellation_id === id) w.constellation_id = null;
    }
    setJSON(KEYS.worlds, worlds);
  },

  getConstellationWorlds(constellationId: string): World[] {
    return this.listWorlds().filter(w => w.constellation_id === constellationId);
  },

  getUnlinkedWorlds(): World[] {
    return this.listWorlds().filter(w => !w.constellation_id);
  },

  addWorldToConstellation(constellationId: string, worldId: string): void {
    this.updateWorld(worldId, { constellation_id: constellationId } as any);
  },

  removeWorldFromConstellation(worldId: string): void {
    this.updateWorld(worldId, { constellation_id: null } as any);
  },

  // ==================== ELEMENTS ====================

  listElements(worldId: string, domain?: string, type?: string, sortBy?: string, sortDir?: string): WorldElement[] {
    let elements = getJSON<WorldElement[]>(KEYS.elements(worldId), []);
    if (domain) elements = elements.filter(e => e.domain === domain);
    if (type) elements = elements.filter(e => e.element_type === type);

    const field = sortBy || 'updated_at';
    const dir = sortDir || 'desc';
    elements.sort((a: any, b: any) => {
      const va = a[field] || '';
      const vb = b[field] || '';
      return dir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });

    return elements;
  },

  getElement(worldId: string, elementId: string): WorldElement | undefined {
    return getJSON<WorldElement[]>(KEYS.elements(worldId), []).find(e => e.id === elementId);
  },

  createElement(worldId: string, data: {
    domain: string;
    element_type?: string;
    name: string;
    summary?: string;
    detailed_notes?: string;
    properties?: Record<string, any>;
  }): WorldElement {
    const elements = getJSON<WorldElement[]>(KEYS.elements(worldId), []);
    const element: WorldElement = {
      id: generateId(),
      world_id: worldId,
      domain: data.domain,
      element_type: data.element_type || '',
      name: data.name,
      summary: data.summary || '',
      detailed_notes: data.detailed_notes || '',
      properties: JSON.stringify(data.properties || {}),
      created_at: now(),
      updated_at: now(),
    };
    elements.push(element);
    setJSON(KEYS.elements(worldId), elements);
    return element;
  },

  updateElement(worldId: string, elementId: string, data: Partial<{
    name: string;
    element_type: string;
    summary: string;
    detailed_notes: string;
    properties: Record<string, any>;
  }>): WorldElement | undefined {
    const elements = getJSON<WorldElement[]>(KEYS.elements(worldId), []);
    const idx = elements.findIndex(e => e.id === elementId);
    if (idx === -1) return undefined;

    if (data.name !== undefined) elements[idx].name = data.name;
    if (data.element_type !== undefined) elements[idx].element_type = data.element_type;
    if (data.summary !== undefined) elements[idx].summary = data.summary;
    if (data.detailed_notes !== undefined) elements[idx].detailed_notes = data.detailed_notes;
    if (data.properties !== undefined) elements[idx].properties = JSON.stringify(data.properties);
    elements[idx].updated_at = now();

    setJSON(KEYS.elements(worldId), elements);
    return elements[idx];
  },

  deleteElement(worldId: string, elementId: string): void {
    const elements = getJSON<WorldElement[]>(KEYS.elements(worldId), []).filter(e => e.id !== elementId);
    setJSON(KEYS.elements(worldId), elements);

    // Cascade: remove relationships referencing this element
    const rels = getJSON<Relationship[]>(KEYS.relationships(worldId), [])
      .filter(r => r.source_id !== elementId && r.target_id !== elementId);
    setJSON(KEYS.relationships(worldId), rels);

    // Cascade: remove element_tags
    const ets = getJSON<ElementTag[]>(KEYS.elementTags(worldId), [])
      .filter(et => et.element_id !== elementId);
    setJSON(KEYS.elementTags(worldId), ets);
  },

  // ==================== RELATIONSHIPS ====================

  listRelationships(worldId: string, elementId?: string): Relationship[] {
    let rels = getJSON<Relationship[]>(KEYS.relationships(worldId), []);
    if (elementId) {
      rels = rels.filter(r => r.source_id === elementId || r.target_id === elementId);
    }
    return rels.sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  createRelationship(worldId: string, data: {
    source_id: string;
    target_id: string;
    relationship_type: string;
    description?: string;
    strength?: string;
    bidirectional?: boolean;
  }): Relationship {
    const rels = getJSON<Relationship[]>(KEYS.relationships(worldId), []);
    const rel: Relationship = {
      id: generateId(),
      world_id: worldId,
      source_id: data.source_id,
      target_id: data.target_id,
      relationship_type: data.relationship_type,
      description: data.description || '',
      strength: data.strength || 'moderate',
      bidirectional: data.bidirectional ?? false,
      created_at: now(),
    };
    rels.push(rel);
    setJSON(KEYS.relationships(worldId), rels);
    return rel;
  },

  deleteRelationship(worldId: string, relId: string): void {
    const rels = getJSON<Relationship[]>(KEYS.relationships(worldId), []).filter(r => r.id !== relId);
    setJSON(KEYS.relationships(worldId), rels);
  },

  // ==================== TAGS ====================

  listTags(worldId: string): (Tag & { element_count: number })[] {
    const tags = getJSON<Tag[]>(KEYS.tags(worldId), []);
    const ets = getJSON<ElementTag[]>(KEYS.elementTags(worldId), []);
    return tags.map(t => ({
      ...t,
      element_count: ets.filter(et => et.tag_id === t.id).length,
    })).sort((a, b) => a.name.localeCompare(b.name));
  },

  listElementTags(worldId: string, elementId: string): Tag[] {
    const tags = getJSON<Tag[]>(KEYS.tags(worldId), []);
    const ets = getJSON<ElementTag[]>(KEYS.elementTags(worldId), []);
    const tagIds = new Set(ets.filter(et => et.element_id === elementId).map(et => et.tag_id));
    return tags.filter(t => tagIds.has(t.id));
  },

  createTag(worldId: string, name: string, color?: string): Tag {
    const tags = getJSON<Tag[]>(KEYS.tags(worldId), []);
    // Check if exists
    const existing = tags.find(t => t.name.trim().toLowerCase() === name.trim().toLowerCase());
    if (existing) return existing;

    const tag: Tag = {
      id: generateId(),
      world_id: worldId,
      name: name.trim(),
      color: color || '#4a9eff',
    };
    tags.push(tag);
    setJSON(KEYS.tags(worldId), tags);
    return tag;
  },

  deleteTag(worldId: string, tagId: string): void {
    const tags = getJSON<Tag[]>(KEYS.tags(worldId), []).filter(t => t.id !== tagId);
    setJSON(KEYS.tags(worldId), tags);
    // Remove associations
    const ets = getJSON<ElementTag[]>(KEYS.elementTags(worldId), []).filter(et => et.tag_id !== tagId);
    setJSON(KEYS.elementTags(worldId), ets);
  },

  addTagToElement(worldId: string, elementId: string, tagId: string): void {
    const ets = getJSON<ElementTag[]>(KEYS.elementTags(worldId), []);
    if (!ets.some(et => et.element_id === elementId && et.tag_id === tagId)) {
      ets.push({ element_id: elementId, tag_id: tagId });
      setJSON(KEYS.elementTags(worldId), ets);
    }
  },

  removeTagFromElement(worldId: string, elementId: string, tagId: string): void {
    const ets = getJSON<ElementTag[]>(KEYS.elementTags(worldId), [])
      .filter(et => !(et.element_id === elementId && et.tag_id === tagId));
    setJSON(KEYS.elementTags(worldId), ets);
  },

  // ==================== ERAS ====================

  listEras(worldId: string): Era[] {
    return getJSON<Era[]>(KEYS.eras(worldId), []).sort((a, b) => a.sort_order - b.sort_order || a.start_year - b.start_year);
  },

  createEra(worldId: string, data: {
    name: string;
    start_year?: number;
    end_year?: number | null;
    description?: string;
    color?: string;
    sort_order?: number;
  }): Era {
    const eras = getJSON<Era[]>(KEYS.eras(worldId), []);
    const era: Era = {
      id: generateId(),
      world_id: worldId,
      calendar_id: null,
      name: data.name,
      start_year: data.start_year ?? 0,
      end_year: data.end_year ?? null,
      description: data.description || '',
      color: data.color || '#4a9eff',
      sort_order: data.sort_order ?? eras.length,
    };
    eras.push(era);
    setJSON(KEYS.eras(worldId), eras);
    return era;
  },

  updateEra(worldId: string, eraId: string, data: Partial<Era>): Era | undefined {
    const eras = getJSON<Era[]>(KEYS.eras(worldId), []);
    const idx = eras.findIndex(e => e.id === eraId);
    if (idx === -1) return undefined;
    const updated = { ...eras[idx], ...data };
    updated.id = eras[idx].id;
    updated.world_id = eras[idx].world_id;
    eras[idx] = updated;
    setJSON(KEYS.eras(worldId), eras);
    return updated;
  },

  deleteEra(worldId: string, eraId: string): void {
    const eras = getJSON<Era[]>(KEYS.eras(worldId), []).filter(e => e.id !== eraId);
    setJSON(KEYS.eras(worldId), eras);
  },

  // ==================== SEARCH ====================

  search(worldId: string, query: string, domain?: string): { element_id: string; domain: string; element_type: string; name: string; snippet: string }[] {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    let elements = getJSON<WorldElement[]>(KEYS.elements(worldId), []);
    if (domain) elements = elements.filter(e => e.domain === domain);

    return elements
      .filter(e =>
        (e.name || '').toLowerCase().includes(q) ||
        (e.summary || '').toLowerCase().includes(q) ||
        (e.detailed_notes || '').toLowerCase().includes(q)
      )
      .slice(0, 50)
      .map(e => {
        // Create snippet
        let snippet = e.summary || e.detailed_notes || '';
        const idx = snippet.toLowerCase().indexOf(q);
        if (idx >= 0) {
          const start = Math.max(0, idx - 30);
          const end = Math.min(snippet.length, idx + q.length + 30);
          snippet = (start > 0 ? '...' : '') + snippet.slice(start, end) + (end < snippet.length ? '...' : '');
        } else {
          snippet = snippet.slice(0, 80) + (snippet.length > 80 ? '...' : '');
        }
        return {
          element_id: e.id,
          domain: e.domain,
          element_type: e.element_type,
          name: e.name,
          snippet,
        };
      });
  },

  // ==================== IMPORT / EXPORT ====================

  exportWorld(worldId: string): object | null {
    const world = this.getWorld(worldId);
    if (!world) return null;
    return {
      version: 2,
      type: 'world',
      exported_at: now(),
      world: { ...world },
      elements: getJSON<WorldElement[]>(KEYS.elements(worldId), []),
      relationships: getJSON<Relationship[]>(KEYS.relationships(worldId), []),
      tags: getJSON<Tag[]>(KEYS.tags(worldId), []),
      element_tags: getJSON<ElementTag[]>(KEYS.elementTags(worldId), []),
      eras: getJSON<Era[]>(KEYS.eras(worldId), []),
    };
  },

  exportConstellation(constellationId: string): object | null {
    const constellation = this.getConstellation(constellationId);
    if (!constellation) return null;
    const worlds = this.getConstellationWorlds(constellationId);
    return {
      version: 2,
      type: 'constellation',
      exported_at: now(),
      constellation: { ...constellation },
      worlds: worlds.map(w => ({
        world: { ...w },
        elements: getJSON<WorldElement[]>(KEYS.elements(w.id), []),
        relationships: getJSON<Relationship[]>(KEYS.relationships(w.id), []),
        tags: getJSON<Tag[]>(KEYS.tags(w.id), []),
        element_tags: getJSON<ElementTag[]>(KEYS.elementTags(w.id), []),
        eras: getJSON<Era[]>(KEYS.eras(w.id), []),
      })),
    };
  },

  importData(json: any): { constellationId?: string; worldIds: string[] } {
    const result: { constellationId?: string; worldIds: string[] } = { worldIds: [] };

    if (json.type === 'constellation' && json.constellation && json.worlds) {
      // Import constellation
      const idMap = new Map<string, string>();

      const oldConstellationId = json.constellation.id;
      const newConstellationId = generateId();
      idMap.set(oldConstellationId, newConstellationId);

      const constellation: Constellation = {
        ...json.constellation,
        id: newConstellationId,
        created_at: now(),
        updated_at: now(),
      };
      const constellations = getJSON<Constellation[]>(KEYS.constellations, []);
      constellations.push(constellation);
      setJSON(KEYS.constellations, constellations);
      result.constellationId = newConstellationId;

      for (const worldData of json.worlds) {
        const wId = this._importWorldData(worldData, newConstellationId, idMap);
        result.worldIds.push(wId);
      }
    } else if (json.type === 'world' && json.world) {
      const idMap = new Map<string, string>();
      const wId = this._importWorldData(json, null, idMap);
      result.worldIds.push(wId);
    }

    return result;
  },

  _importWorldData(data: any, constellationId: string | null, idMap: Map<string, string>): string {
    const oldWorldId = data.world.id;
    const newWorldId = generateId();
    idMap.set(oldWorldId, newWorldId);

    // Remap element IDs
    const elements: WorldElement[] = (data.elements || []).map((e: WorldElement) => {
      const newId = generateId();
      idMap.set(e.id, newId);
      return { ...e, id: newId, world_id: newWorldId };
    });

    // Remap relationship IDs and references
    const relationships: Relationship[] = (data.relationships || []).map((r: Relationship) => ({
      ...r,
      id: generateId(),
      world_id: newWorldId,
      source_id: idMap.get(r.source_id) || r.source_id,
      target_id: idMap.get(r.target_id) || r.target_id,
    }));

    // Remap tag IDs
    const tags: Tag[] = (data.tags || []).map((t: Tag) => {
      const newId = generateId();
      idMap.set(t.id, newId);
      return { ...t, id: newId, world_id: newWorldId };
    });

    // Remap element_tag references
    const elementTags: ElementTag[] = (data.element_tags || []).map((et: ElementTag) => ({
      element_id: idMap.get(et.element_id) || et.element_id,
      tag_id: idMap.get(et.tag_id) || et.tag_id,
    }));

    // Remap era IDs
    const eras: Era[] = (data.eras || []).map((e: Era) => ({
      ...e,
      id: generateId(),
      world_id: newWorldId,
    }));

    // Create world
    const world: World = {
      ...data.world,
      id: newWorldId,
      constellation_id: constellationId,
      created_at: now(),
      updated_at: now(),
    };
    const worlds = getJSON<World[]>(KEYS.worlds, []);
    worlds.push(world);
    setJSON(KEYS.worlds, worlds);

    // Store world data
    setJSON(KEYS.elements(newWorldId), elements);
    setJSON(KEYS.relationships(newWorldId), relationships);
    setJSON(KEYS.tags(newWorldId), tags);
    setJSON(KEYS.elementTags(newWorldId), elementTags);
    setJSON(KEYS.eras(newWorldId), eras);

    return newWorldId;
  },

  // ==================== UTILITIES ====================

  clearAll(): void {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('fe:')) keys.push(key);
    }
    for (const key of keys) localStorage.removeItem(key);
  },

  getStorageUsage(): { used: number; keys: number } {
    let used = 0;
    let keys = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('fe:')) {
        used += (localStorage.getItem(key) || '').length * 2; // UTF-16 = 2 bytes per char
        keys++;
      }
    }
    return { used, keys };
  },
};
