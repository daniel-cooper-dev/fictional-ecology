-- Magic Sources
CREATE TABLE IF NOT EXISTS magic_sources (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  name TEXT NOT NULL,
  source_category TEXT DEFAULT 'custom',
  description TEXT DEFAULT '',
  origin_story TEXT DEFAULT '',
  abundance TEXT DEFAULT 'common',
  accessibility TEXT DEFAULT 'open',
  stability TEXT DEFAULT 'stable',
  geographic_distribution TEXT DEFAULT '{}',
  plane_id TEXT,
  renewability TEXT DEFAULT 'renewable',
  discovery_era TEXT DEFAULT '',
  interaction_rules TEXT DEFAULT '{}',
  raw_output_type_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_magic_sources_world ON magic_sources(world_id);

-- Magic Energy Types
CREATE TABLE IF NOT EXISTS magic_energy_types (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  name TEXT NOT NULL,
  particle_name TEXT,
  is_quasi_physical INTEGER DEFAULT 0,
  measurable INTEGER DEFAULT 0,
  unit_of_measurement TEXT,
  color_visual TEXT,
  visual_manifestation TEXT DEFAULT '',
  interaction_with_matter TEXT DEFAULT '',
  decay_rate TEXT,
  can_be_stored INTEGER DEFAULT 1,
  storage_methods TEXT,
  conversion_rules TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_energy_types_world ON magic_energy_types(world_id);

-- Magic Laws
CREATE TABLE IF NOT EXISTS magic_laws (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  name TEXT NOT NULL,
  law_category TEXT DEFAULT 'custom',
  formal_statement TEXT DEFAULT '',
  narrative_description TEXT DEFAULT '',
  exceptions TEXT,
  consequences_of_violation TEXT DEFAULT '',
  relationship_to_physics TEXT DEFAULT 'parallel',
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_magic_laws_world ON magic_laws(world_id);

-- Magic Taxonomies (schools / disciplines / traditions)
CREATE TABLE IF NOT EXISTS magic_taxonomies (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  name TEXT NOT NULL,
  taxonomy_type TEXT DEFAULT 'school',
  parent_id TEXT,
  description TEXT DEFAULT '',
  primary_source_id TEXT,
  primary_energy_type_id TEXT,
  difficulty_level TEXT DEFAULT 'novice',
  cultural_origin_id TEXT,
  perception TEXT DEFAULT 'respected',
  requirements TEXT DEFAULT '{}',
  incompatibilities TEXT DEFAULT '{}',
  signature_effects TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_taxonomies_world ON magic_taxonomies(world_id);
CREATE INDEX IF NOT EXISTS idx_taxonomies_parent ON magic_taxonomies(parent_id);

-- Magical Materials
CREATE TABLE IF NOT EXISTS magical_materials (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  name TEXT NOT NULL,
  material_type TEXT DEFAULT 'crystal',
  description TEXT DEFAULT '',
  magical_properties TEXT DEFAULT '{}',
  rarity TEXT DEFAULT 'uncommon',
  source_location TEXT DEFAULT '',
  extraction_method TEXT DEFAULT '',
  refinement_process TEXT,
  energy_type_affinity_id TEXT,
  conductivity INTEGER DEFAULT 5,
  capacity INTEGER DEFAULT 5,
  resistance INTEGER DEFAULT 5,
  stability_rating INTEGER DEFAULT 5,
  mundane_properties TEXT DEFAULT '',
  dangers TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_materials_world ON magical_materials(world_id);

-- Spell Classifications
CREATE TABLE IF NOT EXISTS spell_classifications (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  name TEXT NOT NULL,
  taxonomy_id TEXT,
  tier INTEGER DEFAULT 1,
  classification_type TEXT DEFAULT 'incantation',
  casting_method TEXT DEFAULT 'verbal',
  duration_type TEXT DEFAULT 'instantaneous',
  range_type TEXT DEFAULT 'short',
  area_type TEXT,
  energy_cost_base INTEGER DEFAULT 1,
  energy_type_id TEXT,
  material_components TEXT,
  casting_time TEXT DEFAULT '',
  cooldown TEXT,
  side_effects TEXT,
  failure_consequences TEXT,
  counter_methods TEXT,
  description TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_spells_world ON spell_classifications(world_id);
CREATE INDEX IF NOT EXISTS idx_spells_taxonomy ON spell_classifications(taxonomy_id);

-- Magic Costs & Consequences
CREATE TABLE IF NOT EXISTS magic_costs_consequences (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  name TEXT NOT NULL,
  cost_category TEXT DEFAULT 'physical',
  description TEXT DEFAULT '',
  severity_scale TEXT DEFAULT '[]',
  trigger_conditions TEXT DEFAULT '',
  accumulation INTEGER DEFAULT 0,
  reversibility TEXT DEFAULT 'fully_reversible',
  cure_method TEXT,
  affected_taxonomies TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_costs_world ON magic_costs_consequences(world_id);

-- Magical Phenomena
CREATE TABLE IF NOT EXISTS magical_phenomena (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phenomenon_type TEXT DEFAULT 'custom',
  description TEXT DEFAULT '',
  causes TEXT DEFAULT '',
  frequency TEXT DEFAULT 'rare',
  duration_typical TEXT DEFAULT '',
  geographic_scope TEXT DEFAULT 'local',
  effects_on_magic TEXT DEFAULT '',
  effects_on_living TEXT DEFAULT '',
  effects_on_environment TEXT DEFAULT '',
  danger_level TEXT DEFAULT 'moderate',
  predictability TEXT DEFAULT 'partially_predictable',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_phenomena_world ON magical_phenomena(world_id);

-- Power Scaling Framework
CREATE TABLE IF NOT EXISTS power_scaling_framework (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  tier_number INTEGER DEFAULT 1,
  tier_name TEXT NOT NULL,
  description TEXT DEFAULT '',
  typical_abilities TEXT DEFAULT '',
  energy_capacity_range TEXT DEFAULT '',
  population_percentage REAL DEFAULT 0,
  requirements_to_reach TEXT DEFAULT '',
  title_granted TEXT,
  limitations TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_power_scaling_world ON power_scaling_framework(world_id)
;
