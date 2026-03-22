/**
 * Cross-domain archetype pairing suggestions.
 * Maps archetype IDs to related archetypes in OTHER domains.
 * Used for "Pairs Well With" suggestions on element forms and detail pages.
 */

export interface ArchetypePair {
  domain: string;
  archetypeId: string;
  reason: string;
}

// Key: "domain:archetypeId", Value: array of paired archetypes
export const ARCHETYPE_PAIRS: Record<string, ArchetypePair[]> = {
  // --- Natural × Natural ---
  'cosmology:habitable_planet': [
    { domain: 'atmosphere', archetypeId: 'earth_like', reason: 'A habitable planet needs a breathable atmosphere' },
    { domain: 'hydrology', archetypeId: 'major_ocean', reason: 'Liquid water is key to habitability' },
    { domain: 'climate', archetypeId: 'temperate_maritime', reason: 'Temperate climate supports diverse life' },
  ],
  'cosmology:binary_stars': [
    { domain: 'climate', archetypeId: 'mana_seasons', reason: 'Binary orbits create complex, unusual seasons' },
    { domain: 'cultures', archetypeId: 'scholarly_tradition', reason: 'Binary star astronomy is a rich field of study' },
  ],
  'cosmology:hollow_world': [
    { domain: 'atmosphere', archetypeId: 'layered_breathability', reason: 'Interior atmosphere behaves differently' },
    { domain: 'civilizations', archetypeId: 'underground_empire', reason: 'Interior civilizations isolated from the outside' },
  ],
  'geology:continental_mountain_range': [
    { domain: 'climate', archetypeId: 'temperate_maritime', reason: 'Mountains create rain shadows shaping climate' },
    { domain: 'civilizations', archetypeId: 'feudal_kingdom', reason: 'Mountains form natural kingdom borders' },
    { domain: 'sentient_species', archetypeId: 'hardy_mountain_folk', reason: 'Mountains breed hardy species' },
  ],
  'geology:floating_islands': [
    { domain: 'fauna', archetypeId: 'sky_whale', reason: 'Sky whales drift between floating islands' },
    { domain: 'geography', archetypeId: 'sky_port', reason: 'Sky ports service the floating world' },
    { domain: 'biomes', archetypeId: 'floating_reef', reason: 'Aerial biomes form on floating debris' },
  ],
  'geology:glass_desert': [
    { domain: 'history', archetypeId: 'the_sundering', reason: 'Something terrible created this wasteland' },
    { domain: 'geography', archetypeId: 'forbidden_zone', reason: 'Glass deserts are often sealed off' },
  ],
  'geology:living_mountain': [
    { domain: 'ecosystems', archetypeId: 'symbiotic_megaorganism', reason: 'The mountain IS a living ecosystem' },
    { domain: 'magic_systems', archetypeId: 'innate_biological', reason: 'The creature\'s biology is magical' },
  ],
  'hydrology:major_ocean': [
    { domain: 'biomes', archetypeId: 'coral_reef_biome', reason: 'Oceans host reef biomes' },
    { domain: 'sentient_species', archetypeId: 'aquatic_people', reason: 'Oceans support aquatic civilizations' },
    { domain: 'fauna', archetypeId: 'deep_sea_leviathan', reason: 'Deep oceans hide leviathans' },
  ],
  'hydrology:underground_ocean': [
    { domain: 'geology', archetypeId: 'limestone_cave_network', reason: 'Underground oceans form in cave systems' },
    { domain: 'biomes', archetypeId: 'deep_cavern', reason: 'Subterranean biomes surround underground water' },
  ],

  // --- Natural × Life ---
  'biomes:temperate_forest': [
    { domain: 'flora', archetypeId: 'ancient_hardwood', reason: 'Old-growth trees define temperate forests' },
    { domain: 'fauna', archetypeId: 'apex_predator', reason: 'Forests support apex predators' },
    { domain: 'ecosystems', archetypeId: 'old_growth_forest', reason: 'Mature forest ecosystem' },
  ],
  'biomes:coral_reef_biome': [
    { domain: 'ecosystems', archetypeId: 'coral_reef_ecosystem', reason: 'Reef biome and ecosystem are paired' },
    { domain: 'fauna', archetypeId: 'deep_sea_leviathan', reason: 'Deep waters near reefs hold dangers' },
    { domain: 'sentient_species', archetypeId: 'aquatic_people', reason: 'Reef-dwelling civilizations' },
  ],
  'biomes:fungal_jungle': [
    { domain: 'flora', archetypeId: 'cave_fungus', reason: 'Fungal forests are built from giant fungi' },
    { domain: 'sentient_species', archetypeId: 'fungal_collective', reason: 'Fungal intelligence thrives here' },
  ],
  'flora:ancient_hardwood': [
    { domain: 'biomes', archetypeId: 'temperate_forest', reason: 'Ancient trees form forest biomes' },
    { domain: 'cultures', archetypeId: 'scholarly_tradition', reason: 'Sacred groves inspire scholarly traditions' },
  ],
  'flora:singing_tree': [
    { domain: 'cultures', archetypeId: 'silence_keepers', reason: 'Wind-music trees resonate with cultures of silence' },
    { domain: 'atmosphere', archetypeId: 'singing_winds', reason: 'Singing winds play through singing trees' },
  ],
  'flora:corpse_bloom': [
    { domain: 'cultures', archetypeId: 'death_celebrants', reason: 'Funerary flowers pair with death-celebrating cultures' },
    { domain: 'ecosystems', archetypeId: 'graveyard_ecosystem', reason: 'Death-dependent flora feeds necro-ecology' },
  ],
  'fauna:sky_whale': [
    { domain: 'geology', archetypeId: 'floating_islands', reason: 'Sky whales drift between floating islands' },
    { domain: 'geography', archetypeId: 'sky_port', reason: 'Sky ports may dock sky whales' },
  ],
  'fauna:apex_predator': [
    { domain: 'ecosystems', archetypeId: 'old_growth_forest', reason: 'Apex predators anchor mature ecosystems' },
    { domain: 'civilizations', archetypeId: 'nomadic_confederation', reason: 'Nomads coexist with predators' },
  ],
  'fauna:symbiotic_pair': [
    { domain: 'ecosystems', archetypeId: 'symbiotic_megaorganism', reason: 'Symbiotic creatures fit symbiotic ecosystems' },
    { domain: 'magic_ecology', archetypeId: 'magical_symbiosis', reason: 'Magical symbiosis mirrors biological symbiosis' },
  ],

  // --- Sentient × Sentient ---
  'sentient_species:baseline_humanoid': [
    { domain: 'civilizations', archetypeId: 'feudal_kingdom', reason: 'Humans commonly build feudal kingdoms' },
    { domain: 'cultures', archetypeId: 'warrior_honor', reason: 'Human cultures often develop warrior codes' },
  ],
  'sentient_species:long_lived_elven': [
    { domain: 'biomes', archetypeId: 'temperate_forest', reason: 'Elves are associated with ancient forests' },
    { domain: 'flora', archetypeId: 'ancient_hardwood', reason: 'Elven lifespans match ancient trees' },
    { domain: 'history', archetypeId: 'golden_age', reason: 'Long lives create nostalgia for golden ages' },
  ],
  'sentient_species:hardy_mountain_folk': [
    { domain: 'geology', archetypeId: 'continental_mountain_range', reason: 'Mountain folk live in mountains' },
    { domain: 'civilizations', archetypeId: 'underground_empire', reason: 'Dwarven empires go deep' },
  ],
  'sentient_species:aquatic_people': [
    { domain: 'hydrology', archetypeId: 'major_ocean', reason: 'Aquatic peoples need oceans' },
    { domain: 'biomes', archetypeId: 'coral_reef_biome', reason: 'Reef civilizations' },
  ],
  'sentient_species:hive_mind': [
    { domain: 'civilizations', archetypeId: 'living_city_civ', reason: 'A hive mind fits a living-city symbiosis' },
    { domain: 'ecosystems', archetypeId: 'parasitic_network', reason: 'Hive minds navigate parasitic networks' },
  ],
  'sentient_species:constructed_people': [
    { domain: 'arcane_sciences', archetypeId: 'golem_workforce', reason: 'Constructs and golems share origins' },
    { domain: 'history', archetypeId: 'the_awakening', reason: 'The moment constructs gained sentience' },
  ],
  'civilizations:feudal_kingdom': [
    { domain: 'sentient_species', archetypeId: 'baseline_humanoid', reason: 'Feudalism is a human-scale institution' },
    { domain: 'cultures', archetypeId: 'warrior_honor', reason: 'Knightly honor codes' },
    { domain: 'geography', archetypeId: 'capital_city', reason: 'Kingdoms need capitals' },
  ],
  'civilizations:nomadic_confederation': [
    { domain: 'climate', archetypeId: 'arid_desert', reason: 'Nomads follow resources in harsh climates' },
    { domain: 'fauna', archetypeId: 'migratory_herder', reason: 'Nomads follow herds' },
    { domain: 'cultures', archetypeId: 'nomadic_storytellers', reason: 'Oral tradition preserves nomadic culture' },
  ],
  'civilizations:pirate_republic': [
    { domain: 'hydrology', archetypeId: 'major_ocean', reason: 'Pirates need seas to sail' },
    { domain: 'geography', archetypeId: 'harbor_city', reason: 'Pirate havens are hidden ports' },
  ],
  'civilizations:underground_empire': [
    { domain: 'geology', archetypeId: 'limestone_cave_network', reason: 'Underground empires fill cave systems' },
    { domain: 'flora', archetypeId: 'cave_fungus', reason: 'Fungal agriculture feeds underground cities' },
    { domain: 'sentient_species', archetypeId: 'hardy_mountain_folk', reason: 'Mountain folk build underground' },
  ],

  // --- Magic × Everything ---
  'magic_systems:ambient_field': [
    { domain: 'magic_ecology', archetypeId: 'ley_line_nexus', reason: 'Ambient mana pools at ley line nexuses' },
    { domain: 'magic_systems', archetypeId: 'mana_crystal', reason: 'Ambient mana crystallizes over time' },
    { domain: 'magic_economy', archetypeId: 'mana_currency', reason: 'Ambient mana can be harvested as currency' },
  ],
  'magic_systems:divine_gift': [
    { domain: 'civilizations', archetypeId: 'theocratic_empire', reason: 'Divine magic creates theocracies' },
    { domain: 'planar_systems', archetypeId: 'divine_domain', reason: 'Gods reside in divine planes' },
  ],
  'magic_systems:elemental_taxonomy': [
    { domain: 'planar_systems', archetypeId: 'elemental_bastion', reason: 'Elemental magic connects to elemental planes' },
    { domain: 'atmosphere', archetypeId: 'singing_winds', reason: 'Air element magic manifests in winds' },
  ],
  'magic_systems:soul_cost': [
    { domain: 'magic_systems', archetypeId: 'forbidden_spell', reason: 'Soul erosion makes some spells forbidden' },
    { domain: 'cultures', archetypeId: 'death_celebrants', reason: 'Soul-cost magic shapes attitudes toward death' },
  ],
  'magic_systems:mana_crystal': [
    { domain: 'magic_economy', archetypeId: 'enchanter_guild', reason: 'Crystal processing needs guild expertise' },
    { domain: 'geology', archetypeId: 'limestone_cave_network', reason: 'Crystals form in underground deposits' },
  ],
  'magic_systems:runic_system': [
    { domain: 'arcane_sciences', archetypeId: 'spell_telegraph', reason: 'Runes power communication networks' },
    { domain: 'cultures', archetypeId: 'scholarly_tradition', reason: 'Runic study is an academic tradition' },
  ],
  'magic_ecology:ley_line_nexus': [
    { domain: 'geography', archetypeId: 'crossroads_town', reason: 'Cities build on nexus points' },
    { domain: 'magic_systems', archetypeId: 'wild_surge', reason: 'Nexuses produce wild magic surges' },
  ],
  'magic_ecology:mana_desert': [
    { domain: 'geography', archetypeId: 'forbidden_zone', reason: 'Dead zones become forbidden territory' },
    { domain: 'history', archetypeId: 'the_sundering', reason: 'Dead zones are remnants of catastrophe' },
  ],
  'planar_systems:bleeding_wound': [
    { domain: 'magic_systems', archetypeId: 'wild_surge', reason: 'Planar wounds cause wild magic' },
    { domain: 'geography', archetypeId: 'forbidden_zone', reason: 'Planar wounds are sealed off' },
  ],
  'planar_systems:prison_plane': [
    { domain: 'history', archetypeId: 'forbidden_knowledge_event', reason: 'Knowledge of the prisoner is suppressed' },
    { domain: 'magic_systems', archetypeId: 'forbidden_spell', reason: 'The sealing ritual is forbidden knowledge' },
  ],
  'arcane_sciences:golem_workforce': [
    { domain: 'sentient_species', archetypeId: 'constructed_people', reason: 'Some golems become sentient' },
    { domain: 'magic_economy', archetypeId: 'enchanter_guild', reason: 'Guilds produce and maintain golems' },
  ],
  'arcane_sciences:spell_telegraph': [
    { domain: 'magic_systems', archetypeId: 'runic_system', reason: 'Runes encode telegraph signals' },
    { domain: 'civilizations', archetypeId: 'trading_republic', reason: 'Trade republics leverage communication networks' },
  ],
  'history:the_sundering': [
    { domain: 'geology', archetypeId: 'glass_desert', reason: 'The Sundering created wastelands' },
    { domain: 'geography', archetypeId: 'forbidden_zone', reason: 'Sundered zones remain dangerous' },
    { domain: 'ecosystems', archetypeId: 'war_scarred', reason: 'Ecosystems still recovering' },
  ],
  'geography:crossroads_town': [
    { domain: 'civilizations', archetypeId: 'trading_republic', reason: 'Trade routes create merchant power' },
    { domain: 'cultures', archetypeId: 'maritime_voyagers', reason: 'Trade hubs attract seafaring cultures' },
  ],
  'geography:sky_port': [
    { domain: 'geology', archetypeId: 'floating_islands', reason: 'Sky ports serve floating island chains' },
    { domain: 'fauna', archetypeId: 'sky_whale', reason: 'Sky ports may dock living sky creatures' },
  ],
};

/**
 * Get paired archetypes for a given domain:archetypeId key.
 */
export function getPairs(domain: string, archetypeId: string): ArchetypePair[] {
  return ARCHETYPE_PAIRS[`${domain}:${archetypeId}`] || [];
}

/**
 * Get all pairs that reference a specific domain:archetypeId as a target.
 * Useful for "What pairs with this?" reverse lookups.
 */
export function getReversePairs(domain: string, archetypeId: string): { sourceDomain: string; sourceArchetypeId: string; reason: string }[] {
  const results: { sourceDomain: string; sourceArchetypeId: string; reason: string }[] = [];
  for (const [key, pairs] of Object.entries(ARCHETYPE_PAIRS)) {
    for (const pair of pairs) {
      if (pair.domain === domain && pair.archetypeId === archetypeId) {
        const [srcDomain, srcArchetype] = key.split(':');
        results.push({ sourceDomain: srcDomain, sourceArchetypeId: srcArchetype, reason: pair.reason });
      }
    }
  }
  return results;
}
