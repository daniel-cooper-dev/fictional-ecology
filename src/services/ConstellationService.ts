import { v4 as uuidv4 } from 'uuid';
import { getMasterDb } from '../db/connection.js';
import type { Constellation, World } from '../types/index.js';

export class ConstellationService {
  list(): Constellation[] {
    const db = getMasterDb();
    return db.prepare('SELECT * FROM constellations ORDER BY updated_at DESC').all() as Constellation[];
  }

  get(id: string): Constellation | undefined {
    const db = getMasterDb();
    return db.prepare('SELECT * FROM constellations WHERE id = ?').get(id) as Constellation | undefined;
  }

  create(data: { name: string; description?: string; color?: string }): Constellation {
    const db = getMasterDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO constellations (id, name, description, color, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, data.name, data.description || '', data.color || '#6366f1', now, now);

    return this.get(id)!;
  }

  update(id: string, data: Partial<Pick<Constellation, 'name' | 'description' | 'color'>>): Constellation | undefined {
    const db = getMasterDb();
    const existing = this.get(id);
    if (!existing) return undefined;

    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
    if (data.color !== undefined) { updates.push('color = ?'); values.push(data.color); }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      values.push(id);
      db.prepare(`UPDATE constellations SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    return this.get(id);
  }

  delete(id: string): boolean {
    const db = getMasterDb();
    // Unlink worlds first (ON DELETE SET NULL handles this, but be explicit)
    db.prepare('UPDATE worlds SET constellation_id = NULL WHERE constellation_id = ?').run(id);
    const result = db.prepare('DELETE FROM constellations WHERE id = ?').run(id);
    return result.changes > 0;
  }

  getWorlds(constellationId: string): World[] {
    const db = getMasterDb();
    return db.prepare('SELECT * FROM worlds WHERE constellation_id = ? ORDER BY updated_at DESC').all(constellationId) as World[];
  }

  getUnlinkedWorlds(): World[] {
    const db = getMasterDb();
    return db.prepare('SELECT * FROM worlds WHERE constellation_id IS NULL ORDER BY updated_at DESC').all() as World[];
  }

  addWorld(constellationId: string, worldId: string): void {
    const db = getMasterDb();
    db.prepare('UPDATE worlds SET constellation_id = ?, updated_at = datetime(\'now\') WHERE id = ?').run(constellationId, worldId);
    db.prepare('UPDATE constellations SET updated_at = datetime(\'now\') WHERE id = ?').run(constellationId);
  }

  removeWorld(worldId: string): void {
    const db = getMasterDb();
    db.prepare('UPDATE worlds SET constellation_id = NULL, updated_at = datetime(\'now\') WHERE id = ?').run(worldId);
  }

  getWorldCount(constellationId: string): number {
    const db = getMasterDb();
    const result = db.prepare('SELECT COUNT(*) as count FROM worlds WHERE constellation_id = ?').get(constellationId) as { count: number };
    return result.count;
  }
}
