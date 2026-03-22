export interface FieldDefinition {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'multiselect' | 'json' | 'boolean' | 'range';
  required?: boolean;
  options?: string[];
  optionDescriptions?: Record<string, string>;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  helpText?: string;
}

export interface DomainConfig {
  id: string;
  name: string;
  namePlural: string;
  icon: string;
  color: string;
  description: string;
  tableName: string;
  category: 'natural' | 'sentient' | 'magic' | 'meta';
  fields: FieldDefinition[];
  elementTypes: string[];
  elementTypeDescriptions?: Record<string, string>;
  prompts: string[];
  magicPermeation: MagicPermeationConfig | null;
  defaultSortField?: string;
  archetypes?: Archetype[];
}

export interface Archetype {
  id: string;
  name: string;
  description: string;
  element_type: string;
  summary?: string;
  detailed_notes?: string;
  fields: Record<string, any>;
}

export interface MagicPermeationConfig {
  companionTable: string;
  fields: FieldDefinition[];
  manaSensitivity: 'none' | 'passive' | 'active' | 'reactive';
  planeAware: boolean;
  prompts: string[];
}
