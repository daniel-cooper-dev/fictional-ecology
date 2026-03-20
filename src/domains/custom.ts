import type { DomainConfig } from '../types/domains.js';

export const customConfig: DomainConfig = {
  id: 'custom',
  name: 'Custom Element',
  namePlural: 'Custom Elements',
  icon: 'puzzle',
  color: '#bdc3c7',
  description: 'Create world elements that don\'t fit neatly into any other domain. Custom elements store their data as flexible JSON properties, letting you define whatever structure your world needs—unique systems, hybrid concepts, or entirely novel categories.',
  tableName: 'world_elements',
  category: 'meta',
  fields: [
    {
      name: 'properties',
      label: 'Properties',
      type: 'json',
      placeholder: '{"key": "value"}',
      helpText: 'A flexible JSON object for storing any structured data. Define whatever fields your custom element needs.',
    },
  ],
  elementTypes: ['custom'],
  prompts: [
    'What aspect of your world doesn\'t fit into the existing domains? Consider unique systems, hybrid concepts, or entirely new categories that make your world distinct.',
    'How does this custom element connect to the rest of your world? Even unique concepts gain depth when they interact with established systems like magic, ecology, or civilization.',
  ],
  magicPermeation: null,
  defaultSortField: 'name',
};
