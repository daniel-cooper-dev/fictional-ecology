-- Full-text search virtual table (standalone, manually synced)
CREATE VIRTUAL TABLE IF NOT EXISTS world_elements_fts USING fts5(
  element_id UNINDEXED,
  world_id UNINDEXED,
  domain UNINDEXED,
  name,
  summary,
  detailed_notes
);

-- Tags
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#4a9eff'
);

CREATE INDEX IF NOT EXISTS idx_tags_world ON tags(world_id);

-- Element-Tag junction
CREATE TABLE IF NOT EXISTS element_tags (
  element_id TEXT NOT NULL,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (element_id, tag_id)
);

-- Media attachments
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  element_id TEXT,
  file_path TEXT NOT NULL,
  file_type TEXT DEFAULT '',
  caption TEXT DEFAULT '',
  uploaded_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_media_world ON media(world_id);
CREATE INDEX IF NOT EXISTS idx_media_element ON media(element_id)
;
