import { v4 as uuidv4 } from 'uuid';
import { getWorldDb } from '../db/connection.js';

export class TimelineService {
  // Eras
  listEras(worldId: string): any[] {
    const db = getWorldDb(worldId);
    return db.prepare('SELECT * FROM eras WHERE world_id = ? ORDER BY sort_order, start_year').all(worldId);
  }

  getEra(worldId: string, eraId: string): any {
    const db = getWorldDb(worldId);
    return db.prepare('SELECT * FROM eras WHERE id = ? AND world_id = ?').get(eraId, worldId);
  }

  createEra(worldId: string, data: any): any {
    const db = getWorldDb(worldId);
    const id = uuidv4();
    db.prepare(`
      INSERT INTO eras (id, world_id, calendar_id, name, start_year, end_year, description, color, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, worldId, data.calendar_id || null, data.name, data.start_year || 0, data.end_year || null,
      data.description || '', data.color || '#4a9eff', data.sort_order || 0);
    return this.getEra(worldId, id);
  }

  updateEra(worldId: string, eraId: string, data: any): any {
    const db = getWorldDb(worldId);
    db.prepare(`
      UPDATE eras SET name = ?, start_year = ?, end_year = ?, description = ?, color = ?, sort_order = ?, calendar_id = ?
      WHERE id = ? AND world_id = ?
    `).run(data.name, data.start_year || 0, data.end_year || null, data.description || '',
      data.color || '#4a9eff', data.sort_order || 0, data.calendar_id || null, eraId, worldId);
    return this.getEra(worldId, eraId);
  }

  deleteEra(worldId: string, eraId: string): boolean {
    const db = getWorldDb(worldId);
    return db.prepare('DELETE FROM eras WHERE id = ? AND world_id = ?').run(eraId, worldId).changes > 0;
  }

  // Calendars
  listCalendars(worldId: string): any[] {
    const db = getWorldDb(worldId);
    return db.prepare('SELECT * FROM calendars WHERE world_id = ? ORDER BY name').all(worldId);
  }

  getCalendar(worldId: string, calendarId: string): any {
    const db = getWorldDb(worldId);
    return db.prepare('SELECT * FROM calendars WHERE id = ? AND world_id = ?').get(calendarId, worldId);
  }

  createCalendar(worldId: string, data: any): any {
    const db = getWorldDb(worldId);
    const id = uuidv4();
    db.prepare(`
      INSERT INTO calendars (id, world_id, name, days_per_year, months, days_per_week, day_names, epoch_year, epoch_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, worldId, data.name, data.days_per_year || 365,
      JSON.stringify(data.months || []), data.days_per_week || 7,
      JSON.stringify(data.day_names || []), data.epoch_year || 0, data.epoch_name || '');
    return this.getCalendar(worldId, id);
  }

  deleteCalendar(worldId: string, calendarId: string): boolean {
    const db = getWorldDb(worldId);
    return db.prepare('DELETE FROM calendars WHERE id = ? AND world_id = ?').run(calendarId, worldId).changes > 0;
  }

  // Timeline data for D3 visualization
  getTimelineData(worldId: string): any {
    const db = getWorldDb(worldId);
    const eras = db.prepare('SELECT * FROM eras WHERE world_id = ? ORDER BY start_year').all(worldId) as any[];
    const events = db.prepare(`
      SELECT we.id, we.name, we.summary, he.year_in_world, he.duration, he.event_type, he.era_id
      FROM world_elements we
      INNER JOIN historical_events he ON he.element_id = we.id
      WHERE we.world_id = ?
      ORDER BY CAST(he.year_in_world AS INTEGER)
    `).all(worldId);
    const calendars = db.prepare('SELECT * FROM calendars WHERE world_id = ?').all(worldId);
    return { eras, events, calendars };
  }
}
