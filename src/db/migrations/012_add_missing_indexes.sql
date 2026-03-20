-- Missing indexes on food_web_links
CREATE INDEX IF NOT EXISTS idx_food_web_predator ON food_web_links(predator_id);
CREATE INDEX IF NOT EXISTS idx_food_web_prey ON food_web_links(prey_id);

-- Missing index on impact_flags source
CREATE INDEX IF NOT EXISTS idx_impact_source ON impact_flags(source_element_id);

-- Missing index on element_tags element_id (for lookups by element)
CREATE INDEX IF NOT EXISTS idx_element_tags_element ON element_tags(element_id);

-- Missing indexes on planar connections FK columns
CREATE INDEX IF NOT EXISTS idx_planar_connections_source ON planar_connections(source_plane_id);
CREATE INDEX IF NOT EXISTS idx_planar_connections_target ON planar_connections(target_plane_id);
