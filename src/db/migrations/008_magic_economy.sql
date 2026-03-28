-- Mana Resources
CREATE TABLE IF NOT EXISTS mana_resources (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  name TEXT NOT NULL,
  resource_type TEXT DEFAULT 'raw_mana',
  source_id TEXT,
  energy_type_id TEXT,
  extraction_method TEXT DEFAULT '',
  refinement_process TEXT,
  quality_grades TEXT DEFAULT '[]',
  geographic_distribution TEXT DEFAULT '',
  total_estimated_reserves TEXT DEFAULT '',
  renewability TEXT DEFAULT 'renewable',
  depletion_rate TEXT,
  environmental_impact_of_extraction TEXT DEFAULT '',
  controlling_entities TEXT DEFAULT '',
  strategic_importance TEXT DEFAULT 'moderate',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_mana_resources_world ON mana_resources(world_id);

-- Magic Trade Goods
CREATE TABLE IF NOT EXISTS magic_trade_goods (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  name TEXT NOT NULL,
  good_type TEXT DEFAULT 'enchanted_item',
  description TEXT DEFAULT '',
  base_value TEXT DEFAULT '',
  rarity_in_market TEXT DEFAULT 'uncommon',
  primary_producers TEXT DEFAULT '',
  primary_consumers TEXT DEFAULT '',
  trade_routes TEXT DEFAULT '',
  legal_status TEXT DEFAULT 'unrestricted',
  shelf_life TEXT,
  transport_requirements TEXT,
  substitutes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_trade_goods_world ON magic_trade_goods(world_id);

-- Magic Labor Market
CREATE TABLE IF NOT EXISTS magic_labor_market (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  profession_name TEXT NOT NULL,
  profession_category TEXT DEFAULT 'crafting',
  description TEXT DEFAULT '',
  required_power_tier_id TEXT,
  required_taxonomy_ids TEXT DEFAULT '[]',
  training_duration TEXT DEFAULT '',
  supply_level TEXT DEFAULT 'adequate',
  compensation_level TEXT DEFAULT 'middle',
  social_status TEXT DEFAULT 'middle',
  guild_affiliation TEXT,
  automation_threat TEXT DEFAULT 'none',
  risks TEXT DEFAULT '',
  civilian_vs_military TEXT DEFAULT 'civilian',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_labor_world ON magic_labor_market(world_id);

-- Magic Regulations
CREATE TABLE IF NOT EXISTS magic_regulations (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  name TEXT NOT NULL,
  regulation_type TEXT DEFAULT 'licensing',
  description TEXT DEFAULT '',
  governing_body TEXT DEFAULT '',
  scope TEXT DEFAULT 'national',
  enforceability TEXT DEFAULT 'moderately_enforced',
  penalties TEXT DEFAULT '',
  black_market_impact TEXT,
  civilization_id TEXT,
  historical_origin TEXT,
  controversies TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_regulations_world ON magic_regulations(world_id);

-- Magic Black Markets
CREATE TABLE IF NOT EXISTS magic_black_markets (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  location_description TEXT DEFAULT '',
  specialization TEXT DEFAULT '',
  associated_regulation_ids TEXT DEFAULT '[]',
  scale TEXT DEFAULT 'local',
  organization_type TEXT DEFAULT 'loose_network',
  goods_and_services TEXT DEFAULT '[]',
  risks_to_participants TEXT DEFAULT '',
  law_enforcement_response TEXT DEFAULT '',
  societal_impact TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_black_markets_world ON magic_black_markets(world_id)
;
