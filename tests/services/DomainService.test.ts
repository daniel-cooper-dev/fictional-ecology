import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DomainService } from '../../src/services/DomainService.js';
import { WorldService } from '../../src/services/WorldService.js';
import { getDomainConfig } from '../../src/domains/index.js';
import { closeAllDbs, closeMasterDb } from '../../src/db/connection.js';

const worldService = new WorldService();
let worldId: string;
let floraService: DomainService;

beforeAll(() => {
  const world = worldService.create({ name: 'Domain Test World' });
  worldId = world.id;
  const config = getDomainConfig('flora')!;
  floraService = new DomainService(config);
});

afterAll(() => {
  try { worldService.delete(worldId); } catch { /* cleanup */ }
  closeAllDbs();
  closeMasterDb();
});

describe('DomainService', () => {
  it('creates an element', () => {
    const el = floraService.create(worldId, {
      name: 'Moonbloom',
      element_type: 'flower',
      summary: 'A flower that blooms under moonlight',
    });
    expect(el.name).toBe('Moonbloom');
    expect(el.domain).toBe('flora');
    expect(el.element_type).toBe('flower');
    expect(el.id).toBeTruthy();
  });

  it('lists elements', () => {
    const result = floraService.list(worldId, { page: 1, limit: 50 });
    expect(result.items.length).toBeGreaterThanOrEqual(1);
    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.page).toBe(1);
    expect(result.total_pages).toBeGreaterThanOrEqual(1);
  });

  it('retrieves an element by id', () => {
    const created = floraService.create(worldId, { name: 'Sunvine' });
    const found = floraService.get(worldId, created.id);
    expect(found).toBeDefined();
    expect(found!.name).toBe('Sunvine');
  });

  it('returns undefined for missing element', () => {
    const found = floraService.get(worldId, '00000000-0000-0000-0000-000000000000');
    expect(found).toBeUndefined();
  });

  it('updates an element', () => {
    const el = floraService.create(worldId, { name: 'Old Name' });
    const updated = floraService.update(worldId, el.id, { name: 'New Name', summary: 'Updated summary' });
    expect(updated).toBeDefined();
    expect(updated!.name).toBe('New Name');
    expect(updated!.summary).toBe('Updated summary');
  });

  it('update returns undefined for missing element', () => {
    const result = floraService.update(worldId, '00000000-0000-0000-0000-000000000000', { name: 'Nope' });
    expect(result).toBeUndefined();
  });

  it('deletes an element', () => {
    const el = floraService.create(worldId, { name: 'To Delete' });
    const deleted = floraService.delete(worldId, el.id);
    expect(deleted).toBe(true);
    expect(floraService.get(worldId, el.id)).toBeUndefined();
  });

  it('delete returns false for missing element', () => {
    const deleted = floraService.delete(worldId, '00000000-0000-0000-0000-000000000000');
    expect(deleted).toBe(false);
  });

  it('filters by element type', () => {
    floraService.create(worldId, { name: 'Oak Tree', element_type: 'tree' });
    floraService.create(worldId, { name: 'Red Mushroom', element_type: 'fungus' });
    const trees = floraService.list(worldId, { page: 1, limit: 50, type: 'tree' });
    expect(trees.items.every(e => e.element_type === 'tree')).toBe(true);
  });

  it('paginates results', () => {
    const page1 = floraService.list(worldId, { page: 1, limit: 2 });
    expect(page1.items.length).toBeLessThanOrEqual(2);
    expect(page1.limit).toBe(2);
    if (page1.total > 2) {
      const page2 = floraService.list(worldId, { page: 2, limit: 2 });
      expect(page2.items.length).toBeGreaterThan(0);
      expect(page2.items[0].id).not.toBe(page1.items[0].id);
    }
  });

  it('clamps invalid pagination values', () => {
    const result = floraService.list(worldId, { page: -5, limit: 99999 });
    expect(result.page).toBe(1);
    expect(result.limit).toBe(200);
  });

  it('creates element with extension data', () => {
    const el = floraService.create(worldId, {
      name: 'Crystal Fern',
      extension: { kingdom: 'plant', growth_form: 'fern', rarity: 'rare' },
    });
    const found = floraService.get(worldId, el.id);
    expect(found).toBeDefined();
    expect(found!.extension).toBeDefined();
    expect(found!.extension!.kingdom).toBe('plant');
    expect(found!.extension!.rarity).toBe('rare');
  });
});
