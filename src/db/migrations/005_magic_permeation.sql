-- Magic permeation companion tables for each non-magic domain
-- These tables store magic-specific aspects for entities in non-magic domains

CREATE TABLE IF NOT EXISTS cosmology_magic_aspects (
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL REFERENCES world_elements(id) ON DELETE CASCADE,
  magical_celestial_bodies TEXT DEFAULT '',
  astral_plane_relationship TEXT DEFAULT '',
  dimensional_cosmology TEXT DEFAULT '',
  cosmic_magic_sources TEXT DEFAULT '',
  celestial_alignments_effects TEXT DEFAULT '[]',
  creation_myth_magical TEXT DEFAULT '',
  cosmic_entities TEXT DEFAULT '[]',
  magic_relevance TEXT DEFAULT 'none',
  custom_magic_notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS geology_magic_aspects (
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL REFERENCES world_elements(id) ON DELETE CASCADE,
  ley_line_geology TEXT DEFAULT '',
  magical_minerals TEXT DEFAULT '[]',
  mana_crystallized_formations TEXT DEFAULT '',
  tectonic_magic_interaction TEXT DEFAULT '',
  underground_mana_reservoirs TEXT DEFAULT '',
  geological_age_magic_correlation TEXT DEFAULT '',
  volcanic_magic TEXT DEFAULT '',
  fossil_magic TEXT DEFAULT '',
  magic_relevance TEXT DEFAULT 'none',
  custom_magic_notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS hydrology_magic_aspects (
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL REFERENCES world_elements(id) ON DELETE CASCADE,
  enchanted_waters TEXT DEFAULT '',
  mana_springs TEXT DEFAULT '[]',
  magical_currents TEXT DEFAULT '',
  water_mana_conductivity TEXT DEFAULT 'moderate',
  tidal_magic_effects TEXT DEFAULT '',
  deep_water_magic TEXT DEFAULT '',
  purification_corruption TEXT DEFAULT '',
  water_elemental_connection TEXT DEFAULT '',
  magic_relevance TEXT DEFAULT 'none',
  custom_magic_notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS atmosphere_magic_aspects (
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL REFERENCES world_elements(id) ON DELETE CASCADE,
  mana_density_in_air TEXT DEFAULT '',
  atmospheric_mana_layers TEXT DEFAULT '[]',
  arcane_aurora TEXT DEFAULT '',
  magical_weather_patterns TEXT DEFAULT '',
  air_magic_conductivity TEXT DEFAULT '',
  atmospheric_magic_filtering TEXT DEFAULT '',
  high_altitude_magic_effects TEXT DEFAULT '',
  windborne_magic TEXT DEFAULT '',
  magic_relevance TEXT DEFAULT 'none',
  custom_magic_notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS climate_magic_aspects (
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL REFERENCES world_elements(id) ON DELETE CASCADE,
  magic_influenced_seasons TEXT DEFAULT '[]',
  mana_tides TEXT DEFAULT '',
  climate_zones_magical_character TEXT DEFAULT '',
  weather_magic_interaction TEXT DEFAULT '',
  seasonal_magic_rituals TEXT DEFAULT '',
  long_term_magical_climate_change TEXT DEFAULT '',
  magical_precipitation TEXT DEFAULT '',
  magic_relevance TEXT DEFAULT 'none',
  custom_magic_notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS biomes_magic_aspects (
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL REFERENCES world_elements(id) ON DELETE CASCADE,
  mana_saturation_level TEXT DEFAULT 'trace',
  wild_magic_presence INTEGER DEFAULT 0,
  wild_magic_description TEXT,
  enchanted_biome_features TEXT DEFAULT '',
  dominant_magic_type TEXT,
  magical_hazards TEXT,
  magic_effect_on_biodiversity TEXT DEFAULT '',
  biome_magic_source_id TEXT,
  transition_zone_magic TEXT,
  magic_relevance TEXT DEFAULT 'none',
  custom_magic_notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS flora_magic_aspects (
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL REFERENCES world_elements(id) ON DELETE CASCADE,
  magical_properties TEXT DEFAULT '{}',
  mana_interaction TEXT DEFAULT 'none',
  mana_production_rate TEXT,
  use_in_potions TEXT,
  use_as_reagent TEXT,
  sentience_level TEXT DEFAULT 'none',
  communication_method TEXT,
  magical_symbiosis TEXT,
  cultivation_requirements_magical TEXT,
  magical_life_cycle TEXT,
  toxicity_magical TEXT,
  magic_relevance TEXT DEFAULT 'none',
  custom_magic_notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS fauna_magic_aspects (
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL REFERENCES world_elements(id) ON DELETE CASCADE,
  innate_magical_abilities TEXT DEFAULT '{}',
  mana_interaction TEXT DEFAULT 'none',
  magical_classification TEXT DEFAULT 'mundane',
  familiar_potential INTEGER DEFAULT 0,
  familiar_bond_type TEXT,
  summonable INTEGER DEFAULT 0,
  summoning_requirements TEXT,
  magical_materials_harvestable TEXT DEFAULT '[]',
  mana_diet INTEGER DEFAULT 0,
  magical_evolution_path TEXT,
  intelligence_magical TEXT,
  domestication_magical TEXT,
  native_plane_id TEXT,
  magic_relevance TEXT DEFAULT 'none',
  custom_magic_notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ecosystems_magic_aspects (
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL REFERENCES world_elements(id) ON DELETE CASCADE,
  mana_cycle_id TEXT,
  magical_food_web_id TEXT,
  ambient_mana_level TEXT DEFAULT 'trace',
  mana_flow_patterns TEXT DEFAULT '',
  keystone_magical_species TEXT DEFAULT '',
  magical_carrying_capacity TEXT DEFAULT '',
  magical_disturbance_history TEXT,
  recovery_from_magical_damage TEXT,
  magical_succession TEXT,
  magic_relevance TEXT DEFAULT 'none',
  custom_magic_notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sentient_species_magic_aspects (
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL REFERENCES world_elements(id) ON DELETE CASCADE,
  innate_magical_ability TEXT DEFAULT 'none',
  mana_sensitivity TEXT DEFAULT 'low',
  magical_affinity TEXT DEFAULT '',
  magical_limitations TEXT DEFAULT '',
  magic_organ_biology TEXT,
  magical_maturation TEXT DEFAULT '',
  magical_variation TEXT DEFAULT '',
  magical_evolution_history TEXT DEFAULT '',
  magical_cultural_significance TEXT DEFAULT '',
  cross_species_magical_interactions TEXT,
  vulnerability_to_magic TEXT,
  magic_relevance TEXT DEFAULT 'none',
  custom_magic_notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS civilizations_magic_aspects (
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL REFERENCES world_elements(id) ON DELETE CASCADE,
  magic_governance TEXT DEFAULT '',
  magical_economy_summary TEXT DEFAULT '',
  spell_based_infrastructure TEXT DEFAULT '',
  magical_military TEXT DEFAULT '',
  magical_education_system TEXT DEFAULT '',
  magical_social_hierarchy TEXT DEFAULT '',
  magical_law_enforcement TEXT DEFAULT '',
  magical_healthcare TEXT DEFAULT '',
  magic_technology_relationship TEXT DEFAULT '',
  attitude_toward_magic TEXT DEFAULT 'utilitarian',
  magitech_era_id TEXT,
  magic_relevance TEXT DEFAULT 'none',
  custom_magic_notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cultures_magic_aspects (
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL REFERENCES world_elements(id) ON DELETE CASCADE,
  magical_traditions TEXT DEFAULT '[]',
  arcane_religions TEXT DEFAULT '',
  magical_art_forms TEXT DEFAULT '',
  magical_festivals TEXT DEFAULT '[]',
  magical_rites_of_passage TEXT DEFAULT '',
  attitudes_toward_practitioners TEXT DEFAULT '',
  folk_magic TEXT DEFAULT '',
  magical_taboos TEXT DEFAULT '',
  magical_language TEXT,
  magical_cuisine TEXT,
  magical_fashion TEXT,
  oral_traditions_about_magic TEXT,
  magic_relevance TEXT DEFAULT 'none',
  custom_magic_notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS history_magic_aspects (
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL REFERENCES world_elements(id) ON DELETE CASCADE,
  magical_cataclysms TEXT DEFAULT '[]',
  magic_discovery_milestones TEXT DEFAULT '[]',
  magitech_revolutions TEXT DEFAULT '[]',
  magical_wars TEXT,
  rise_fall_magical_empires TEXT,
  legendary_practitioners TEXT DEFAULT '[]',
  magical_artifacts_historical TEXT DEFAULT '[]',
  magical_plagues TEXT,
  periods_of_magical_suppression TEXT,
  lost_magical_knowledge TEXT,
  prophecies TEXT,
  magic_relevance TEXT DEFAULT 'none',
  custom_magic_notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS geography_magic_aspects (
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL REFERENCES world_elements(id) ON DELETE CASCADE,
  magical_landmarks TEXT DEFAULT '[]',
  ley_line_geography TEXT DEFAULT '',
  planar_crossings TEXT DEFAULT '[]',
  enchanted_territories TEXT DEFAULT '',
  mana_density_map_description TEXT DEFAULT '',
  magical_borders TEXT,
  sacred_profane_sites TEXT DEFAULT '[]',
  magical_travel_routes TEXT,
  forbidden_zones TEXT,
  magical_resource_geography TEXT,
  magic_relevance TEXT DEFAULT 'none',
  custom_magic_notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for parent lookups
CREATE INDEX IF NOT EXISTS idx_cosmo_magic_parent ON cosmology_magic_aspects(parent_id);
CREATE INDEX IF NOT EXISTS idx_geo_magic_parent ON geology_magic_aspects(parent_id);
CREATE INDEX IF NOT EXISTS idx_hydro_magic_parent ON hydrology_magic_aspects(parent_id);
CREATE INDEX IF NOT EXISTS idx_atmo_magic_parent ON atmosphere_magic_aspects(parent_id);
CREATE INDEX IF NOT EXISTS idx_climate_magic_parent ON climate_magic_aspects(parent_id);
CREATE INDEX IF NOT EXISTS idx_biome_magic_parent ON biomes_magic_aspects(parent_id);
CREATE INDEX IF NOT EXISTS idx_flora_magic_parent ON flora_magic_aspects(parent_id);
CREATE INDEX IF NOT EXISTS idx_fauna_magic_parent ON fauna_magic_aspects(parent_id);
CREATE INDEX IF NOT EXISTS idx_eco_magic_parent ON ecosystems_magic_aspects(parent_id);
CREATE INDEX IF NOT EXISTS idx_species_magic_parent ON sentient_species_magic_aspects(parent_id);
CREATE INDEX IF NOT EXISTS idx_civ_magic_parent ON civilizations_magic_aspects(parent_id);
CREATE INDEX IF NOT EXISTS idx_culture_magic_parent ON cultures_magic_aspects(parent_id);
CREATE INDEX IF NOT EXISTS idx_history_magic_parent ON history_magic_aspects(parent_id);
CREATE INDEX IF NOT EXISTS idx_geography_magic_parent ON geography_magic_aspects(parent_id)
;
