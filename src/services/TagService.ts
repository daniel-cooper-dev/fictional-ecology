import { v4 as uuidv4 } from 'uuid';
import { getWorldDb } from '../db/connection.js';

export class TagService {
  listForWorld(worldId: string): any[] {
    const db = getWorldDb(worldId);
    return db.prepare(`
      SELECT t.*, COUNT(et.element_id) as element_count
      FROM tags t
      LEFT JOIN element_tags et ON et.tag_id = t.id
      WHERE t.world_id = ?
      GROUP BY t.id
      ORDER BY t.name
    `).all(worldId);
  }

  listForElement(worldId: string, elementId: string): any[] {
    const db = getWorldDb(worldId);
    return db.prepare(`
      SELECT t.* FROM tags t
      INNER JOIN element_tags et ON et.tag_id = t.id
      WHERE t.world_id = ? AND et.element_id = ?
      ORDER BY t.name
    `).all(worldId, elementId);
  }

  create(worldId: string, name: string, color = '#4a9eff'): any {
    const db = getWorldDb(worldId);
    const id = uuidv4();
    db.prepare('INSERT INTO tags (id, world_id, name, color) VALUES (?, ?, ?, ?)').run(id, worldId, name.trim(), color);
    return { id, world_id: worldId, name: name.trim(), color };
  }

  delete(worldId: string, tagId: string): boolean {
    const db = getWorldDb(worldId);
    const result = db.prepare('DELETE FROM tags WHERE id = ? AND world_id = ?').run(tagId, worldId);
    return result.changes > 0;
  }

  addToElement(worldId: string, elementId: string, tagId: string): void {
    const db = getWorldDb(worldId);
    db.prepare('INSERT OR IGNORE INTO element_tags (element_id, tag_id) VALUES (?, ?)').run(elementId, tagId);
  }

  removeFromElement(worldId: string, elementId: string, tagId: string): void {
    const db = getWorldDb(worldId);
    db.prepare('DELETE FROM element_tags WHERE element_id = ? AND tag_id = ?').run(elementId, tagId);
  }

  findOrCreate(worldId: string, name: string, color = '#4a9eff'): any {
    const db = getWorldDb(worldId);
    const existing = db.prepare('SELECT * FROM tags WHERE world_id = ? AND name = ?').get(worldId, name.trim());
    if (existing) return existing;
    return this.create(worldId, name, color);
  }
}
