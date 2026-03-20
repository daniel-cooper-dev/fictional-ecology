-- Core world elements table (base for all domains)
CREATE TABLE IF NOT EXISTS world_elements (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  domain TEXT NOT NULL,
  element_type TEXT DEFAULT '',
  name TEXT NOT NULL,
  summary TEXT DEFAULT '',
  detailed_notes TEXT DEFAULT '',
  properties TEXT DEFAULT '{}',
  image_path TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_elements_world ON world_elements(world_id);
CREATE INDEX IF NOT EXISTS idx_elements_domain ON world_elements(world_id, domain);
CREATE INDEX IF NOT EXISTS idx_elements_type ON world_elements(world_id, domain, element_type)
;
