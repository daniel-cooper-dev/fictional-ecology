import { getWorldDb } from '../db/connection.js';

function sanitizeSnippet(html: string): string {
  // Strip all HTML except <mark> tags
  return html
    .replace(/<(?!\/?mark\b)[^>]*>/gi, '')
    .replace(/&(?!amp;|lt;|gt;|quot;)/g, '&amp;');
}

export class SearchService {
  search(worldId: string, query: string, domain?: string, limit = 50): any[] {
    const db = getWorldDb(worldId);
    if (!query.trim()) return [];

    // Escape special FTS5 characters and add prefix matching
    const sanitized = query.replace(/['"*()]/g, '').trim();
    const ftsQuery = sanitized.split(/\s+/).map(w => `"${w}"*`).join(' ');

    try {
      let sql = `
        SELECT f.element_id, f.domain, f.name,
               snippet(world_elements_fts, 4, '<mark>', '</mark>', '...', 32) as snippet,
               rank
        FROM world_elements_fts f
        WHERE world_elements_fts MATCH ?
      `;
      const params: any[] = [ftsQuery];

      if (domain) {
        sql += ` AND f.domain = ?`;
        params.push(domain);
      }

      sql += ` ORDER BY rank LIMIT ?`;
      params.push(limit);

      return db.prepare(sql).all(...params).map((r: any) => ({
        ...r,
        snippet: r.snippet ? sanitizeSnippet(r.snippet) : '',
      }));
    } catch {
      // Fallback to LIKE search if FTS fails
      let sql = `
        SELECT id as element_id, domain, name, summary as snippet, 0 as rank
        FROM world_elements
        WHERE (name LIKE ? ESCAPE '\\' OR summary LIKE ? ESCAPE '\\' OR detailed_notes LIKE ? ESCAPE '\\')
      `;
      const likeSafe = sanitized.replace(/[%_]/g, '\\$&');
      const like = `%${likeSafe}%`;
      const params: any[] = [like, like, like];

      if (domain) {
        sql += ` AND domain = ?`;
        params.push(domain);
      }

      sql += ` ORDER BY updated_at DESC LIMIT ?`;
      params.push(limit);

      return db.prepare(sql).all(...params).map((r: any) => ({
        ...r,
        snippet: r.snippet ? sanitizeSnippet(r.snippet) : '',
      }));
    }
  }
}
