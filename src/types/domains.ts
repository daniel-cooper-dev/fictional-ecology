export interface FieldDefinition {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'multiselect' | 'json' | 'boolean' | 'range';
  required?: boolean;
  options?: string[];
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
  prompts: string[];
  magicPermeation: MagicPermeationConfig | null;
  defaultSortField?: string;
}

export interface MagicPermeationConfig {
  companionTable: string;
  fields: FieldDefinition[];
  manaSensitivity: 'none' | 'passive' | 'active' | 'reactive';
  planeAware: boolean;
  prompts: string[];
}
