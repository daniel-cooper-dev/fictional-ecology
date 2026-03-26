-- Cosmology
CREATE TABLE IF NOT EXISTS celestial_bodies (
  element_id TEXT PRIMARY KEY REFERENCES world_elements(id) ON DELETE CASCADE,
  body_type TEXT DEFAULT 'planet',
  mass TEXT DEFAULT '',
  radius TEXT DEFAULT '',
  orbital_period TEXT DEFAULT '',
  orbital_parent_id TEXT,
  axial_tilt TEXT DEFAULT '',
  day_length TEXT DEFAULT '',
  surface_gravity TEXT DEFAULT '',
  luminosity TEXT DEFAULT '',
  atmosphere_description TEXT DEFAULT ''
);

-- Geology
CREATE TABLE IF NOT EXISTS geological_features (
  element_id TEXT PRIMARY KEY REFERENCES world_elements(id) ON DELETE CASCADE,
  feature_type TEXT DEFAULT 'mountain_range',
  elevation_min TEXT DEFAULT '',
  elevation_max TEXT DEFAULT '',
  age_description TEXT DEFAULT '',
  mineral_composition TEXT DEFAULT '[]',
  tectonic_plate TEXT DEFAULT '',
  active INTEGER DEFAULT 0
);

-- Hydrology
CREATE TABLE IF NOT EXISTS water_bodies (
  element_id TEXT PRIMARY KEY REFERENCES world_elements(id) ON DELETE CASCADE,
  water_type TEXT DEFAULT 'ocean',
  volume TEXT DEFAULT '',
  salinity TEXT DEFAULT '',
  depth_max TEXT DEFAULT '',
  flow_direction TEXT DEFAULT '',
  temperature_range TEXT DEFAULT '',
  connected_to TEXT DEFAULT '[]'
);

-- Atmosphere
CREATE TABLE IF NOT EXISTS atmospheres (
  element_id TEXT PRIMARY KEY REFERENCES world_elements(id) ON DELETE CASCADE,
  composition TEXT DEFAULT '{}',
  pressure TEXT DEFAULT '',
  breathable INTEGER DEFAULT 1,
  color TEXT DEFAULT '',
  phenomena TEXT DEFAULT '[]'
);

-- Climate
CREATE TABLE IF NOT EXISTS climate_zones (
  element_id TEXT PRIMARY KEY REFERENCES world_elements(id) ON DELETE CASCADE,
  zone_type TEXT DEFAULT 'temperate',
  avg_temp_high TEXT DEFAULT '',
  avg_temp_low TEXT DEFAULT '',
  annual_precipitation TEXT DEFAULT '',
  dominant_wind TEXT DEFAULT '',
  season_count INTEGER DEFAULT 4,
  season_descriptions TEXT DEFAULT '[]'
);

-- Biomes
CREATE TABLE IF NOT EXISTS biomes (
  element_id TEXT PRIMARY KEY REFERENCES world_elements(id) ON DELETE CASCADE,
  biome_type TEXT DEFAULT 'forest',
  temperature_range TEXT DEFAULT '',
  moisture_level TEXT DEFAULT '',
  elevation_range TEXT DEFAULT '',
  dominant_terrain TEXT DEFAULT '',
  climate_zone_id TEXT
);

-- Flora
CREATE TABLE IF NOT EXISTS flora (
  element_id TEXT PRIMARY KEY REFERENCES world_elements(id) ON DELETE CASCADE,
  kingdom TEXT DEFAULT 'plant',
  growth_form TEXT DEFAULT 'tree',
  max_height TEXT DEFAULT '',
  lifespan TEXT DEFAULT '',
  reproduction_method TEXT DEFAULT '',
  uses TEXT DEFAULT '[]',
  rarity TEXT DEFAULT 'common',
  sentient INTEGER DEFAULT 0,
  biome_ids TEXT DEFAULT '[]'
);

-- Fauna
CREATE TABLE IF NOT EXISTS fauna (
  element_id TEXT PRIMARY KEY REFERENCES world_elements(id) ON DELETE CASCADE,
  body_type TEXT DEFAULT '',
  diet TEXT DEFAULT 'omnivore',
  locomotion TEXT DEFAULT '[]',
  max_size TEXT DEFAULT '',
  lifespan TEXT DEFAULT '',
  intelligence_level TEXT DEFAULT 'animal',
  social_structure TEXT DEFAULT '',
  domesticable INTEGER DEFAULT 0,
  biome_ids TEXT DEFAULT '[]'
);

-- Ecosystems
CREATE TABLE IF NOT EXISTS ecosystems (
  element_id TEXT PRIMARY KEY REFERENCES world_elements(id) ON DELETE CASCADE,
  ecosystem_type TEXT DEFAULT '',
  energy_source TEXT DEFAULT '',
  stability TEXT DEFAULT 'stable',
  biodiversity_index TEXT DEFAULT '',
  keystone_species_id TEXT,
  biome_id TEXT,
  threats TEXT DEFAULT '[]'
);

-- Sentient Species
CREATE TABLE IF NOT EXISTS sentient_species (
  element_id TEXT PRIMARY KEY REFERENCES world_elements(id) ON DELETE CASCADE,
  biological_basis TEXT DEFAULT '',
  avg_height TEXT DEFAULT '',
  avg_lifespan TEXT DEFAULT '',
  senses TEXT DEFAULT '[]',
  cognitive_traits TEXT DEFAULT '[]',
  communication_method TEXT DEFAULT '',
  population TEXT DEFAULT '',
  homeland_id TEXT,
  reproduction TEXT DEFAULT ''
);

-- Civilizations
CREATE TABLE IF NOT EXISTS civilizations (
  element_id TEXT PRIMARY KEY REFERENCES world_elements(id) ON DELETE CASCADE,
  government_type TEXT DEFAULT '',
  tech_level TEXT DEFAULT '',
  magic_integration TEXT DEFAULT '',
  population TEXT DEFAULT '',
  territory_description TEXT DEFAULT '',
  founded_era_id TEXT,
  species_id TEXT,
  economic_system TEXT DEFAULT '',
  military_strength TEXT DEFAULT ''
);

-- Cultures
CREATE TABLE IF NOT EXISTS cultures (
  element_id TEXT PRIMARY KEY REFERENCES world_elements(id) ON DELETE CASCADE,
  civilization_id TEXT,
  language_name TEXT DEFAULT '',
  writing_system TEXT DEFAULT '',
  religion_name TEXT DEFAULT '',
  "values" TEXT DEFAULT '[]',
  customs TEXT DEFAULT '[]',
  art_forms TEXT DEFAULT '[]',
  cuisine TEXT DEFAULT '',
  architecture_style TEXT DEFAULT '',
  social_hierarchy TEXT DEFAULT ''
);

-- History
CREATE TABLE IF NOT EXISTS historical_events (
  element_id TEXT PRIMARY KEY REFERENCES world_elements(id) ON DELETE CASCADE,
  era_id TEXT,
  year_in_world TEXT DEFAULT '',
  duration TEXT DEFAULT '',
  event_type TEXT DEFAULT '',
  participants TEXT DEFAULT '[]',
  consequences TEXT DEFAULT '[]'
);

-- Geography
CREATE TABLE IF NOT EXISTS geographical_places (
  element_id TEXT PRIMARY KEY REFERENCES world_elements(id) ON DELETE CASCADE,
  place_type TEXT DEFAULT 'city',
  population TEXT DEFAULT '',
  founded_era_id TEXT,
  controlling_civilization_id TEXT,
  coordinates_x REAL,
  coordinates_y REAL,
  map_id TEXT
)
;
