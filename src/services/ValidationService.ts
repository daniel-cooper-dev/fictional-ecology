import { getWorldDb } from '../db/connection.js';
import { ALL_DOMAINS } from '../domains/index.js';

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  domain: string;
  element_id?: string;
  element_name?: string;
  message: string;
  suggestion?: string;
}

export class ValidationService {
  validate(worldId: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const db = getWorldDb(worldId);

    this.checkOrphanedElements(db, worldId, issues);
    this.checkEmptyDomains(db, worldId, issues);
    this.checkMissingNames(db, worldId, issues);
    this.checkDanglingRelationships(db, worldId, issues);
    this.checkEcologicalConsistency(db, worldId, issues);
    this.checkMagicConsistency(db, worldId, issues);

    return issues;
  }

  private checkOrphanedElements(db: any, worldId: string, issues: ValidationIssue[]) {
    // Check for elements referencing non-existent parents/dependencies
    try {
      const relationships = db.prepare(`
        SELECT r.*, s.name as source_name, t.name as target_name
        FROM relationships r
        LEFT JOIN world_elements s ON r.source_id = s.id
        LEFT JOIN world_elements t ON r.target_id = t.id
        WHERE r.world_id = ? AND (s.id IS NULL OR t.id IS NULL)
      `).all(worldId) as any[];

      for (const rel of relationships) {
        issues.push({
          severity: 'error',
          domain: 'relationships',
          message: `Relationship references missing element: ${rel.source_name || rel.source_id} -> ${rel.target_name || rel.target_id}`,
          suggestion: 'Delete this broken relationship',
        });
      }
    } catch { /* tables may not exist yet */ }
  }

  private checkEmptyDomains(db: any, worldId: string, issues: ValidationIssue[]) {
    for (const domain of ALL_DOMAINS) {
      if (domain.category === 'magic') continue; // Magic domains are optional
      try {
        const count = db.prepare('SELECT COUNT(*) as count FROM world_elements WHERE world_id = ? AND domain = ?')
          .get(worldId, domain.id) as any;
        if (count.count === 0) {
          issues.push({
            severity: 'info',
            domain: domain.id,
            message: `${domain.name} has no elements yet`,
            suggestion: `Consider adding ${domain.namePlural.toLowerCase()} to flesh out your world`,
          });
        }
      } catch { /* table may not exist */ }
    }
  }

  private checkMissingNames(db: any, worldId: string, issues: ValidationIssue[]) {
    try {
      const unnamed = db.prepare(`
        SELECT id, domain, name FROM world_elements
        WHERE world_id = ? AND (name IS NULL OR name = '' OR TRIM(name) = '')
      `).all(worldId) as any[];

      for (const el of unnamed) {
        issues.push({
          severity: 'error',
          domain: el.domain,
          element_id: el.id,
          element_name: el.name || '(unnamed)',
          message: 'Element has no name',
          suggestion: 'Every element needs a name for identification',
        });
      }
    } catch { /* table may not exist */ }
  }

  private checkDanglingRelationships(db: any, worldId: string, issues: ValidationIssue[]) {
    try {
      // Elements with no relationships
      const isolated = db.prepare(`
        SELECT we.id, we.name, we.domain FROM world_elements we
        WHERE we.world_id = ?
        AND we.id NOT IN (
          SELECT source_id FROM relationships WHERE world_id = ?
          UNION
          SELECT target_id FROM relationships WHERE world_id = ?
        )
      `).all(worldId, worldId, worldId) as any[];

      if (isolated.length > 10) {
        issues.push({
          severity: 'warning',
          domain: 'relationships',
          message: `${isolated.length} elements have no relationships to other elements`,
          suggestion: 'Consider linking elements to show how they connect',
        });
      }
    } catch { /* tables may not exist */ }
  }

  private checkEcologicalConsistency(db: any, worldId: string, issues: ValidationIssue[]) {
    // Check fauna without biomes
    try {
      const homelessFauna = db.prepare(`
        SELECT we.id, we.name, f.biome_ids
        FROM world_elements we
        INNER JOIN fauna f ON f.element_id = we.id
        WHERE we.world_id = ? AND (f.biome_ids IS NULL OR f.biome_ids = '[]' OR f.biome_ids = '')
      `).all(worldId) as any[];

      for (const fauna of homelessFauna) {
        issues.push({
          severity: 'warning',
          domain: 'fauna',
          element_id: fauna.id,
          element_name: fauna.name,
          message: `${fauna.name} has no assigned biomes`,
          suggestion: 'Assign biomes to show where this creature lives',
        });
      }
    } catch { /* table may not exist */ }

    // Check flora without biomes
    try {
      const homelessFlora = db.prepare(`
        SELECT we.id, we.name, f.biome_ids
        FROM world_elements we
        INNER JOIN flora f ON f.element_id = we.id
        WHERE we.world_id = ? AND (f.biome_ids IS NULL OR f.biome_ids = '[]' OR f.biome_ids = '')
      `).all(worldId) as any[];

      for (const fl of homelessFlora) {
        issues.push({
          severity: 'warning',
          domain: 'flora',
          element_id: fl.id,
          element_name: fl.name,
          message: `${fl.name} has no assigned biomes`,
          suggestion: 'Assign biomes to show where this plant grows',
        });
      }
    } catch { /* table may not exist */ }
  }

  private checkMagicConsistency(db: any, worldId: string, issues: ValidationIssue[]) {
    // Check if magic is enabled but no magic sources defined
    try {
      const sourceCount = db.prepare('SELECT COUNT(*) as count FROM magic_sources WHERE world_id = ?')
        .get(worldId) as any;

      if (sourceCount.count === 0) {
        issues.push({
          severity: 'info',
          domain: 'magic_systems',
          message: 'No magic sources defined yet',
          suggestion: 'Define where magic comes from in your world',
        });
      }
    } catch { /* tables may not exist */ }
  }
}
