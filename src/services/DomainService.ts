import { v4 as uuidv4 } from 'uuid';
import { getWorldDb } from '../db/connection.js';
import type { DomainConfig } from '../types/domains.js';
import type { WorldElement, PaginationParams, PaginatedResult } from '../types/index.js';

function assertSafeIdentifier(name: string): void {
  if (!/^[a-z_][a-z0-9_]*$/i.test(name)) {
    throw new Error(`Unsafe SQL identifier: ${name}`);
  }
}

export class DomainService {
  constructor(private config: DomainConfig) {
    assertSafeIdentifier(config.tableName);
    if (config.magicPermeation) {
      assertSafeIdentifier(config.magicPermeation.companionTable);
    }
  }

  get domainId(): string { return this.config.id; }
  get domainConfig(): DomainConfig { return this.config; }

  list(worldId: string, params: PaginationParams & { type?: string } = { page: 1, limit: 50 }): PaginatedResult<WorldElement> {
    const db = getWorldDb(worldId);
    const { sort_by = 'updated_at', sort_dir = 'desc', type } = params;
    const page = Math.max(1, Math.floor(params.page) || 1);
    const limit = Math.min(200, Math.max(1, Math.floor(params.limit) || 50));
    const offset = (page - 1) * limit;

    const allowedSorts = ['name', 'element_type', 'created_at', 'updated_at'];
    const sortCol = allowedSorts.includes(sort_by) ? sort_by : 'updated_at';
    const dir = sort_dir === 'asc' ? 'ASC' : 'DESC';

    let where = 'WHERE domain = ?';
    const whereParams: any[] = [this.config.id];

    if (type) {
      where += ' AND element_type = ?';
      whereParams.push(type);
    }

    const total = (db.prepare(`SELECT COUNT(*) as count FROM world_elements ${where}`).get(...whereParams) as any).count;
    const items = db.prepare(
      `SELECT * FROM world_elements ${where} ORDER BY ${sortCol} ${dir} LIMIT ? OFFSET ?`
    ).all(...whereParams, limit, offset) as WorldElement[];

    return {
      items,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  get(worldId: string, elementId: string): (WorldElement & { extension?: Record<string, any>; magic_aspects?: Record<string, any> }) | undefined {
    const db = getWorldDb(worldId);
    const element = db.prepare('SELECT * FROM world_elements WHERE id = ? AND domain = ?').get(elementId, this.config.id) as WorldElement | undefined;
    if (!element) return undefined;

    const result: WorldElement & { extension?: Record<string, any>; magic_aspects?: Record<string, any> } = { ...element };

    // Load extension table data
    try {
      const ext = db.prepare(`SELECT * FROM ${this.config.tableName} WHERE element_id = ?`).get(elementId) as Record<string, any> | undefined;
      if (ext) {
        result.extension = ext;
      }
    } catch (err) {
      if (!(err instanceof Error && err.message.includes('no such table'))) {
        console.error(`DomainService.get extension error (${this.config.tableName}):`, (err as Error).message);
      }
    }

    // Load magic permeation data
    if (this.config.magicPermeation) {
      try {
        const magic = db.prepare(`SELECT * FROM ${this.config.magicPermeation.companionTable} WHERE parent_id = ?`).get(elementId) as Record<string, any> | undefined;
        if (magic) {
          result.magic_aspects = magic;
        }
      } catch (err) {
        if (!(err instanceof Error && err.message.includes('no such table'))) {
          console.error(`DomainService.get magic error (${this.config.magicPermeation.companionTable}):`, (err as Error).message);
        }
      }
    }

    return result;
  }

  create(worldId: string, data: {
    name: string;
    element_type?: string;
    summary?: string;
    detailed_notes?: string;
    properties?: Record<string, any>;
    extension?: Record<string, any>;
    magic_aspects?: Record<string, any>;
  }): WorldElement {
    const db = getWorldDb(worldId);
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO world_elements (id, world_id, domain, element_type, name, summary, detailed_notes, properties, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, worldId, this.config.id,
      data.element_type || '',
      data.name,
      data.summary || '',
      data.detailed_notes || '',
      JSON.stringify(data.properties || {}),
      now, now
    );

    // Insert extension data
    if (data.extension) {
      this.upsertExtension(db, id, data.extension);
    }

    // Insert magic aspects
    if (data.magic_aspects && this.config.magicPermeation) {
      this.upsertMagicAspects(db, id, data.magic_aspects);
    }

    // Update FTS index
    this.updateFtsIndex(db, id, worldId, data.name, data.summary || '', data.detailed_notes || '');

    return this.get(worldId, id)! as WorldElement;
  }

  update(worldId: string, elementId: string, data: {
    name?: string;
    element_type?: string;
    summary?: string;
    detailed_notes?: string;
    properties?: Record<string, any>;
    extension?: Record<string, any>;
    magic_aspects?: Record<string, any>;
  }): WorldElement | undefined {
    const db = getWorldDb(worldId);
    const existing = this.get(worldId, elementId);
    if (!existing) return undefined;

    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.element_type !== undefined) { updates.push('element_type = ?'); values.push(data.element_type); }
    if (data.summary !== undefined) { updates.push('summary = ?'); values.push(data.summary); }
    if (data.detailed_notes !== undefined) { updates.push('detailed_notes = ?'); values.push(data.detailed_notes); }
    if (data.properties !== undefined) { updates.push('properties = ?'); values.push(JSON.stringify(data.properties)); }

    const hasExtensionOrMagic = data.extension || (data.magic_aspects && this.config.magicPermeation);

    if (updates.length > 0 || hasExtensionOrMagic) {
      updates.push("updated_at = datetime('now')");
      values.push(elementId);
      db.prepare(`UPDATE world_elements SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    if (data.extension) {
      this.upsertExtension(db, elementId, data.extension);
    }

    if (data.magic_aspects && this.config.magicPermeation) {
      this.upsertMagicAspects(db, elementId, data.magic_aspects);
    }

    // Update FTS
    const updated = this.get(worldId, elementId)!;
    this.updateFtsIndex(db, elementId, worldId, updated.name, updated.summary, updated.detailed_notes);

    return updated as WorldElement;
  }

  delete(worldId: string, elementId: string): boolean {
    const db = getWorldDb(worldId);

    const deleteOp = db.transaction(() => {
      // Delete FTS entry
      try {
        db.prepare("DELETE FROM world_elements_fts WHERE element_id = ?").run(elementId);
      } catch (err) {
        if (!(err instanceof Error && err.message.includes('no such table'))) {
          console.error('DomainService.delete FTS error:', (err as Error).message);
        }
      }

      // Delete magic aspects if applicable
      if (this.config.magicPermeation) {
        try {
          db.prepare(`DELETE FROM ${this.config.magicPermeation.companionTable} WHERE parent_id = ?`).run(elementId);
        } catch (err) {
          if (!(err instanceof Error && err.message.includes('no such table'))) {
            console.error('DomainService.delete magic error:', (err as Error).message);
          }
        }
      }

      // Delete tags and relationships for this element
      try {
        db.prepare('DELETE FROM element_tags WHERE element_id = ?').run(elementId);
        db.prepare('DELETE FROM relationships WHERE world_id = ? AND (source_id = ? OR target_id = ?)').run(worldId, elementId, elementId);
      } catch (err) {
        if (!(err instanceof Error && err.message.includes('no such table'))) {
          console.error('DomainService.delete cleanup error:', (err as Error).message);
        }
      }

      // Delete main element (cascades to extension table via FK)
      const result = db.prepare('DELETE FROM world_elements WHERE id = ? AND world_id = ? AND domain = ?')
        .run(elementId, worldId, this.config.id);
      return result.changes > 0;
    });

    return deleteOp();
  }

  private upsertExtension(db: any, elementId: string, data: Record<string, any>): void {
    const tableName = this.config.tableName;
    const fields = this.config.fields.map(f => f.name).filter(f => f in data);
    if (fields.length === 0) return;

    const existing = (() => {
      try { return db.prepare(`SELECT element_id FROM ${tableName} WHERE element_id = ?`).get(elementId); }
      catch (err) {
        if (!(err instanceof Error && err.message.includes('no such table'))) {
          console.error(`DomainService.upsertExtension error (${tableName}):`, (err as Error).message);
        }
        return null;
      }
    })();

    if (existing) {
      const sets = fields.map(f => `${f} = ?`).join(', ');
      const vals = fields.map(f => typeof data[f] === 'object' ? JSON.stringify(data[f]) : data[f]);
      db.prepare(`UPDATE ${tableName} SET ${sets} WHERE element_id = ?`).run(...vals, elementId);
    } else {
      const cols = ['element_id', ...fields].join(', ');
      const placeholders = ['element_id', ...fields].map(() => '?').join(', ');
      const vals = [elementId, ...fields.map(f => typeof data[f] === 'object' ? JSON.stringify(data[f]) : data[f])];
      db.prepare(`INSERT INTO ${tableName} (${cols}) VALUES (${placeholders})`).run(...vals);
    }
  }

  private upsertMagicAspects(db: any, elementId: string, data: Record<string, any>): void {
    if (!this.config.magicPermeation) return;
    const tableName = this.config.magicPermeation.companionTable;
    const fields = this.config.magicPermeation.fields.map(f => f.name).filter(f => f in data);
    if (fields.length === 0) return;

    const existing = (() => {
      try { return db.prepare(`SELECT id FROM ${tableName} WHERE parent_id = ?`).get(elementId); }
      catch (err) {
        if (!(err instanceof Error && err.message.includes('no such table'))) {
          console.error(`DomainService.upsertMagicAspects error (${tableName}):`, (err as Error).message);
        }
        return null;
      }
    })();

    if (existing) {
      const sets = fields.map(f => `${f} = ?`).join(', ');
      const vals = fields.map(f => typeof data[f] === 'object' ? JSON.stringify(data[f]) : data[f]);
      db.prepare(`UPDATE ${tableName} SET ${sets}, updated_at = datetime('now') WHERE parent_id = ?`).run(...vals, elementId);
    } else {
      const id = uuidv4();
      const cols = ['id', 'parent_id', ...fields].join(', ');
      const placeholders = ['id', 'parent_id', ...fields].map(() => '?').join(', ');
      const vals = [id, elementId, ...fields.map(f => typeof data[f] === 'object' ? JSON.stringify(data[f]) : data[f])];
      db.prepare(`INSERT INTO ${tableName} (${cols}) VALUES (${placeholders})`).run(...vals);
    }
  }

  private updateFtsIndex(db: any, elementId: string, worldId: string, name: string, summary: string, notes: string): void {
    try {
      db.prepare("DELETE FROM world_elements_fts WHERE element_id = ?").run(elementId);
      db.prepare(`
        INSERT INTO world_elements_fts (element_id, world_id, domain, name, summary, detailed_notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(elementId, worldId, this.config.id, name, summary, notes);
    } catch (err) {
      if (!(err instanceof Error && err.message.includes('no such table'))) {
        console.error('DomainService.updateFtsIndex error:', (err as Error).message);
      }
    }
  }
}
