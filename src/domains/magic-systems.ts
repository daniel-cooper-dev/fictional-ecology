import type { DomainConfig } from '../types/domains.js';

export const magicSystemsConfig: DomainConfig = {
  id: 'magic_systems',
  name: 'Magic System',
  namePlural: 'Magic Systems',
  icon: 'sparkles',
  color: '#f39c12',
  description: 'Define the fundamental rules, sources, and taxonomies of magic in your world. This is the master domain for all things magical—energy types, laws, spell classifications, costs, and phenomena. The sub-tables handle the detailed breakdowns; this domain ties them together.',
  tableName: 'world_elements',
  category: 'magic',
  fields: [
    {
      name: 'magic_philosophy',
      label: 'Magic Philosophy',
      type: 'textarea',
      placeholder: 'Describe the overall paradigm — hard vs soft magic, deterministic vs chaotic, scientific vs mystical...',
      helpText: 'The overarching philosophy or paradigm of this magic system — how rigorous, predictable, and systematized magic is in your world.',
    },
    {
      name: 'properties',
      label: 'Properties',
      type: 'json',
      placeholder: '{}',
      helpText: 'Additional properties for this magic system element. The real detail lives in the magic sub-tables (sources, energy types, laws, taxonomies, materials, spells, costs, phenomena, power scaling).',
    },
  ],
  elementTypes: ['source', 'energy_type', 'law', 'taxonomy', 'material', 'spell', 'cost', 'phenomenon', 'power_tier'],
  prompts: [
    'What is the fundamental source of magic in your world? Is it an ambient energy field, a gift from deities, an innate biological trait, or something stranger?',
    'What are the hard limits of magic? Every compelling magic system has costs and constraints—what can magic never do, and what price does it extract?',
    'How many distinct types of magical energy exist? Do they interact, combine, or cancel each other out?',
    'How is magic classified by its practitioners? Do they use schools, elements, colors, musical keys, or something unique to your world?',
    'What happens when magic goes wrong? Are there catastrophic failures, wild magic surges, or subtle corruptions that accumulate over time?',
  ],
  magicPermeation: null,
  defaultSortField: 'name',
};
