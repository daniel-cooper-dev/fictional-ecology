-- Magitech Eras
CREATE TABLE IF NOT EXISTS magitech_eras (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  name TEXT NOT NULL,
  era_order INTEGER DEFAULT 0,
  start_description TEXT DEFAULT '',
  end_description TEXT,
  duration TEXT DEFAULT '',
  key_discovery TEXT DEFAULT '',
  technology_level TEXT DEFAULT 'basic',
  magic_integration_level TEXT DEFAULT 'separate',
  description TEXT DEFAULT '',
  societal_impact TEXT DEFAULT '',
  dominant_civilization_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_magitech_eras_world ON magitech_eras(world_id);

-- Arcane Engineering Principles
CREATE TABLE IF NOT EXISTS arcane_engineering_principles (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  name TEXT NOT NULL,
  principle_category TEXT DEFAULT 'energy_transfer',
  description TEXT DEFAULT '',
  discovery_era_id TEXT,
  prerequisite_principles TEXT DEFAULT '[]',
  underlying_magic_laws TEXT DEFAULT '[]',
  key_materials TEXT DEFAULT '[]',
  difficulty TEXT DEFAULT 'intermediate',
  current_understanding TEXT DEFAULT 'fully_understood',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_principles_world ON arcane_engineering_principles(world_id);

-- Magitech Devices
CREATE TABLE IF NOT EXISTS magitech_devices (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  name TEXT NOT NULL,
  device_category TEXT DEFAULT 'energy',
  description TEXT DEFAULT '',
  engineering_principle_ids TEXT DEFAULT '[]',
  era_id TEXT,
  power_source TEXT DEFAULT '',
  energy_type_id TEXT,
  materials_required TEXT DEFAULT '[]',
  complexity TEXT DEFAULT 'moderate',
  reliability TEXT DEFAULT 'reliable',
  availability TEXT DEFAULT 'uncommon',
  cost_level TEXT DEFAULT 'expensive',
  operator_requirements TEXT DEFAULT '',
  failure_modes TEXT DEFAULT '',
  societal_impact TEXT DEFAULT '',
  predecessor_device_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_devices_world ON magitech_devices(world_id);

-- Magitech Infrastructure
CREATE TABLE IF NOT EXISTS magitech_infrastructure (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  name TEXT NOT NULL,
  infrastructure_type TEXT DEFAULT 'mana_grid',
  description TEXT DEFAULT '',
  scale TEXT DEFAULT 'city',
  builder_civilization_id TEXT,
  era_id TEXT,
  operating_status TEXT DEFAULT 'operational',
  key_components TEXT DEFAULT '[]',
  maintenance_requirements TEXT DEFAULT '',
  vulnerabilities TEXT DEFAULT '',
  coverage_description TEXT DEFAULT '',
  users_description TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_infrastructure_world ON magitech_infrastructure(world_id);

-- Magitech Research Nodes (tech tree)
CREATE TABLE IF NOT EXISTS magitech_research_nodes (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  name TEXT NOT NULL,
  research_field TEXT DEFAULT 'fundamental_theory',
  description TEXT DEFAULT '',
  prerequisite_node_ids TEXT DEFAULT '[]',
  era_id TEXT,
  breakthrough_description TEXT DEFAULT '',
  discoverer TEXT,
  civilization_id TEXT,
  unlocks TEXT DEFAULT '[]',
  current_status TEXT DEFAULT 'achieved',
  difficulty_to_achieve TEXT DEFAULT 'moderate',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_research_world ON magitech_research_nodes(world_id);

-- Magitech Failures & Disasters
CREATE TABLE IF NOT EXISTS magitech_failures (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  name TEXT NOT NULL,
  failure_type TEXT DEFAULT 'disaster',
  description TEXT DEFAULT '',
  cause_device_id TEXT,
  cause_infrastructure_id TEXT,
  scale TEXT DEFAULT 'local',
  casualties_description TEXT,
  environmental_impact TEXT DEFAULT '',
  long_term_consequences TEXT DEFAULT '',
  resolution TEXT,
  preventive_measures_adopted TEXT,
  historical_era_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_failures_world ON magitech_failures(world_id)
;
