# Creative Templates Expansion Plan

## Goal
Make the app a better creative tool by expanding pre-built templates, adding cross-domain "World Blueprints" that suggest coherent combinations of elements, and improving the template selection UI. Each iteration is a self-contained task.

---

## Current State (Updated after execution through iteration ~80)
- **19 domains** with element types (custom domain is freeform)
- **~220+ archetypes** across all 20 domains (including magic_systems: 14, custom: 4)
- **20 World Blueprints** with cross-domain suggestions (High Fantasy, Dark Fantasy, Oceanic World, Desert Realm, etc.)
- **BlueprintService** resolves suggestions to actual archetypes with domain metadata
- **"Pairs Well With"** system with ~60 cross-domain pairing rules
- Blueprint selection integrated into world creation form and onboarding
- Blueprint suggestions panel on world dashboard
- "Surprise Me" random archetype button on domain list pages
- Archetype count badges on domain cards
- Empty-state archetype quick-start cards on domain list pages
- Blueprints browsable at `/blueprints` with tag filtering
- Archetypes are defined in each domain config file in `src/domains/<domain>.ts` as an `archetypes: Archetype[]` array
- The `Archetype` interface is: `{ id, name, description, element_type, summary?, detailed_notes?, fields: Record<string, any> }`
- Archetypes display as clickable cards above the element creation form in `templates/pages/element-form.njk`

---

## Architecture Reference
- **Domain configs**: `src/domains/<domain>.ts` — each exports a `DomainConfig` with fields, elementTypes, elementTypeDescriptions, prompts, archetypes
- **Types**: `src/types/domains.ts` (DomainConfig, Archetype), `src/types/index.ts` (World, Constellation, etc.)
- **Services**: `src/services/` — WorldService, ConstellationService, DomainService, etc.
- **Routes**: `src/routes/domains.ts` (element CRUD), `src/routes/worlds.ts` (world list/create), `src/routes/constellations.ts`
- **Templates**: `templates/pages/` — Nunjucks (.njk), HTMX + Alpine.js for interactivity
- **Server**: `src/server.ts` — Express app, mounts routes, Nunjucks config
- **Master DB**: `src/db/connection.ts` — `getMasterDb()` for world/constellation tables
- **World DBs**: Per-world SQLite at `data/worlds/<id>/world.db`
- **CSS**: `public/css/components.css` (all component styles), `public/css/main.css` (base/layout)

---

## Phase 1: Add Archetypes to Magic Systems (Iterations 1-2)

### Iteration 1 — Magic Systems: Core Archetypes (6)
**File**: `src/domains/magic-systems.ts`
**Task**: Add 6 archetypes to the magic_systems domain (it currently has 0).
Add these archetypes after the `defaultSortField` line:
1. `ambient_field` — "Ambient Mana Field" — Magic as a pervasive environmental energy that can be tapped, shaped, and depleted. element_type: source
2. `divine_gift` — "Divine Gift" — Magic granted by gods to chosen mortals — prayers, blessings, and divine wrath. element_type: source
3. `blood_magic_law` — "Law of Equivalent Exchange" — All magic requires sacrifice proportional to the effect — blood, life force, memories, or years. element_type: law
4. `elemental_taxonomy` — "Elemental Schools" — Magic classified into elemental categories (fire, water, earth, air, and variants). element_type: taxonomy
5. `wild_surge` — "Wild Magic Surge" — Uncontrolled magical eruptions that warp reality in unpredictable ways. element_type: phenomenon
6. `apprentice_to_archmage` — "Apprentice-to-Archmage Scale" — A structured power progression from novice to world-shaking power. element_type: power_tier

### Iteration 2 — Magic Systems: Exotic Archetypes (5)
**File**: `src/domains/magic-systems.ts`
**Task**: Add 5 more archetypes:
1. `innate_biological` — "Innate Biological Magic" — Magic as a biological trait — some species or bloodlines are born with it. element_type: source
2. `mana_crystal` — "Crystallized Mana" — Solid magic that can be mined, refined, traded, and consumed as fuel. element_type: material
3. `forbidden_spell` — "Forbidden Working" — A spell so dangerous or morally abhorrent that all civilizations ban it. element_type: spell
4. `soul_cost` — "Soul Erosion" — Casting slowly wears away the caster's soul, personality, and memories. element_type: cost
5. `runic_system` — "Runic Inscription System" — Magic encoded in written symbols — carved, painted, or tattooed. element_type: taxonomy

---

## Phase 2: Expand Existing Domain Archetypes (Iterations 3-22)

Each iteration adds 3 new archetypes to one domain. Focus on creative, unusual, or genre-crossing concepts that complement the existing templates.

### Iteration 3 — Cosmology +3
**File**: `src/domains/cosmology.ts`
Add: `binary_stars` (two stars orbiting each other, creating complex seasons), `hollow_world` (a planet that's hollow with an interior surface and inner sun), `crystal_sphere` (the cosmos enclosed in a literal crystalline shell — a cosmology model, not just a body)

### Iteration 4 — Geology +3
**File**: `src/domains/geology.ts`
Add: `floating_islands` (masses of rock suspended by magic, gas, or anti-gravity minerals), `glass_desert` (a vast plain of fused silica from an ancient cataclysm), `living_mountain` (a geological feature that is actually a dormant or sleeping creature)

### Iteration 5 — Hydrology +3
**File**: `src/domains/hydrology.ts`
Add: `underground_ocean` (a vast body of water in a subterranean cavern), `blood_tide_sea` (a sea with red water from mineral content or biological activity), `frozen_river` (a permanently frozen river used as a road — a highway of ice)

### Iteration 6 — Atmosphere +3
**File**: `src/domains/atmosphere.ts`
Add: `layered_breathability` (an atmosphere breathable only at certain altitudes — civilizations stratified by height), `singing_winds` (winds that produce harmonic tones when passing through certain formations), `luminous_sky` (an atmosphere that glows at night from bioluminescent particles)

### Iteration 7 — Climate +3
**File**: `src/domains/climate.ts`
Add: `eternal_twilight` (a climate zone in permanent dim light — between a tidally locked day and night side), `storm_belt` (a band of continuous storms that divides the world), `mana_seasons` (seasons driven by magical tides rather than axial tilt)

### Iteration 8 — Biomes +3
**File**: `src/domains/biomes.ts`
Add: `fungal_jungle` (a biome dominated by giant fungi instead of trees), `salt_flat` (a vast, blinding expanse of crystallized salt — beautiful and hostile), `floating_reef` (a biome of organisms growing on airborne debris in a sky realm)

### Iteration 9 — Flora +3
**File**: `src/domains/flora.ts`
Add: `singing_tree` (a tree whose hollow branches produce music in the wind — culturally sacred), `corpse_bloom` (a massive flower that only grows from the dead — beautiful and unsettling), `iron_root` (a plant whose roots extract and concentrate metal from soil — used in primitive smelting)

### Iteration 10 — Fauna +3
**File**: `src/domains/fauna.ts`
Add: `symbiotic_pair` (two species so interdependent they function as one organism), `domesticated_predator` (a dangerous carnivore bred into a loyal but volatile companion), `living_fossil` (a creature unchanged for millions of years — a relic of a prior age)

### Iteration 11 — Ecosystems +3
**File**: `src/domains/ecosystems.ts`
Add: `war_scarred` (an ecosystem recovering from a magical or military catastrophe), `parasitic_network` (an ecosystem dominated by parasitic relationships rather than predation), `seasonal_migration` (an ecosystem defined by massive annual animal movements)

### Iteration 12 — Sentient Species +3
**File**: `src/domains/sentient-species.ts`
Add: `hive_mind` (a collective intelligence — thousands of bodies, one mind), `constructed_people` (golems, automata, or AI given sentience — created, not born), `phase_beings` (creatures that exist partially in another plane — flickering between realities)

### Iteration 13 — Civilizations +3
**File**: `src/domains/civilizations.ts`
Add: `underground_empire` (a civilization built entirely underground — deep cities, fungal agriculture, no sky), `pirate_republic` (a lawless maritime state governed by codes of conduct among equals), `living_city` (a civilization that IS its city — the settlement is a single vast organism its people live within)

### Iteration 14 — Cultures +3
**File**: `src/domains/cultures.ts`
Add: `death_celebrants` (a culture that celebrates death as the greatest transition — elaborate funerary arts), `silence_keepers` (a culture that communicates primarily through sign, writing, or telepathy — silence is sacred), `nomadic_storytellers` (a culture whose entire history and law exists only in oral tradition — the living library)

### Iteration 15 — Planar Systems +3
**File**: `src/domains/planar-systems.ts`
Add: `bleeding_wound` (a place where two planes overlap and merge — reality is unstable), `prison_plane` (a plane designed to contain something — sealed by ancient magic, now weakening), `echo_plane` (a plane that replays past events on loop — a frozen moment in time)

### Iteration 16 — Arcane Sciences +3
**File**: `src/domains/arcane-sciences.ts`
Add: `golem_workforce` (mass-produced magical constructs used for labor — the ethical questions they raise), `spell_telegraph` (a communication network using enchanted relay stations), `healing_vat` (a medical device that rebuilds tissue using magical templates — expensive and imperfect)

### Iteration 17 — Magic Ecology +3
**File**: `src/domains/magic-ecology.ts`
Add: `mana_desert` (a region drained of all magical energy — dead zone where no magic works), `ley_line_intersection` (a nexus point where multiple ley lines cross — enormous power, enormous instability), `magical_apex_predator` (a creature at the top of the mana food chain — absorbs magic from everything around it)

### Iteration 18 — Magic Economy +3
**File**: `src/domains/magic-economy.ts`
Add: `enchanter_guild` (a powerful professional guild that monopolizes enchantment services), `mana_currency` (a society that uses raw mana as money — literally spending magical energy), `spell_insurance` (a business that insures against magical accidents — the actuarial science of fireballs)

### Iteration 19 — History +3
**File**: `src/domains/history.ts`
Add: `the_sundering` (a cataclysmic event that broke the world — continents split, magic changed, civilizations fell), `first_contact` (the moment two completely isolated civilizations discovered each other), `forbidden_knowledge` (a discovery so dangerous that all nations agreed to suppress it)

### Iteration 20 — Geography +3
**File**: `src/domains/geography.ts`
Add: `crossroads_town` (a settlement at the intersection of major trade routes — cosmopolitan, wealthy, contested), `forbidden_zone` (an area sealed off by magic, law, or danger — no one enters, and those who do don't return), `sky_port` (a docking station for flying ships, sky whales, or other aerial transport)

### Iteration 21 — Second pass: more unusual archetypes for Natural domains (+2 each to cosmology, geology, hydrology, atmosphere, climate, biomes)
Add 2 more archetypes to each of the 6 natural-world domains (12 total), focusing on the weird and wonderful — things that make a world feel truly alien.

### Iteration 22 — Second pass: more unusual archetypes for Sentient/Magic domains (+2 each to flora, fauna, ecosystems, sentient-species, civilizations, cultures)
Add 2 more archetypes to each of the 6 remaining domains (12 total), focusing on genre-bending concepts.

---

## Phase 3: World Blueprints — Cross-Domain Template System (Iterations 23-35)

A "World Blueprint" is a named theme that suggests a coherent set of archetypes across multiple domains. When creating a world, you can optionally pick a Blueprint and it populates a checklist of suggested elements you can create.

### Iteration 23 — Define WorldBlueprint type
**File**: `src/types/index.ts`
**Task**: Add a `WorldBlueprint` interface:
```typescript
interface WorldBlueprint {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  magic: boolean; // whether this blueprint assumes magic
  suggestions: BlueprintSuggestion[];
}
interface BlueprintSuggestion {
  domain: string; // domain id
  archetypeId: string; // archetype id within that domain
  priority: 'essential' | 'recommended' | 'optional';
  note?: string; // why this archetype fits
}
```

### Iteration 24 — Create world blueprints data file
**File**: `src/blueprints/index.ts` (new)
**Task**: Create the blueprints data file with the first 5 blueprints:
1. **"Oceanic World"** — A world dominated by water. Suggests ocean hydrology, coral reef biomes, aquatic species, maritime cultures, island geology.
2. **"Desert Realm"** — Harsh, arid, resource-scarce. Suggests arid desert climate, desert biomes, drought-adapted flora/fauna, nomadic civilizations.
3. **"High Fantasy Realm"** — Classic high fantasy. Suggests diverse sentient species, feudal kingdoms, elemental magic, ancient forests, dragons.
4. **"Post-Cataclysm"** — A world recovering from disaster. Suggests ruins geography, war-scarred ecosystems, scavenger cultures, mutated fauna.
5. **"Underground World"** — Life beneath the surface. Suggests cave systems, subterranean biomes, fungal flora, underground civilizations.

### Iteration 25 — Add 5 more blueprints
**File**: `src/blueprints/index.ts`
**Task**: Add blueprints 6-10:
6. **"Frozen Wastes"** — Ice-bound world. Polar climate, tundra biomes, glacier hydrology, hardy mountain folk, survival cultures.
7. **"Sky Realm"** — World in the clouds. Floating islands geology, sky realm biomes, avian species, sky ports, wind-based magic.
8. **"Dying World"** — A world in ecological collapse. Mana deserts, depleted resources, desperate civilizations, forbidden magic.
9. **"Primordial World"** — Young, raw, volcanic. Active geology, volcanic biomes, primitive ecosystems, early civilizations.
10. **"Planar Crossroads"** — A world where planes overlap. Multiple planar connections, wild magic, diverse species from different planes.

### Iteration 26 — Add 5 more blueprints
**File**: `src/blueprints/index.ts`
**Task**: Add blueprints 11-15:
11. **"Archipelago"** — Island chains. Islands geology, oceanic zones, maritime traders, port cities, reef ecosystems.
12. **"Magical Industrial"** — Magitech revolution. Arcane sciences focus, magitech infrastructure, enchanter guilds, urban geography.
13. **"Mythic World"** — Gods walk among mortals. Divine planes, theocratic empires, mythical beasts, cosmic cosmology.
14. **"Dark Fantasy"** — Grim and dangerous. Shadow planes, necrocracies, soul costs, corrupted ecosystems, forbidden knowledge.
15. **"Pastoral"** — Peaceful and rural. Temperate climate, pastoral cultures, agrarian civilizations, gentle flora/fauna.

### Iteration 27 — Add 5 more blueprints
**File**: `src/blueprints/index.ts`
**Task**: Add blueprints 16-20:
16. **"Hollow World"** — Life on the inside. Hollow world cosmology, inner sun, inverted biomes, isolated civilizations.
17. **"Dual World"** — Two contrasting halves. Tidally locked, eternal twilight zone, different biomes per hemisphere.
18. **"Living World"** — The planet itself is alive. Living mountains, symbiotic megaorganism ecosystems, biological magic.
19. **"Ancient Ruins"** — A world built on the bones of a prior civilization. Ruins everywhere, lost technology, archaeological cultures.
20. **"Elemental Chaos"** — Raw elemental forces shape everything. Elemental planes bleeding through, extreme biomes, elemental magic.

### Iteration 28 — Blueprint service
**File**: `src/services/BlueprintService.ts` (new)
**Task**: Create a service that:
- Lists all blueprints
- Gets a blueprint by ID
- Returns the full archetype details for each suggestion (resolves domain + archetypeId to actual Archetype objects)
- Filters blueprints by magic/no-magic compatibility

### Iteration 29 — Blueprint routes
**File**: `src/routes/blueprints.ts` (new)
**Task**: Create routes:
- `GET /blueprints` — list all blueprints (rendered as a browsable grid)
- `GET /blueprints/:blueprintId` — detail view showing all suggested archetypes grouped by domain

### Iteration 30 — Blueprint list template
**File**: `templates/pages/blueprint-list.njk` (new)
**Task**: Create a page showing all 20 blueprints as visual cards with icon, name, description, magic badge, and suggestion count. Link each card to its detail page.

### Iteration 31 — Blueprint detail template
**File**: `templates/pages/blueprint-detail.njk` (new)
**Task**: Create a page showing a single blueprint with:
- Header with name, description, icon, color
- Suggestions grouped by domain category (Natural, Sentient, Magic)
- Each suggestion shows: domain icon, archetype name, archetype description, priority badge (essential/recommended/optional)
- "Use This Blueprint" button that links to world creation with the blueprint pre-selected

### Iteration 32 — Mount blueprint routes and nav
**Files**: `src/server.ts`, `templates/layouts/base.njk`
**Task**: Mount the blueprint router at `/blueprints` in the server. Add a "Blueprints" link to the top navigation bar in the base layout.

### Iteration 33 — Integrate blueprints into onboarding wizard
**File**: `templates/pages/onboarding.njk`
**Task**: Add a new Step 2.5 (after description, before magic) that shows a grid of world blueprints. Selecting a blueprint auto-fills the magic toggle and starting domain. Add "Or skip and customize everything" option. Pass blueprint data from the worlds route.

### Iteration 34 — Integrate blueprints into quick-create form
**Files**: `templates/pages/world-new.njk`, `src/routes/worlds.ts`
**Task**: Add an optional "World Blueprint" dropdown to the quick-create form. When selected, store the blueprint_id on the world (add blueprint_id column to worlds table in master.db). Pass blueprint list from route.

### Iteration 35 — Blueprint suggestions on world dashboard
**Files**: `templates/pages/world-dashboard.njk`, `src/routes/worlds.ts`
**Task**: If a world has a blueprint_id, show a "Blueprint Suggestions" section on the dashboard. For each suggestion, show the domain, archetype name, and whether the user has already created an element matching that archetype. Include a "Create" link for uncreated suggestions that goes to the element form with the archetype pre-selected.

---

## Phase 4: Blueprint Suggestions Panel on Domain Pages (Iterations 36-40)

### Iteration 36 — Pass blueprint context to domain routes
**File**: `src/routes/domains.ts`
**Task**: When rendering the domain list page, if the world has a `blueprint_id`, load the blueprint and filter its suggestions for the current domain. Pass these as `blueprintSuggestions` to the template.

### Iteration 37 — Blueprint suggestion cards on domain list
**File**: `templates/pages/domain-list.njk`
**Task**: If `blueprintSuggestions` exist, show a collapsible "Suggested by Blueprint" panel above the element grid. Each suggestion shows the archetype name, description, priority, and a "Create from Template" link. Already-created elements are shown as completed.

### Iteration 38 — "Pairs Well With" data
**File**: `src/blueprints/pairs.ts` (new)
**Task**: Define a `ARCHETYPE_PAIRS` data structure mapping archetype IDs to related archetypes in OTHER domains. For example: `coral_reef_biome` pairs with `aquatic_people`, `coastal_wetlands`, `maritime_traders`. Cover at least 30 key archetypes with 2-3 cross-domain pairs each.

### Iteration 39 — "Pairs Well With" suggestions on element form
**Files**: `templates/pages/element-form.njk`, `src/routes/domains.ts`
**Task**: When an archetype is selected for a new element, show a "Pairs Well With" sidebar or section below the archetype picker. Show 2-3 archetypes from other domains that would complement this element. Each shows: domain name, archetype name, description, and a link to create it.

### Iteration 40 — "Pairs Well With" on element detail page
**Files**: `templates/pages/element-detail.njk`, `src/routes/domains.ts`
**Task**: On the element detail page, if the element was created from an archetype (match element_type + domain to find likely archetype), show a "Related Concepts" section with paired archetypes from other domains.

---

## Phase 5: More Archetypes — Round 2 (Iterations 41-60)

Each iteration adds 3 more archetypes to a domain. This round focuses on genre-specific concepts (sci-fi, horror, whimsy, mythic) to broaden creative range.

### Iteration 41 — Cosmology +3 (genre archetypes)
Add: `dyson_sphere` (a star enclosed in an artificial shell — sci-fi cosmology), `dream_sun` (a star that exists only while a god sleeps), `shattered_moon` (a moon broken into orbiting fragments — dramatic night skies)

### Iteration 42 — Geology +3
Add: `bone_fields` (a plain made of compressed ancient bones — fossil fuel equivalent), `singing_stones` (geological formations that resonate at specific frequencies), `scar_of_god` (a canyon/crater from a divine weapon strike — still radiates power)

### Iteration 43 — Hydrology +3
Add: `time_pool` (a body of water that shows visions of the past or future), `acid_lake` (a lake of corrosive liquid — natural defense and industrial resource), `tide_maze` (a coastal system where passages appear and vanish with the tide)

### Iteration 44 — Atmosphere +3
Add: `memory_fog` (a fog that causes confusion and lost memories), `crystalline_rain` (precipitation of tiny crystals instead of water), `void_layer` (an altitude where the atmosphere simply stops — a hard ceiling on the world)

### Iteration 45 — Climate +3
Add: `color_seasons` (seasons defined by the color the sky/foliage turns rather than temperature), `whisper_winter` (a season of unnatural silence — even sound is dampened), `hunger_season` (a brutal annual period where magic or resources become scarce)

### Iteration 46 — Biomes +3
Add: `bone_forest` (trees made of calcite growing from fossil-rich soil), `mirror_lake_biome` (a biome around a lake that perfectly reflects the sky — disorienting), `rust_waste` (a landscape of oxidized metal — remnant of an ancient industrial civilization)

### Iteration 47 — Flora +3
Add: `memory_moss` (a moss that records sounds and replays them when touched), `blood_oak` (a tree with red sap used medicinally — over-harvesting is destroying them), `spore_tower` (a massive fungal column that releases clouds of spores seasonally)

### Iteration 48 — Fauna +3
Add: `echo_bat` (a creature that navigates by psychic echolocation — sensing minds, not surfaces), `glass_snake` (a transparent reptile — beautiful, venomous, nearly invisible), `grief_moth` (an insect attracted to emotional pain — swarms appear at funerals and battles)

### Iteration 49 — Ecosystems +3
Add: `graveyard_ecosystem` (an ecosystem that thrives on death — scavengers, fungi, and bacteria forming a rich necro-ecology), `symbiotic_city` (an urban ecosystem where buildings, organisms, and magic form an interdependent web), `void_edge` (an ecosystem at the boundary of magical dead zones — adapted to fluctuating mana)

### Iteration 50 — Sentient Species +3
Add: `dreamwalkers` (a species that lives primarily in the dream plane — their physical bodies are secondary), `echo_people` (beings made of compressed sound — they speak themselves into existence), `memory_eaters` (a species that feeds on memories — symbiotic or parasitic depending on consent)

### Iteration 51 — Civilizations +3
Add: `merchant_armada` (a civilization of perpetually moving ships — no homeland, only fleet), `library_state` (a civilization organized around knowledge preservation — archivists rule), `beast_riders` (a civilization built on bonded relationships with massive creatures)

### Iteration 52 — Cultures +3
Add: `mask_wearers` (a culture where everyone wears masks — identity is the mask, not the face), `dream_architects` (a culture that builds primarily in shared dreams — physical structures are secondary), `bone_singers` (a culture that crafts music from the remains of the honored dead)

### Iteration 53 — Magic Systems +3
Add: `music_magic` (magic cast through song, rhythm, and harmony — each spell is a composition), `contract_magic` (all magic requires a binding agreement — the universe itself enforces contracts), `emotion_fuel` (magic powered by the caster's emotions — joy heals, rage destroys, grief wards)

### Iteration 54 — Planar Systems +3
Add: `memory_palace` (a plane formed from accumulated memories of all who have died), `inverse_plane` (a plane where physical laws are reversed — fire cools, gravity repels), `boundary_plane` (a plane that exists only at the borders between other planes — impossibly thin)

### Iteration 55 — Arcane Sciences +3
Add: `memory_crystal_archive` (a vast library stored in crystallized mana — complete sensory records), `weather_engine` (magitech that controls regional weather — agricultural revolution or weapon of war), `portal_network` (a transportation system of linked magical gateways — who controls the portals controls trade)

### Iteration 56 — Magic Ecology +3
Add: `mana_bloom` (a periodic explosion of magical energy — flora and fauna go wild, mutations spike), `dead_magic_adaptation` (organisms evolved to survive in mana-depleted zones), `magical_symbiosis` (two species sharing mana — one generates, one shapes, both benefit)

### Iteration 57 — Magic Economy +3
Add: `soul_market` (a market for trading soul fragments — memories, skills, years of life), `mana_bank` (an institution that stores and lends magical energy — interest accrues as spell potential), `artifice_factory` (mass production of enchanted goods — magical industrialization)

### Iteration 58 — History +3
Add: `the_silence` (an era when all magic stopped — and the devastating consequences), `golden_age` (a period of unprecedented peace and prosperity — now lost, always romanticized), `the_awakening` (the moment a world's population collectively gained magical ability)

### Iteration 59 — Geography +3
Add: `moving_city` (a settlement that physically relocates — on legs, wheels, tracks, or magic), `prison_island` (a remote island used to exile the dangerous — now a civilization of its own), `vertical_city` (a city built into a cliff face or ravine — hundreds of levels, no flat ground)

### Iteration 60 — Custom domain archetypes
**File**: `src/domains/custom.ts`
**Task**: Add 4 archetypes to the custom domain to help users understand what "custom" is for:
1. `language` — "Constructed Language" — Define a language with phonology, grammar, and script
2. `religion` — "Religious System" — A belief system with deities, cosmology, rituals, and clergy
3. `economic_system` — "Economic System" — Trade, currency, taxation, and resource distribution
4. `calendar` — "Calendar System" — Timekeeping with months, weeks, holidays, and astronomical basis

---

## Phase 6: "Pairs Well With" Data Population (Iterations 61-70)

### Iterations 61-70 — Populate cross-domain pair suggestions
**File**: `src/blueprints/pairs.ts`
**Task**: One iteration per pair of domain categories. Build out the `ARCHETYPE_PAIRS` data:

- **61**: Natural×Natural pairs (geology↔hydrology, climate↔biomes, atmosphere↔climate)
- **62**: Natural×Flora/Fauna (biomes→flora, biomes→fauna, geology→flora)
- **63**: Flora×Fauna×Ecosystems (flora↔fauna, both→ecosystems)
- **64**: Natural×Sentient (geology→geography, climate→civilizations, biomes→cultures)
- **65**: Sentient×Sentient (species→civilizations, civilizations→cultures, cultures→history)
- **66**: Sentient×Geography (civilizations→geography, cultures→geography, history→geography)
- **67**: Magic×Natural (magic-ecology→ecosystems, magic-ecology→biomes, magic-systems→cosmology)
- **68**: Magic×Sentient (magic-systems→civilizations, magic-economy→civilizations, arcane-sciences→cultures)
- **69**: Magic×Magic (magic-systems→planar-systems, magic-ecology→magic-economy, arcane-sciences→magic-systems)
- **70**: Cosmology×Everything (cosmology→planar-systems, cosmology→climate, cosmology→history)

---

## Phase 7: UI Polish and Creative Aids (Iterations 71-85)

### Iteration 71 — Archetype count badges on domain cards
**File**: `templates/pages/world-dashboard.njk`
**Task**: Show the number of available archetypes on each domain card (e.g., "7 templates") to entice exploration.

### Iteration 72 — Archetype preview tooltips
**File**: `templates/pages/element-form.njk`
**Task**: When hovering over an archetype card, show a tooltip with the key pre-filled fields (not just the description).

### Iteration 73 — "Random Archetype" button
**File**: `templates/pages/element-form.njk`, `templates/pages/domain-list.njk`
**Task**: Add a "Surprise Me" button that picks a random archetype and opens the form with it pre-filled.

### Iteration 74 — Blueprint filter by tag
**File**: `templates/pages/blueprint-list.njk`
**Task**: Add filter chips for blueprint categories: "Fantasy", "Sci-Fi", "Horror", "Pastoral", "Mythic", etc.

### Iteration 75 — Constellation-level blueprint
**Files**: `templates/pages/constellation-detail.njk`, `src/routes/constellations.ts`
**Task**: Allow applying a blueprint to all worlds in a constellation — each world gets the same set of suggestions.

### Iteration 76 — Blueprint completion tracker
**File**: `templates/pages/world-dashboard.njk`
**Task**: If the world has a blueprint, show a progress bar: "X of Y blueprint suggestions created".

### Iteration 77 — Improved onboarding: blueprint preview carousel
**File**: `templates/pages/onboarding.njk`
**Task**: When a blueprint is selected in the onboarding wizard, show a scrollable preview of what it suggests — making the creative palette visible before committing.

### Iteration 78 — Domain list empty state with archetype suggestions
**File**: `templates/pages/domain-list.njk`
**Task**: When a domain has no elements, instead of just "No X yet", show the top 3 archetypes as quick-start cards with one-click creation.

### Iteration 79 — "What's Missing" analysis
**Files**: `src/services/ValidationService.ts`, `templates/pages/validation.njk`
**Task**: Add a validation rule that checks the blueprint (if any) and reports which essential/recommended suggestions haven't been created yet.

### Iteration 80 — Archetype search
**Files**: `src/routes/worlds.ts` or new route, template
**Task**: Add a searchable page listing ALL archetypes across all domains. Users can search by name, filter by domain or category, and click to go directly to the creation form.

### Iteration 81 — World dashboard "Quick Create" grid
**File**: `templates/pages/world-dashboard.njk`
**Task**: Add a "Quick Create" section to the world dashboard showing 6 recommended archetypes (from blueprint or most popular) as one-click creation cards.

### Iteration 82 — Archetype detail modal
**File**: `templates/pages/element-form.njk`
**Task**: Add a "View Details" link on each archetype card that opens a modal showing ALL the pre-filled fields, the description, and any "pairs well with" suggestions.

### Iteration 83 — Blueprint comparison view
**File**: `templates/pages/blueprint-list.njk`
**Task**: Allow selecting 2-3 blueprints and showing them side-by-side — comparing which domains and archetypes each suggests.

### Iteration 84 — Export blueprint as shareable JSON
**File**: `src/routes/blueprints.ts`
**Task**: Add a route to export a blueprint as a JSON file that can be imported by another user.

### Iteration 85 — Custom blueprint creator
**Files**: new template, route, and service methods
**Task**: Let users create their own blueprints by picking archetypes from any domain and saving them as a reusable template.

---

## Phase 8: Archetype Quality Pass (Iterations 86-95)

### Iteration 86 — Add summary and detailed_notes to all archetypes missing them
Review every archetype across all domains. Many only have `description` and `fields` but lack `summary` and `detailed_notes`. Add these for richer pre-fill.

### Iterations 87-91 — Add 2 more archetypes per domain (all 19 non-custom domains)
5 iterations, each covering ~4 domains, adding 2 archetypes each. Focus on archetypes that fill gaps in genre coverage — ensure every domain has at least 10 archetypes.

### Iteration 92 — Archetype field completeness
Review all archetypes and ensure their `fields` objects fill ALL relevant domain fields (not just a subset). Currently many archetypes only pre-fill 3-4 of 8+ fields.

### Iteration 93 — Add "tags" to archetypes for searchability
**File**: `src/types/domains.ts`
**Task**: Add optional `tags?: string[]` to the `Archetype` interface. Populate archetypes with tags like "fantasy", "sci-fi", "horror", "whimsical", "grim", "alien", "classic".

### Iteration 94 — Archetype icons
**File**: `src/types/domains.ts`
**Task**: Add optional `icon?: string` to `Archetype` interface (Lucide icon name). Give distinct icons to archetypes so they're visually differentiable in the picker.

### Iteration 95 — Blueprint refinement
Review all 20 blueprints. Ensure each one references archetypes that actually exist (including all the new ones from Phases 2 and 5). Ensure good coverage across domain categories. Add `note` fields explaining why each archetype fits the blueprint.

---

## Phase 9: Final Polish (Iterations 96-100)

### Iteration 96 — CSS: Blueprint and archetype visual polish
**File**: `public/css/components.css`
**Task**: Add dedicated styles for blueprint cards, priority badges (essential/recommended/optional), completion indicators, and the archetype detail modal.

### Iteration 97 — Onboarding wizard: "Explore Blueprints" path
**File**: `templates/pages/onboarding.njk`
**Task**: Add an alternative onboarding flow: instead of step-by-step, show all blueprints and let the user pick one to auto-configure everything.

### Iteration 98 — World dashboard: creative prompts rotation
**File**: `templates/pages/world-dashboard.njk`
**Task**: Show a rotating "creative prompt" on the world dashboard, drawn from domain prompts relevant to underpopulated domains.

### Iteration 99 — Performance: lazy-load archetype data
**File**: `src/routes/domains.ts`
**Task**: For the element form, only send the currently selected archetype's data (not all archetypes) to reduce page size. Load others via HTMX on click.

### Iteration 100 — Final integration test
**Task**: Walk through the entire creative flow end-to-end: browse blueprints → pick one → create world → see suggestions → create elements from archetypes → see "pairs well with" → explore cross-domain connections. Fix any broken links, missing data, or UI issues.
