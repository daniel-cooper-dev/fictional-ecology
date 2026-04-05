import { v4 as uuidv4 } from 'uuid';
import { getWorldDb } from '../db/connection.js';

export const RELATIONSHIP_TYPES = [
  'contains', 'located_in', 'borders', 'influences', 'depends_on',
  'evolved_from', 'created_by', 'trades_with', 'conflicts_with',
  'allied_with', 'worships', 'uses', 'consumes', 'produces',
  'part_of', 'variant_of', 'powers', 'inhibits', 'custom',
] as const;

export class RelationshipService {
  listForElement(worldId: string, elementId: string): any[] {
    const db = getWorldDb(worldId);
    return db.prepare(`
      SELECT r.*,
        s.name as source_name, s.domain as source_domain,
        t.name as target_name, t.domain as target_domain
      FROM relationships r
      LEFT JOIN world_elements s ON r.source_id = s.id
      LEFT JOIN world_elements t ON r.target_id = t.id
      WHERE r.world_id = ? AND (r.source_id = ? OR r.target_id = ?)
      ORDER BY r.created_at DESC
    `).all(worldId, elementId, elementId);
  }

  listForWorld(worldId: string): any[] {
    const db = getWorldDb(worldId);
    return db.prepare(`
      SELECT r.*,
        s.name as source_name, s.domain as source_domain,
        t.name as target_name, t.domain as target_domain
      FROM relationships r
      LEFT JOIN world_elements s ON r.source_id = s.id
      LEFT JOIN world_elements t ON r.target_id = t.id
      WHERE r.world_id = ?
      ORDER BY r.created_at DESC
    `).all(worldId);
  }

  create(worldId: string, data: {
    source_id: string;
    target_id: string;
    relationship_type: string;
    description?: string;
    strength?: string;
    bidirectional?: boolean;
  }): any {
    const db = getWorldDb(worldId);
    const id = uuidv4();
    db.prepare(`
      INSERT INTO relationships (id, world_id, source_id, target_id, relationship_type, description, strength, bidirectional)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, worldId, data.source_id, data.target_id, data.relationship_type,
      data.description || '', data.strength || 'moderate', data.bidirectional ? 1 : 0);
    return db.prepare('SELECT * FROM relationships WHERE id = ?').get(id);
  }

  delete(worldId: string, id: string): boolean {
    const db = getWorldDb(worldId);
    const result = db.prepare('DELETE FROM relationships WHERE id = ? AND world_id = ?').run(id, worldId);
    return result.changes > 0;
  }

  // Get graph data for D3 visualization
  getGraphData(worldId: string, domainFilter?: string[]): { nodes: any[]; links: any[] } {
    const db = getWorldDb(worldId);

    let nodesSql = 'SELECT id, name, domain, element_type FROM world_elements WHERE world_id = ?';
    const nodesParams: any[] = [worldId];
    if (domainFilter && domainFilter.length > 0) {
      nodesSql += ` AND domain IN (${domainFilter.map(() => '?').join(',')})`;
      nodesParams.push(...domainFilter);
    }
    const nodes = db.prepare(nodesSql).all(...nodesParams);

    let linksSql = 'SELECT source_id as source, target_id as target, relationship_type, strength FROM relationships WHERE world_id = ?';
    const links = db.prepare(linksSql).all(worldId);

    return { nodes, links };
  }
}
