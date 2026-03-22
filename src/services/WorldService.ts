import { v4 as uuidv4 } from 'uuid';
import { getMasterDb, getWorldDb, closeWorldDb, getWorldDbPath } from '../db/connection.js';
import fs from 'fs';
import path from 'path';
import { config } from '../config.js';
import type { World } from '../types/index.js';

export class WorldService {
  list(): World[] {
    const db = getMasterDb();
    return db.prepare('SELECT * FROM worlds ORDER BY updated_at DESC').all() as World[];
  }

  get(id: string): World | undefined {
    const db = getMasterDb();
    return db.prepare('SELECT * FROM worlds WHERE id = ?').get(id) as World | undefined;
  }

  create(data: { name: string; tagline?: string; description?: string; magic_enabled?: boolean; blueprint_id?: string }): World {
    const db = getMasterDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO worlds (id, name, tagline, description, magic_enabled, blueprint_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.name, data.tagline || '', data.description || '', data.magic_enabled !== false ? 1 : 0, data.blueprint_id || null, now, now);

    // Initialize the world database (triggers migrations)
    getWorldDb(id);

    return this.get(id)!;
  }

  update(id: string, data: Partial<Pick<World, 'name' | 'tagline' | 'description' | 'magic_enabled' | 'settings'>>): World | undefined {
    const db = getMasterDb();
    const existing = this.get(id);
    if (!existing) return undefined;

    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.tagline !== undefined) { updates.push('tagline = ?'); values.push(data.tagline); }
    if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
    if (data.magic_enabled !== undefined) { updates.push('magic_enabled = ?'); values.push(data.magic_enabled ? 1 : 0); }
    if (data.settings !== undefined) { updates.push('settings = ?'); values.push(data.settings); }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      values.push(id);
      db.prepare(`UPDATE worlds SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    return this.get(id);
  }

  delete(id: string): boolean {
    const db = getMasterDb();
    closeWorldDb(id);

    const worldDir = path.join(config.dataDir, id);
    if (fs.existsSync(worldDir)) {
      fs.rmSync(worldDir, { recursive: true, force: true });
    }

    const result = db.prepare('DELETE FROM worlds WHERE id = ?').run(id);
    return result.changes > 0;
  }

  getStats(worldId: string): Record<string, number> {
    const db = getWorldDb(worldId);
    const domains = db.prepare(`
      SELECT domain, COUNT(*) as count
      FROM world_elements
      GROUP BY domain
    `).all() as { domain: string; count: number }[];

    const stats: Record<string, number> = {};
    for (const row of domains) {
      stats[row.domain] = row.count;
    }
    return stats;
  }
}
