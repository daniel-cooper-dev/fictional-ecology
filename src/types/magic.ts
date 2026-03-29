// Magic System sub-entity types

export interface MagicSource {
  id: string;
  world_id: string;
  name: string;
  source_category: string;
  description: string;
  origin_story: string;
  abundance: string;
  accessibility: string;
  stability: string;
  geographic_distribution: string; // JSON
  plane_id: string | null;
  renewability: string;
  discovery_era: string;
  interaction_rules: string; // JSON
  raw_output_type_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MagicEnergyType {
  id: string;
  world_id: string;
  name: string;
  particle_name: string | null;
  is_quasi_physical: boolean;
  measurable: boolean;
  unit_of_measurement: string | null;
  color_visual: string | null;
  visual_manifestation: string;
  interaction_with_matter: string;
  decay_rate: string | null;
  can_be_stored: boolean;
  storage_methods: string | null;
  conversion_rules: string; // JSON
  created_at: string;
  updated_at: string;
}

export interface MagicLaw {
  id: string;
  world_id: string;
  name: string;
  law_category: string;
  formal_statement: string;
  narrative_description: string;
  exceptions: string | null;
  consequences_of_violation: string;
  relationship_to_physics: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface MagicTaxonomy {
  id: string;
  world_id: string;
  name: string;
  taxonomy_type: string;
  parent_id: string | null;
  description: string;
  primary_source_id: string | null;
  primary_energy_type_id: string | null;
  difficulty_level: string;
  cultural_origin_id: string | null;
  perception: string;
  requirements: string; // JSON
  incompatibilities: string; // JSON
  signature_effects: string;
  created_at: string;
  updated_at: string;
}

export interface MagicalMaterial {
  id: string;
  world_id: string;
  name: string;
  material_type: string;
  description: string;
  magical_properties: string; // JSON
  rarity: string;
  source_location: string;
  extraction_method: string;
  refinement_process: string | null;
  energy_type_affinity_id: string | null;
  conductivity: number;
  capacity: number;
  resistance: number;
  stability_rating: number;
  mundane_properties: string;
  dangers: string | null;
  created_at: string;
  updated_at: string;
}

export interface SpellClassification {
  id: string;
  world_id: string;
  name: string;
  taxonomy_id: string;
  tier: number;
  classification_type: string;
  casting_method: string;
  duration_type: string;
  range_type: string;
  area_type: string | null;
  energy_cost_base: number;
  energy_type_id: string;
  material_components: string | null; // JSON
  casting_time: string;
  cooldown: string | null;
  side_effects: string | null;
  failure_consequences: string | null;
  counter_methods: string | null;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface MagicCostConsequence {
  id: string;
  world_id: string;
  name: string;
  cost_category: string;
  description: string;
  severity_scale: string; // JSON
  trigger_conditions: string;
  accumulation: boolean;
  reversibility: string;
  cure_method: string | null;
  affected_taxonomies: string; // JSON
  created_at: string;
  updated_at: string;
}

export interface MagicalPhenomenon {
  id: string;
  world_id: string;
  name: string;
  phenomenon_type: string;
  description: string;
  causes: string;
  frequency: string;
  duration_typical: string;
  geographic_scope: string;
  effects_on_magic: string;
  effects_on_living: string;
  effects_on_environment: string;
  danger_level: string;
  predictability: string;
  created_at: string;
  updated_at: string;
}

export interface PowerScalingTier {
  id: string;
  world_id: string;
  tier_number: number;
  tier_name: string;
  description: string;
  typical_abilities: string;
  energy_capacity_range: string;
  population_percentage: number;
  requirements_to_reach: string;
  title_granted: string | null;
  limitations: string;
  created_at: string;
  updated_at: string;
}

// Source categories
export const MAGIC_SOURCE_CATEGORIES = [
  'ley_line', 'crystal', 'divine', 'innate_biological', 'dimensional',
  'emotional', 'elemental', 'cosmic', 'ancestral', 'symbiotic',
  'artificial', 'void', 'temporal', 'custom'
] as const;

export const MAGIC_LAW_CATEGORIES = [
  'conservation', 'entropy', 'equivalence', 'exclusion', 'interaction',
  'sympathy', 'contagion', 'similarity', 'true_naming', 'intent', 'custom'
] as const;

export const TAXONOMY_TYPES = [
  'school', 'discipline', 'tradition', 'element', 'philosophy',
  'technique', 'forbidden', 'lost'
] as const;

export const MATERIAL_TYPES = [
  'metal', 'crystal', 'organic', 'liquid', 'gas', 'composite',
  'exotic', 'planar', 'synthetic'
] as const;

export const SPELL_CLASSIFICATION_TYPES = [
  'cantrip', 'ritual', 'incantation', 'invocation', 'enchantment',
  'ward', 'curse', 'blessing', 'transmutation', 'divination',
  'summoning', 'custom'
] as const;

export const CASTING_METHODS = [
  'verbal', 'somatic', 'material', 'mental', 'written',
  'musical', 'dance', 'blood', 'combined'
] as const;

export const RARITY_LEVELS = [
  'common', 'uncommon', 'rare', 'very_rare', 'legendary', 'mythic', 'unique'
] as const;

export const DANGER_LEVELS = [
  'harmless', 'minor', 'moderate', 'dangerous', 'catastrophic', 'apocalyptic'
] as const;

export const POWER_DIFFICULTY_LEVELS = [
  'novice', 'apprentice', 'journeyman', 'master', 'grandmaster', 'mythic'
] as const;
