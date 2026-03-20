# World Domain Improvement Notes

## Iteration 1 — Category-by-Category Isolated Review

---

### NATURAL WORLD

#### Cosmology
- [ ] **Missing body_type option "nebula"** — element_types includes nebula but the body_type select field doesn't offer it as a choice
- [ ] **No composition field** — rocky, gas giant, ice giant, metallic, plasma are fundamental celestial body characteristics with no field to capture them
- [ ] **No constellation groupings** — no way to group stars into constellations, which are important for cultures and navigation
- [ ] **Missing binary/multiple star system support** — orbital_parent_id allows single-parent hierarchy but can't represent binary orbits

#### Geology
- [ ] **Missing soil types** — sedimentary layers, soil composition are important for agriculture and civilizations but unrepresented
- [ ] **No erosion/weathering** — geological features lack lifecycle/change information
- [ ] **feature_type gaps** — missing rift_valley, delta, mesa, badlands, fjord as options
- [ ] **No connection to hydrology** — no watershed or aquifer relationship fields despite being tightly coupled natural systems

#### Hydrology
- [ ] **No tidal pattern field** — tides are driven by moons (cosmology) but there's no way to capture this connection
- [ ] **Missing water_type options** — delta, estuary, geyser, spring (non-hot), reef, fjord not available
- [ ] **No water quality/clarity** — important for ecosystems and civilizations depending on water
- [ ] **Watershed concept absent** — drainage basins are fundamental hydrological units but unmodeled

#### Atmosphere
- [ ] **Underdeveloped domain** — only 5 core fields compared to 7-9 in sibling domains, the thinnest Natural World domain
- [ ] **No atmospheric layers/stratification** — troposphere/stratosphere equivalent layers missing
- [ ] **No wind systems field** — prevailing winds, jet streams, trade winds have no dedicated field
- [ ] **No weather phenomena detail** — the json `phenomena` field bundles too many distinct concepts
- [ ] **No seasonal atmospheric variation** — how atmosphere changes through year
- [ ] **Missing temperature profile** — temperature by altitude not captured

#### Climate
- [ ] **No microclimate concept** — localized climate variations within zones are ecologically significant
- [ ] **No historical climate shifts** — climate change over geological time
- [ ] **Missing weather extremes** — hurricanes, droughts, floods, ice storms as specific hazards
- [ ] **No humidity field** — a fundamental climate variable with no dedicated field

#### Biomes
- [ ] **No ecotone/transition zone** — biome boundary areas where two biomes blend are ecologically rich
- [ ] **No vertical zonation** — altitude-based biome layering (e.g., mountain base → alpine)
- [ ] **Missing primary productivity** — photosynthetic/energy output capacity
- [ ] **No carrying capacity** — maximum population supportable by the biome
- [ ] **No dominant species references** — unlike the magic companion's keystone_magical_species, core fields lack species references

#### Flora
- [ ] **No seasonal behavior** — deciduous vs evergreen, dormancy cycles, bloom timing
- [ ] **Missing symbiotic relationships** — non-magical symbiosis (pollinator partnerships, mycorrhizal networks)
- [ ] **No endangered/conservation status** — population health and threats to species
- [ ] **Missing cultivation difficulty** — how hard to farm/grow, important for civilizations

#### Fauna
- [ ] **No rarity field** — Flora has rarity (common → unique) but Fauna doesn't, inconsistent
- [ ] **Missing migration patterns** — seasonal movement crucial for ecosystems
- [ ] **No habitat niche** — specific microhabitat within biome (canopy, forest floor, deep pelagic)
- [ ] **Missing predator/prey formal fields** — trophic relationships only exist via generic relationship system
- [ ] **No communication methods** — birdsong, whale calls, pheromones for non-sentient fauna

#### Ecosystems
- [ ] **No geographic scope/area** — how large the ecosystem is
- [ ] **Missing trophic level detail** — explicit primary producer, consumer, decomposer layers
- [ ] **No succession stage** — pioneer, developing, mature, climax
- [ ] **Missing nutrient cycling** — non-magical nutrient flows
- [ ] **No age/maturity** — how long the ecosystem has existed

---

### SENTIENT WORLD

#### Sentient Species
- [ ] **No physical description/appearance** — body shape, skin/scale/feather, coloring are core identity traits with no field
- [ ] **Missing diet/food needs** — Fauna has diet field but Sentient Species doesn't, despite being equally important
- [ ] **No subspecies/races concept** — intra-species variation and regional adaptation
- [ ] **Missing environmental adaptations** — cold resistance, aquatic breathing, dark vision
- [ ] **No gender system** — dimorphism, gender diversity, biological sex patterns
- [ ] **Missing aging stages** — infant, youth, adult, elder with different capabilities

#### Civilizations
- [ ] **No capital/seat of power** — most civilizations have a capital city but no field for it
- [ ] **Missing age/founding date** — `founded_era_id` links to an era but no specific date/age field
- [ ] **No justice system** — courts, law, crime and punishment
- [ ] **Missing non-magical education** — schools, literacy, knowledge systems
- [ ] **No growth/decline status** — whether civilization is expanding, stable, or crumbling

#### Cultures
- [ ] **No music/dance traditions** — major cultural expression missing
- [ ] **Missing funerary practices** — how death is handled is culturally defining
- [ ] **No marriage/family customs** — family structure and partnership traditions
- [ ] **No clothing/fashion** — non-magical clothing and adornment
- [ ] **civilization_id implies 1:1** — but cultures can span multiple civilizations or exist without one
- [ ] **Missing calendar/timekeeping** — how culture measures time

---

### MAGIC & TECHNOLOGY

#### Magic Systems
- [ ] **Nearly empty core config** — only a `properties` json blob; the domain config itself serves as a thin shell
- [ ] **No world-level magic philosophy** — overarching magic paradigm/tone has no field (hard vs soft magic, etc.)
- [ ] **Confusing dual identity** — element_types list "source, energy_type..." which duplicate the sub-table concepts

#### Planar Systems
- [ ] **No population/inhabitants field** — who lives in the plane
- [ ] **Missing resources** — what materials/energies exist in the plane
- [ ] **No hazards/dangers field** — environmental threats to visitors
- [ ] **Missing planar weather** — storms, tides, phenomena within the plane
- [ ] **No discovery history** — when/how the plane was first accessed

#### Arcane Sciences
- [ ] **No research methodology** — how magitech R&D works (empirical, intuitive, divine revelation)
- [ ] **Missing key inventors** — notable researchers/inventors (could be relationships)
- [ ] **No safety standards** — regulations around magitech safety and testing
- [ ] **engineering_principle_ids as json** — references engineering principles via json ID list rather than formal relationship, fragile

#### Magic Ecology
- [ ] **No mana pollution concept** — magical waste, contamination, toxic mana missing
- [ ] **Missing dead zone details** — mana-barren areas as a specific phenomenon
- [ ] **No seasonal mana variation** — how mana fluctuates through year/cycles
- [ ] **No remediation concept** — how magical ecological damage is healed

#### Magic Economy
- [ ] **No price/value metrics** — relative cost or exchange rates
- [ ] **Missing market structure** — monopoly, guild-controlled, free market, state-run
- [ ] **No mana-backed currency** — currency systems tied to magical resources
- [ ] **Missing black market detail** — element type exists but no fields specific to illicit trade
- [ ] **No import/export patterns** — trade flow between civilizations

---

### META

#### History
- [ ] **No reliability/source field** — legendary vs documented, oral vs written, how trustworthy
- [ ] **Missing geographic scope** — was the event local, regional, continental, global
- [ ] **No significance rating** — how impactful the event was
- [ ] **No cause chain** — formal link to preceding cause events
- [ ] **Missing calendar system reference** — which calendar the date uses

#### Geography
- [ ] **No climate_zone_id** — places have no formal link to climate despite being a sibling domain
- [ ] **No biome_id** — places have no formal link to biome
- [ ] **Missing terrain description** — physical landscape of the place
- [ ] **No resources available** — what the place offers economically
- [ ] **Missing trade significance** — is it a trade hub, crossroads, isolated outpost
- [ ] **No accessibility/remoteness** — how easy to reach

#### Custom
- No changes needed — intentionally minimal and flexible by design.

---

### CROSS-CATEGORY ISSUES
- [ ] **Inconsistent biome references** — Flora and Fauna use `biome_ids` (json array), Ecosystems uses `biome_id` (singular text)
- [ ] **Atmosphere is weakest natural domain** — significantly fewer fields than peers
- [ ] **Missing upward references** — Geography doesn't link to Climate or Biomes; Hydrology doesn't link to Climate
- [ ] **Flora has rarity but Fauna doesn't** — inconsistent parallel domains
- [ ] **Sentient Species missing diet but Fauna has it** — inconsistent for biological organisms
- [ ] **Civilizations has magic_integration in core AND magic permeation** — potential overlap/confusion

---
---

## Iteration 2 — Cross-Category Fitness Review

Reviewing each improvement for relevance and fit within the overall system design.

### Removals (don't fit the system or are already handled)

| # | Item | Reason for Removal |
|---|------|--------------------|
| 1 | Geology: No erosion/weathering | Process, not a property — better as description text |
| 2 | Atmosphere: No seasonal atmospheric variation | Overlaps with Climate domain's responsibility |
| 3 | Atmosphere: Missing temperature profile | Too technical; overlaps Climate |
| 4 | Climate: No microclimate concept | Can already model as additional climate_zones with smaller scope |
| 5 | Biomes: No vertical zonation | Already achievable via elevation_range field + multiple biomes |
| 6 | Biomes: Missing primary productivity | Too academic for a worldbuilding tool |
| 7 | Flora: Missing symbiotic relationships | Better handled by the generic relationship system |
| 8 | Fauna: Missing predator/prey formal fields | Already handled by the generic relationship system |
| 9 | Ecosystems: Missing nutrient cycling | Too technical; description text suffices |
| 10 | Civilizations: Missing age/founding date | Redundant — `founded_era_id` + era's dating covers this |
| 11 | Magic Systems: Nearly empty core config | BY DESIGN — facade pattern over sub-tables |
| 12 | Magic Systems: Confusing dual identity | BY DESIGN — element_types enable the generic domain list/detail UI |
| 13 | Arcane Sciences: Missing key inventors | Better handled by relationships to sentient species |
| 14 | Arcane Sciences: engineering_principle_ids as json | Consistent with json-array-of-ids pattern used throughout codebase |
| 15 | History: No cause chain | The relationship system already handles event-to-event links |
| 16 | History: Missing calendar system reference | Would require a whole new calendar model — scope too large |
| 17 | Civilizations: magic_integration overlap with permeation | Intentional — core field is a quick summary, permeation has detail |
| 18 | Hydrology: Watershed concept absent | Spatial relationships better handled by map/relationship system |

### Refinements (kept but adjusted)

| # | Item | Adjustment |
|---|------|------------|
| 1 | Cosmology: constellation groupings | Demote to nice-to-have — could be modeled as a custom element_type |
| 2 | Cosmology: binary star support | Demote to nice-to-have — edge case, orbital_parent_id covers most cases |
| 3 | Sentient Species: No gender system | Change to textarea `sex_and_gender` — avoids rigid modeling of highly variable concept |
| 4 | Cultures: civilization_id implies 1:1 | Change `civilization_id` to `civilization_ids` json array for many-to-many |
| 5 | Magic Economy: No mana-backed currency | Demote — can be described in existing fields |
| 6 | Planar Systems: No discovery history | Can be handled by History domain relationships — demote |

### Additions (missed in Iteration 1)

| # | New Item | Category | Rationale |
|---|----------|----------|-----------|
| 1 | Flora/Fauna: no `habitat_description` textarea | Natural World | biome_ids gives structure but no prose about habitat preferences |
| 2 | Civilizations: no `diplomatic_stance` field | Sentient World | aggressive, isolationist, mercantile, expansionist, defensive — useful shorthand |
| 3 | Sentient Species: no `strength` / physical capability fields | Sentient World | Physical traits like strength, speed, endurance missing for a biological domain |
| 4 | Planar Systems: no `alignment` or `moral_nature` | Magic & Technology | planes in fantasy often have moral/elemental alignment (good, evil, chaotic, neutral) |
| 5 | History: no `era_name` / `era_description` on elements | Meta | events have era_id but eras themselves aren't first-class element types with their own fields |

---
---

## Iteration 3 — Final Holistic Review

Final pass reviewing for balance, scope creep, form size, and overall coherence.

### Additional Removals (Iteration 3)

| # | Item | Reason |
|---|------|--------|
| 1 | Sentient Species: `strength` / physical capabilities | Too RPG/stat-sheet oriented; not suited to an ecology worldbuilding tool. Physical traits are better captured in `physical_description` textarea |
| 2 | Cultures: music/dance traditions | Already covered by existing `art_forms` json field which lists artistic expressions |
| 3 | Cultures: clothing/fashion | Already coverable via `customs` json field; not worth a separate field |
| 4 | Civilizations: justice_system textarea | Can be described in the element's description field; adding this AND education bloats the form |
| 5 | Civilizations: education textarea | Same as justice_system — description field suffices |
| 6 | Magic Ecology: seasonal_variation | Overlaps with `cycle_duration` and `stages` fields — the cycle itself IS the seasonal variation |
| 7 | Magic Ecology: remediation | Overlaps with existing `disruption_risks` and `historical_disruptions` — can be folded into those descriptions |
| 8 | Magic Economy: trade_flows | Overlaps with `geographic_distribution` and `controlling_entities` fields |
| 9 | Planar Systems: alignment/moral_nature | Too D&D-specific; not universal to all fantasy settings. Can use description |
| 10 | Sentient Species: environmental_adaptations as json | Better as part of `physical_description` textarea rather than structured json |
| 11 | History: era_name for eras | Would require conditional fields per element_type — scope creep for a domain config change |

### Field Count Impact Analysis

Current field counts → After improvements:

| Domain | Current | After | Delta | Verdict |
|--------|---------|-------|-------|---------|
| Cosmology | 10 | 12 | +2 | OK |
| Geology | 7 | 7 | +0 | select expansion only |
| Hydrology | 7 | 8 | +1 | OK |
| Atmosphere | 5 | 8 | +3 | Needed — was underdeveloped |
| Climate | 7 | 10 | +3 | OK — still under Cosmology's 12 |
| Biomes | 6 | 7 | +1 | OK |
| Flora | 9 | 12 | +3 | Reasonable — parallel to Fauna |
| Fauna | 9 | 13 | +4 | Slightly heavy — but parity fixes needed |
| Ecosystems | 7 | 10 | +3 | OK |
| Sentient Species | 9 | 13 | +4 | Reasonable — species warrant detail |
| Civilizations | 9 | 12 | +3 | OK |
| Cultures | 10 | 14 | +4 | Slightly heavy — mitigated by textarea flexibility |
| Planar Systems | 13 | 16 | +3 | Heavy — cap at 15, drop one |
| Arcane Sciences | 13 | 15 | +2 | Acceptable |
| Magic Ecology | 8 | 10 | +2 | OK |
| Magic Economy | 13 | 15 | +2 | Acceptable |
| History | 6 | 9 | +3 | Good — was underweight |
| Geography | 7 | 12 | +5 | Reasonable — place data needs richness |

**Planar Systems concern:** Already at 13 fields, adding 3 more textareas (inhabitants, resources, hazards) pushes to 16. Drop `resources` — planar resources can be described in `native_environment` textarea which already describes conditions. Final: 15 fields.

### Final Consolidated Improvement List

---

#### HIGH PRIORITY — Consistency Fixes & Gap Fills

These address inconsistencies between parallel domains and fill clear structural gaps.

**Bug-level fixes (inconsistencies):**
1. Cosmology: Add `"nebula"` to `body_type` select options (already in element_types but missing from field)
2. Fauna: Add `rarity` field (select: common, uncommon, rare, very_rare, unique) — parity with Flora
3. Sentient Species: Add `diet` field (select: herbivore, carnivore, omnivore, filter_feeder, photosynthetic, detritivore, magical, custom) — parity with Fauna
4. Ecosystems: Change `biome_id` (text) to `biome_ids` (json) — parity with Flora/Fauna

**Critical missing fields:**
5. Cosmology: Add `composition` (select: rocky, gas_giant, ice_giant, metallic, plasma, mixed, energy, unknown)
6. Sentient Species: Add `physical_description` (textarea) — core species identity with no current field
7. Geography: Add `climate_zone_id` (text) — link to sibling domain
8. Geography: Add `biome_id` (text) — link to sibling domain
9. Geography: Add `terrain_description` (textarea) — physical landscape
10. Atmosphere: Add `layers` (json) — atmospheric stratification, brings field count to parity
11. Atmosphere: Add `wind_systems` (textarea) — prevailing winds and patterns
12. Atmosphere: Add `weather_patterns` (textarea) — distinct from `phenomena`, focused on recurring weather

#### MEDIUM PRIORITY — Enrichment

These add genuinely useful worldbuilding fields without being strictly necessary.

**Natural World:**
13. Geology: Expand `feature_type` select with: rift_valley, mesa, fjord, badlands, delta
14. Hydrology: Expand `water_type` select with: estuary, geyser, spring, reef
15. Hydrology: Add `water_quality` (textarea)
16. Climate: Add `humidity` (text)
17. Climate: Add `weather_extremes` (json) — named hazards like hurricanes, blizzards
18. Climate: Add `historical_shifts` (textarea) — long-term climate change
19. Biomes: Add `carrying_capacity` (text)
20. Flora: Add `seasonal_behavior` (textarea) — deciduous/dormancy/bloom cycles
21. Flora: Add `cultivation_difficulty` (select: wild_only, difficult, moderate, easy, domesticated)
22. Flora: Add `endangered_status` (select: thriving, stable, declining, endangered, critical, extinct_in_wild)
23. Fauna: Add `migration_pattern` (textarea)
24. Fauna: Add `habitat_niche` (text) — microhabitat within biome
25. Fauna: Add `communication` (textarea) — non-sentient communication methods
26. Flora: Add `habitat_description` (textarea)
27. Fauna: Add `habitat_description` (textarea)
28. Ecosystems: Add `geographic_scope` (text) — area/extent
29. Ecosystems: Add `succession_stage` (select: pioneer, early, developing, mature, climax, degraded)
30. Ecosystems: Add `age` (text) — how long established

**Sentient World:**
31. Sentient Species: Add `sex_and_gender` (textarea)
32. Sentient Species: Add `aging_stages` (textarea) — life phases and capabilities
33. Civilizations: Add `capital_id` (text) — link to geography place
34. Civilizations: Add `growth_status` (select: nascent, growing, stable, stagnant, declining, collapsed, resurgent)
35. Civilizations: Add `diplomatic_stance` (select: expansionist, aggressive, defensive, isolationist, mercantile, diplomatic, tributary, hegemonic)
36. Cultures: Add `funerary_practices` (textarea)
37. Cultures: Add `family_structure` (textarea) — kinship, marriage, household
38. Cultures: Add `calendar_system` (textarea) — how time is measured
39. Cultures: Change `civilization_id` (text) to `civilization_ids` (json) — many-to-many

**Magic & Technology:**
40. Magic Systems: Add `magic_philosophy` (textarea) — hard vs soft, overall paradigm
41. Planar Systems: Add `inhabitants` (textarea) — who lives there
42. Planar Systems: Add `hazards` (textarea) — dangers to visitors
43. Arcane Sciences: Add `research_methodology` (textarea)
44. Arcane Sciences: Add `safety_standards` (textarea)
45. Magic Ecology: Add `mana_pollution` (textarea) — magical waste and contamination
46. Magic Ecology: Add `dead_zones` (textarea) — mana-barren areas
47. Magic Economy: Add `market_structure` (select: monopoly, oligopoly, guild_controlled, free_market, state_run, barter, auction, mixed)
48. Magic Economy: Add `black_market_details` (textarea) — illicit magical trade specifics

**Meta:**
49. History: Add `reliability` (select: mythological, legendary, oral_tradition, partially_documented, well_documented, verified)
50. History: Add `geographic_scope` (select: local, regional, continental, global, planar, cosmic)
51. History: Add `significance` (select: minor, moderate, major, transformative, world_altering)
52. Geography: Add `resources` (textarea) — available economic/natural resources
53. Geography: Add `trade_role` (select: isolated, minor_stop, regional_hub, major_crossroads, capital_market, global_nexus)
54. Geography: Add `accessibility` (select: inaccessible, remote, difficult, moderate, accessible, major_thoroughfare)

#### NICE-TO-HAVE — Lower Priority

55. Cosmology: Constellation groupings (custom element_type or separate concept)
56. Cosmology: Binary/multiple star system modeling
57. Geology: Soil types field
58. Geology: Formal hydrology connection
59. Hydrology: Tidal patterns linked to cosmology moons
60. Sentient Species: Subspecies/variant concept
61. Biomes: Ecotone/transition zone concept
62. Biomes: Dominant species references
63. Ecosystems: Trophic level detail fields
64. Planar Systems: Planar weather/storms
65. Planar Systems: Planar resources field
66. Magic Economy: Import/export patterns
67. Magic Economy: Mana-backed currency details

---

### Summary Statistics

- **Total improvements identified:** 67
- **Removed in Iteration 2:** 18 (didn't fit system design)
- **Removed in Iteration 3:** 11 (scope creep, overlap, form bloat)
- **Final retained:** 54 improvements across 3 priority tiers
  - High Priority (consistency fixes): 12
  - Medium Priority (enrichment): 42
  - Nice-to-Have: 13
- **Domains touched:** 18 of 20 (Custom and Magic Systems core untouched by design)
- **Cross-category fixes:** 5 (biome reference parity, atmosphere parity, geography links, fauna rarity, species diet)
