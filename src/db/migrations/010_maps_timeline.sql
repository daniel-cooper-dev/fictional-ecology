-- Maps
CREATE TABLE IF NOT EXISTS maps (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  name TEXT NOT NULL,
  image_path TEXT DEFAULT '',
  width INTEGER DEFAULT 0,
  height INTEGER DEFAULT 0,
  scale_label TEXT DEFAULT '',
  map_type TEXT DEFAULT 'world',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_maps_world ON maps(world_id);

-- Map pins
CREATE TABLE IF NOT EXISTS map_pins (
  id TEXT PRIMARY KEY,
  map_id TEXT NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
  element_id TEXT,
  x REAL DEFAULT 0.5,
  y REAL DEFAULT 0.5,
  label TEXT DEFAULT '',
  icon TEXT DEFAULT 'pin',
  color TEXT DEFAULT '#ffffff'
);

CREATE INDEX IF NOT EXISTS idx_pins_map ON map_pins(map_id);

-- Map regions (polygons)
CREATE TABLE IF NOT EXISTS map_regions (
  id TEXT PRIMARY KEY,
  map_id TEXT NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
  element_id TEXT,
  points TEXT DEFAULT '[]',
  fill_color TEXT DEFAULT 'rgba(100,100,255,0.3)',
  border_color TEXT DEFAULT '#6464ff',
  label TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_regions_map ON map_regions(map_id);

-- Calendars
CREATE TABLE IF NOT EXISTS calendars (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  name TEXT NOT NULL,
  days_per_year INTEGER DEFAULT 365,
  months TEXT DEFAULT '[]',
  days_per_week INTEGER DEFAULT 7,
  day_names TEXT DEFAULT '[]',
  epoch_year INTEGER DEFAULT 0,
  epoch_name TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_calendars_world ON calendars(world_id);

-- Eras
CREATE TABLE IF NOT EXISTS eras (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  calendar_id TEXT,
  name TEXT NOT NULL,
  start_year INTEGER DEFAULT 0,
  end_year INTEGER,
  description TEXT DEFAULT '',
  color TEXT DEFAULT '#4a9eff',
  sort_order INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_eras_world ON eras(world_id)
;
