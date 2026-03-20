-- Mana Cycles
CREATE TABLE IF NOT EXISTS mana_cycles (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  name TEXT NOT NULL,
  energy_type_id TEXT,
  description TEXT DEFAULT '',
  stages TEXT DEFAULT '[]',
  cycle_duration TEXT DEFAULT '',
  geographic_scope TEXT DEFAULT 'global',
  key_organisms TEXT DEFAULT '',
  key_geological_features TEXT DEFAULT '',
  disruption_risks TEXT DEFAULT '',
  historical_disruptions TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_mana_cycles_world ON mana_cycles(world_id);

-- Magical Mutations
CREATE TABLE IF NOT EXISTS magical_mutations (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  name TEXT NOT NULL,
  mutation_type TEXT DEFAULT 'mixed',
  cause TEXT DEFAULT 'high_mana_exposure',
  description TEXT DEFAULT '',
  affected_entity_type TEXT DEFAULT 'all',
  physical_changes TEXT DEFAULT '',
  magical_changes TEXT DEFAULT '',
  heritability TEXT DEFAULT 'non_heritable',
  reversibility TEXT DEFAULT 'partially_reversible',
  prevalence TEXT DEFAULT 'rare',
  geographic_association TEXT,
  associated_phenomenon_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_mutations_world ON magical_mutations(world_id);

-- Magical Food Webs
CREATE TABLE IF NOT EXISTS magical_food_webs (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  name TEXT NOT NULL,
  biome_id TEXT,
  ecosystem_id TEXT,
  description TEXT DEFAULT '',
  mana_producers TEXT DEFAULT '[]',
  mana_consumers TEXT DEFAULT '[]',
  mana_decomposers TEXT DEFAULT '[]',
  apex_magical_predators TEXT DEFAULT '[]',
  energy_flow_description TEXT DEFAULT '',
  stability TEXT DEFAULT 'stable',
  keystone_species TEXT DEFAULT '',
  sentient_impact TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_magic_food_webs_world ON magical_food_webs(world_id);

-- Mana-Saturated Environments
CREATE TABLE IF NOT EXISTS mana_saturated_environments (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  name TEXT NOT NULL,
  saturation_level TEXT DEFAULT 'moderate',
  energy_type_id TEXT,
  environment_type TEXT DEFAULT 'wild_magic_zone',
  description TEXT DEFAULT '',
  geographic_location TEXT DEFAULT '',
  biome_id TEXT,
  area_size TEXT DEFAULT '',
  cause TEXT DEFAULT '',
  stability TEXT DEFAULT 'stable',
  effects_on_flora TEXT DEFAULT '',
  effects_on_fauna TEXT DEFAULT '',
  effects_on_sentients TEXT DEFAULT '',
  effects_on_magic_use TEXT DEFAULT '',
  effects_on_technology TEXT DEFAULT '',
  habitable INTEGER DEFAULT 1,
  resource_value TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_mana_env_world ON mana_saturated_environments(world_id)
;
