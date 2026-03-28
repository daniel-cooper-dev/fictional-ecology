-- Generic cross-domain relationships
CREATE TABLE IF NOT EXISTS relationships (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  description TEXT DEFAULT '',
  strength TEXT DEFAULT 'moderate',
  bidirectional INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_rel_world ON relationships(world_id);
CREATE INDEX IF NOT EXISTS idx_rel_source ON relationships(source_id);
CREATE INDEX IF NOT EXISTS idx_rel_target ON relationships(target_id);

-- Ecological food web links
CREATE TABLE IF NOT EXISTS food_web_links (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  predator_id TEXT NOT NULL,
  prey_id TEXT NOT NULL,
  interaction_type TEXT DEFAULT 'predation',
  ecosystem_id TEXT,
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_food_web_world ON food_web_links(world_id);

-- Impact flags (change propagation)
CREATE TABLE IF NOT EXISTS impact_flags (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  source_element_id TEXT NOT NULL,
  affected_element_id TEXT NOT NULL,
  change_description TEXT DEFAULT '',
  resolved INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_impact_world ON impact_flags(world_id);
CREATE INDEX IF NOT EXISTS idx_impact_affected ON impact_flags(affected_element_id, resolved)
;
