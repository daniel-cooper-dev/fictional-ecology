import { getWorldDb } from '../db/connection.js';
import { WorldService } from './WorldService.js';
import { ALL_DOMAINS } from '../domains/index.js';

export class ExportService {
  private worldService = new WorldService();

  exportWorld(worldId: string): any {
    const world = this.worldService.get(worldId);
    if (!world) throw new Error('World not found');
    const db = getWorldDb(worldId);

    const exportData: any = {
      version: 1,
      exported_at: new Date().toISOString(),
      world: {
        name: world.name,
        tagline: world.tagline,
        description: world.description,
        magic_enabled: world.magic_enabled,
      },
      elements: [],
      relationships: [],
      tags: [],
      eras: [],
      calendars: [],
    };

    const elements = db.prepare('SELECT * FROM world_elements WHERE world_id = ?').all(worldId);
    for (const el of elements as any[]) {
      const domain = ALL_DOMAINS.find(d => d.id === el.domain);
      let extension = null;
      let magicAspects = null;

      if (domain) {
        try {
          extension = db.prepare(`SELECT * FROM ${domain.tableName} WHERE element_id = ?`).get(el.id);
        } catch (err) {
          console.warn('Export: table may not exist -', (err as Error).message);
          extension = null;
        }
        if (domain.magicPermeation) {
          try {
            magicAspects = db.prepare(`SELECT * FROM ${domain.magicPermeation.companionTable} WHERE parent_id = ?`).get(el.id);
          } catch (err) {
            console.warn('Export: table may not exist -', (err as Error).message);
            magicAspects = null;
          }
        }
      }

      exportData.elements.push({
        id: el.id,
        domain: el.domain,
        element_type: el.element_type,
        name: el.name,
        summary: el.summary,
        detailed_notes: el.detailed_notes,
        custom_fields: el.custom_fields,
        extension,
        magic_aspects: magicAspects,
      });
    }

    exportData.relationships = db.prepare('SELECT * FROM relationships WHERE world_id = ?').all(worldId);

    const tags = db.prepare('SELECT * FROM tags WHERE world_id = ?').all(worldId) as any[];
    for (const tag of tags) {
      const elementTags = db.prepare('SELECT element_id FROM element_tags WHERE tag_id = ?').all(tag.id) as any[];
      exportData.tags.push({
        ...tag,
        element_ids: elementTags.map((et: any) => et.element_id),
      });
    }

    try {
      exportData.eras = db.prepare('SELECT * FROM eras WHERE world_id = ?').all(worldId);
    } catch (err) {
      console.warn('Export: table may not exist -', (err as Error).message);
      exportData.eras = [];
    }

    try {
      exportData.calendars = db.prepare('SELECT * FROM calendars WHERE world_id = ?').all(worldId);
    } catch (err) {
      console.warn('Export: table may not exist -', (err as Error).message);
      exportData.calendars = [];
    }

    const magicSubTables = [
      'magic_sources', 'magic_energy_types', 'magic_laws', 'magic_taxonomies',
      'magical_materials', 'spell_classifications', 'magic_costs_consequences',
      'magical_phenomena', 'power_scaling_framework'
    ];
    exportData.magic_system = {};
    for (const table of magicSubTables) {
      try {
        exportData.magic_system[table] = db.prepare(`SELECT * FROM ${table} WHERE world_id = ?`).all(worldId);
      } catch (err) {
        console.warn('Export: table may not exist -', (err as Error).message);
        exportData.magic_system[table] = [];
      }
    }

    return exportData;
  }

  exportWorldAsMarkdown(worldId: string): string {
    const data = this.exportWorld(worldId);
    let md = `# ${data.world.name}\n\n`;
    if (data.world.tagline) md += `*${data.world.tagline}*\n\n`;
    if (data.world.description) md += `${data.world.description}\n\n`;
    md += `Magic: ${data.world.magic_enabled ? 'Enabled' : 'Disabled'}\n\n`;

    const byDomain: Record<string, any[]> = {};
    for (const el of data.elements) {
      if (!byDomain[el.domain]) byDomain[el.domain] = [];
      byDomain[el.domain].push(el);
    }

    for (const [domainId, elements] of Object.entries(byDomain)) {
      const domain = ALL_DOMAINS.find(d => d.id === domainId);
      md += `## ${domain ? domain.name : domainId}\n\n`;
      for (const el of elements) {
        md += `### ${el.name}\n`;
        if (el.element_type) md += `**Type:** ${el.element_type}\n`;
        if (el.summary) md += `\n${el.summary}\n`;
        if (el.detailed_notes) md += `\n${el.detailed_notes}\n`;
        if (el.extension) {
          md += '\n**Details:**\n';
          for (const [key, value] of Object.entries(el.extension)) {
            if (key === 'element_id' || !value) continue;
            md += `- ${key.replace(/_/g, ' ')}: ${value}\n`;
          }
        }
        md += '\n';
      }
    }

    if (data.relationships.length > 0) {
      md += `## Relationships\n\n`;
      for (const rel of data.relationships) {
        md += `- ${rel.source_id} → ${rel.target_id} (${rel.relationship_type})\n`;
      }
      md += '\n';
    }

    return md;
  }
}
