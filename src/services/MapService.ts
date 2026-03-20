import { v4 as uuidv4 } from 'uuid';
import { getWorldDb } from '../db/connection.js';

export class MapService {
  listMaps(worldId: string): any[] {
    const db = getWorldDb(worldId);
    return db.prepare('SELECT * FROM maps WHERE world_id = ? ORDER BY created_at DESC').all(worldId);
  }

  getMap(worldId: string, mapId: string): any {
    const db = getWorldDb(worldId);
    return db.prepare('SELECT * FROM maps WHERE id = ? AND world_id = ?').get(mapId, worldId);
  }

  createMap(worldId: string, data: any): any {
    const db = getWorldDb(worldId);
    const id = uuidv4();
    db.prepare(`
      INSERT INTO maps (id, world_id, name, image_path, width, height, scale_label, map_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, worldId, data.name, data.image_path || '', data.width || 800, data.height || 600,
      data.scale_label || '', data.map_type || 'world');
    return this.getMap(worldId, id);
  }

  deleteMap(worldId: string, mapId: string): boolean {
    const db = getWorldDb(worldId);
    return db.prepare('DELETE FROM maps WHERE id = ? AND world_id = ?').run(mapId, worldId).changes > 0;
  }

  // Pins
  listPins(worldId: string, mapId: string): any[] {
    const db = getWorldDb(worldId);
    return db.prepare(`
      SELECT mp.*, we.name as element_name, we.domain as element_domain
      FROM map_pins mp
      LEFT JOIN world_elements we ON we.id = mp.element_id
      WHERE mp.map_id = ?
      ORDER BY mp.label
    `).all(mapId);
  }

  createPin(worldId: string, mapId: string, data: any): any {
    const db = getWorldDb(worldId);
    const id = uuidv4();
    db.prepare(`
      INSERT INTO map_pins (id, map_id, element_id, x, y, label, icon, color)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, mapId, data.element_id || null, data.x || 0.5, data.y || 0.5,
      data.label || '', data.icon || 'pin', data.color || '#ffffff');
    return db.prepare('SELECT * FROM map_pins WHERE id = ?').get(id);
  }

  updatePin(worldId: string, pinId: string, data: any): void {
    const db = getWorldDb(worldId);
    db.prepare(`
      UPDATE map_pins SET x = ?, y = ?, label = ?, color = ?
      WHERE id = ? AND map_id IN (SELECT id FROM maps WHERE world_id = ?)
    `).run(data.x, data.y, data.label || '', data.color || '#ffffff', pinId, worldId);
  }

  deletePin(worldId: string, pinId: string): boolean {
    const db = getWorldDb(worldId);
    return db.prepare(`
      DELETE FROM map_pins WHERE id = ? AND map_id IN (SELECT id FROM maps WHERE world_id = ?)
    `).run(pinId, worldId).changes > 0;
  }

  // Regions
  listRegions(worldId: string, mapId: string): any[] {
    const db = getWorldDb(worldId);
    return db.prepare(`
      SELECT mr.*, we.name as element_name, we.domain as element_domain
      FROM map_regions mr
      LEFT JOIN world_elements we ON we.id = mr.element_id
      WHERE mr.map_id = ?
    `).all(mapId);
  }

  createRegion(worldId: string, mapId: string, data: any): any {
    const db = getWorldDb(worldId);
    const id = uuidv4();
    db.prepare(`
      INSERT INTO map_regions (id, map_id, element_id, points, fill_color, border_color, label)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, mapId, data.element_id || null, JSON.stringify(data.points || []),
      data.fill_color || 'rgba(100,100,255,0.3)', data.border_color || '#6464ff', data.label || '');
    return db.prepare('SELECT * FROM map_regions WHERE id = ?').get(id);
  }

  deleteRegion(worldId: string, regionId: string): boolean {
    const db = getWorldDb(worldId);
    return db.prepare(`
      DELETE FROM map_regions WHERE id = ? AND map_id IN (SELECT id FROM maps WHERE world_id = ?)
    `).run(regionId, worldId).changes > 0;
  }

  // Full map data for SVG editor
  getMapData(worldId: string, mapId: string): any {
    const map = this.getMap(worldId, mapId);
    if (!map) return null;
    const pins = this.listPins(worldId, mapId);
    const regions = this.listRegions(worldId, mapId);
    return { map, pins, regions };
  }
}
