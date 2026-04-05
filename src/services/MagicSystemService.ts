import { v4 as uuidv4 } from 'uuid';
import { getWorldDb } from '../db/connection.js';

// Facade over 9 magic sub-tables
const SUB_TABLES = [
  'magic_sources', 'magic_energy_types', 'magic_laws',
  'magic_taxonomies', 'magical_materials', 'spell_classifications',
  'magic_costs_consequences', 'magical_phenomena', 'power_scaling_framework',
] as const;

type SubTable = typeof SUB_TABLES[number];

function assertSafeIdentifier(name: string): void {
  if (!/^[a-z_][a-z0-9_]*$/i.test(name)) {
    throw new Error(`Unsafe SQL identifier: ${name}`);
  }
}

export class MagicSystemService {
  private validateSubTable(subTable: string): void {
    if (!SUB_TABLES.some(st => st === subTable)) {
      throw new Error(`Invalid sub-table: ${subTable}`);
    }
    assertSafeIdentifier(subTable);
  }

  listSubEntities(worldId: string, subTable: SubTable): any[] {
    this.validateSubTable(subTable);
    const db = getWorldDb(worldId);
    return db.prepare(`SELECT * FROM ${subTable} WHERE world_id = ? ORDER BY ${subTable === 'power_scaling_framework' ? 'tier_number' : subTable === 'magic_laws' ? 'sort_order' : 'name'} ASC`).all(worldId);
  }

  getSubEntity(worldId: string, subTable: SubTable, id: string): any {
    this.validateSubTable(subTable);
    const db = getWorldDb(worldId);
    return db.prepare(`SELECT * FROM ${subTable} WHERE id = ? AND world_id = ?`).get(id, worldId);
  }

  createSubEntity(worldId: string, subTable: SubTable, data: Record<string, any>): any {
    this.validateSubTable(subTable);
    const db = getWorldDb(worldId);
    const id = uuidv4();
    const now = new Date().toISOString();

    // Get column names from the table
    const columns = db.prepare(`PRAGMA table_info(${subTable})`).all() as { name: string }[];
    const colNames = columns.map(c => c.name).filter(n => n !== 'created_at' && n !== 'updated_at');

    const insertData: Record<string, any> = { id, world_id: worldId };
    for (const col of colNames) {
      if (col === 'id' || col === 'world_id') continue;
      if (data[col] !== undefined) {
        insertData[col] = typeof data[col] === 'object' ? JSON.stringify(data[col]) : data[col];
      }
    }

    const keys = Object.keys(insertData);
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map(k => insertData[k]);

    db.prepare(`INSERT INTO ${subTable} (${keys.join(', ')}, created_at, updated_at) VALUES (${placeholders}, ?, ?)`).run(...values, now, now);
    return this.getSubEntity(worldId, subTable, id);
  }

  updateSubEntity(worldId: string, subTable: SubTable, id: string, data: Record<string, any>): any {
    this.validateSubTable(subTable);
    const db = getWorldDb(worldId);
    const existing = this.getSubEntity(worldId, subTable, id);
    if (!existing) return null;

    const updates: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (key === 'id' || key === 'world_id' || key === 'created_at') continue;
      updates.push(`${key} = ?`);
      values.push(typeof value === 'object' ? JSON.stringify(value) : value);
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      values.push(id, worldId);
      db.prepare(`UPDATE ${subTable} SET ${updates.join(', ')} WHERE id = ? AND world_id = ?`).run(...values);
    }

    return this.getSubEntity(worldId, subTable, id);
  }

  deleteSubEntity(worldId: string, subTable: SubTable, id: string): boolean {
    this.validateSubTable(subTable);
    const db = getWorldDb(worldId);
    const result = db.prepare(`DELETE FROM ${subTable} WHERE id = ? AND world_id = ?`).run(id, worldId);
    return result.changes > 0;
  }

  // Get all magic system data for a world (dashboard overview)
  getOverview(worldId: string): Record<SubTable, number> {
    const db = getWorldDb(worldId);
    const result = {} as Record<SubTable, number>;
    for (const table of SUB_TABLES) {
      const row = db.prepare(`SELECT COUNT(*) as count FROM ${table} WHERE world_id = ?`).get(worldId) as { count: number };
      result[table] = row.count;
    }
    return result;
  }

  static getSubTableList(): readonly string[] {
    return SUB_TABLES;
  }

  static getSubTableLabel(table: string): string {
    const labels: Record<string, string> = {
      magic_sources: 'Magic Sources',
      magic_energy_types: 'Energy Types',
      magic_laws: 'Fundamental Laws',
      magic_taxonomies: 'Schools & Traditions',
      magical_materials: 'Magical Materials',
      spell_classifications: 'Spell Classifications',
      magic_costs_consequences: 'Costs & Consequences',
      magical_phenomena: 'Magical Phenomena',
      power_scaling_framework: 'Power Scaling',
    };
    return labels[table] || table;
  }
}
