import { describe, it, expect, afterAll } from 'vitest';
import { WorldService } from '../../src/services/WorldService.js';
import { closeAllDbs, closeMasterDb } from '../../src/db/connection.js';

const worldService = new WorldService();
const createdIds: string[] = [];

afterAll(() => {
  for (const id of createdIds) {
    try { worldService.delete(id); } catch { /* cleanup */ }
  }
  closeAllDbs();
  closeMasterDb();
});

describe('WorldService', () => {
  it('creates a world', () => {
    const world = worldService.create({ name: 'Test World', tagline: 'A test', description: 'Testing' });
    createdIds.push(world.id);
    expect(world.name).toBe('Test World');
    expect(world.tagline).toBe('A test');
    expect(world.id).toBeTruthy();
  });

  it('retrieves a world by id', () => {
    const world = worldService.create({ name: 'Fetch World' });
    createdIds.push(world.id);
    const found = worldService.get(world.id);
    expect(found).toBeDefined();
    expect(found!.name).toBe('Fetch World');
  });

  it('returns undefined for missing world', () => {
    const found = worldService.get('00000000-0000-0000-0000-000000000000');
    expect(found).toBeUndefined();
  });

  it('lists all worlds', () => {
    const worlds = worldService.list();
    expect(Array.isArray(worlds)).toBe(true);
    expect(worlds.length).toBeGreaterThanOrEqual(createdIds.length);
  });

  it('updates a world', () => {
    const world = worldService.create({ name: 'Before Update' });
    createdIds.push(world.id);
    const updated = worldService.update(world.id, { name: 'After Update', tagline: 'Updated' });
    expect(updated).toBeDefined();
    expect(updated!.name).toBe('After Update');
    expect(updated!.tagline).toBe('Updated');
  });

  it('update returns undefined for missing world', () => {
    const result = worldService.update('00000000-0000-0000-0000-000000000000', { name: 'Nope' });
    expect(result).toBeUndefined();
  });

  it('deletes a world', () => {
    const world = worldService.create({ name: 'To Delete' });
    const deleted = worldService.delete(world.id);
    expect(deleted).toBe(true);
    expect(worldService.get(world.id)).toBeUndefined();
  });

  it('creates world with magic disabled', () => {
    const world = worldService.create({ name: 'No Magic', magic_enabled: false });
    createdIds.push(world.id);
    // SQLite stores booleans as integers, so check for falsy
    expect(Number(world.magic_enabled)).toBe(0);
  });

  it('gets stats for empty world', () => {
    const world = worldService.create({ name: 'Stats World' });
    createdIds.push(world.id);
    const stats = worldService.getStats(world.id);
    expect(typeof stats).toBe('object');
    expect(Object.keys(stats).length).toBe(0);
  });
});
