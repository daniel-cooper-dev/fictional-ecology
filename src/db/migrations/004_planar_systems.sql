-- Planes of existence
CREATE TABLE IF NOT EXISTS planes (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  name TEXT NOT NULL,
  plane_type TEXT DEFAULT 'material',
  description TEXT DEFAULT '',
  is_primary_material INTEGER DEFAULT 0,
  parent_plane_id TEXT,
  accessibility TEXT DEFAULT 'open',
  physical_laws TEXT DEFAULT '{}',
  magic_laws_override TEXT,
  dominant_energy_type_id TEXT,
  time_flow_rate TEXT DEFAULT '1:1',
  spatial_properties TEXT DEFAULT 'euclidean',
  native_environment TEXT DEFAULT '',
  stability TEXT DEFAULT 'stable',
  age TEXT,
  creation_myth TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_planes_world ON planes(world_id);

-- Connections between planes
CREATE TABLE IF NOT EXISTS planar_connections (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  source_plane_id TEXT NOT NULL REFERENCES planes(id) ON DELETE CASCADE,
  target_plane_id TEXT NOT NULL REFERENCES planes(id) ON DELETE CASCADE,
  connection_type TEXT DEFAULT 'portal',
  name TEXT,
  bidirectional INTEGER DEFAULT 1,
  permanence TEXT DEFAULT 'permanent',
  location_source TEXT,
  location_target TEXT,
  activation_requirements TEXT,
  travel_hazards TEXT,
  discovery_status TEXT DEFAULT 'well_known',
  controlling_entity TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_planar_conn_world ON planar_connections(world_id);

-- Planar geography
CREATE TABLE IF NOT EXISTS planar_geography (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  plane_id TEXT NOT NULL REFERENCES planes(id) ON DELETE CASCADE,
  region_name TEXT NOT NULL,
  description TEXT DEFAULT '',
  terrain_type TEXT DEFAULT '',
  magical_properties TEXT DEFAULT '{}',
  inhabitants TEXT DEFAULT '',
  resources TEXT DEFAULT '',
  dangers TEXT DEFAULT '',
  points_of_interest TEXT DEFAULT '[]',
  corresponding_material_location TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_planar_geo_plane ON planar_geography(plane_id);

-- Planar entities (beings native to other planes)
CREATE TABLE IF NOT EXISTS planar_entities (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  name TEXT NOT NULL,
  native_plane_id TEXT REFERENCES planes(id) ON DELETE SET NULL,
  entity_type TEXT DEFAULT 'elemental',
  description TEXT DEFAULT '',
  power_tier_id TEXT,
  abilities TEXT DEFAULT '{}',
  motivations TEXT DEFAULT '',
  relationship_to_material TEXT DEFAULT 'neutral',
  summoning_requirements TEXT,
  binding_methods TEXT,
  banishment_methods TEXT,
  can_manifest_materially INTEGER DEFAULT 1,
  manifestation_conditions TEXT,
  lore TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_planar_entities_world ON planar_entities(world_id)
;
