# Fictional Ecology World-Builder — Implementation Plan

## Tech Stack
- **Runtime**: Node.js + TypeScript (via `tsx`, no compile step)
- **Server**: Express.js + Nunjucks templates
- **Database**: SQLite via `better-sqlite3` (one .db per world)
- **Frontend**: HTMX + Alpine.js + D3.js (esbuild-bundled)
- **Search**: SQLite FTS5
- **Testing**: Vitest + supertest
- **CSS**: Custom with CSS variables, dark theme default

## 20 World-Building Domains

### Natural World
1. **Cosmology** — stars, moons, orbital mechanics, astral planes, cosmic entities
2. **Geology** — tectonic plates, mountains, ley line geology, magical minerals
3. **Hydrology** — oceans, rivers, enchanted waters, mana springs
4. **Atmosphere** — gas composition, mana density layers, arcane aurora
5. **Climate** — temperature zones, mana tides, magic-influenced seasons
6. **Biomes** — environments, wild magic zones, mana saturation levels
7. **Flora** — plants/fungi, mana-producing vegetation, reagent plants
8. **Fauna** — animals, magical creatures, familiars, planar beasts
9. **Ecosystems** — food webs, mana cycles, keystone magical species

### Sentient World
10. **Sentient Species** — biology, innate magic ability, mana sensitivity
11. **Civilizations** — governance, magical military, spell-based infrastructure
12. **Cultures** — magical traditions, arcane religions, folk magic, magical cuisine

### Magic & Technology
13. **Magic Systems** — sources, energy types, laws, taxonomies, materials, spells, costs, phenomena, power scaling
14. **Planar Systems** — planes of existence, connections, planar geography, planar entities
15. **Arcane Sciences & Magitech** — research trees, devices, engineering principles, infrastructure, failures
16. **Magic Ecology** — mana cycles, magical mutations, magical food webs, saturated environments
17. **Magic Economy & Resources** — mana resources, trade goods, labor market, regulations, black markets

### Meta
18. **History** — events, eras, magical cataclysms, magitech revolutions
19. **Geography** — places, ley lines, planar crossings, enchanted territories
20. **Custom** — user-defined domains

## Architecture

### Strategy Pattern: DomainService<T>
One generic service handles CRUD for any domain. Each domain is a config object defining:
- Table name, core fields, validation rules
- UI prompts for world-builders
- Relationship types to other domains
- Custom methods (escape hatch for unique logic)

### Magic Permeation Mixin
A `withMagicPermeation` mixin adds magic-awareness to any domain. Each of the 14 non-magic domains gets a companion `_magic_aspects` table with magic-specific fields. These are:
- Optional (hidden when world has magic disabled)
- Collapsible in the UI (progressive disclosure)
- Managed automatically by the mixin

### Magic Systems Composite Service
MagicSystemService manages 9 sub-tables via facade pattern:
- magic_sources, magic_energy_types, magic_laws
- magic_taxonomies, magical_materials, spell_classifications
- magic_costs_consequences, magical_phenomena, power_scaling_framework

### World-Level Magic Toggle
`worlds.magic_enabled` boolean — when false, all magic UI is hidden and magic domains disabled. Supports non-magical world-building too.

## Database Schema Summary

### Total Tables: ~95+
- Original domains: ~25 tables
- Magic Systems expansion: 9 tables
- Planar Systems: 4 tables
- Arcane Sciences: 6 tables
- Magic Ecology: 4 tables
- Magic Economy: 5 tables
- Magic Permeation companions: 14 tables
- Junction/linking tables: ~15 tables
- Support tables (tags, media, search, maps, timeline): ~12 tables

### Key Magic Tables

**magic_sources** — Where magic comes from (ley lines, crystals, divine, biological, dimensional, emotional, elemental, cosmic, ancestral, symbiotic, artificial, void, temporal)

**magic_energy_types** — Forms of magical energy (quasi-physical particles, measurability, spectrum, storage, conversion)

**magic_laws** — Rules governing magic (conservation, entropy, equivalence, sympathy, contagion, true naming, intent)

**magic_taxonomies** — Schools/disciplines/traditions (hierarchical, with cultural origins, requirements, incompatibilities)

**magical_materials** — Materials with magical properties (conductivity, capacity, resistance, stability ratings 1-10)

**spell_classifications** — Spell types by school, tier, casting method, duration, range, area, energy cost

**magical_phenomena** — Natural magical events (mana storms, wild magic zones, dimensional rifts, dead zones)

**power_scaling_framework** — Tier system from novice to mythic (abilities, capacity, population %, requirements)

**planes** — Planes of existence (material, astral, elemental, shadow, ethereal, divine, fey, dream, etc.)

**magitech_eras** — Progression from primal magic to post-singular arcane-tech

**magitech_devices** — Inventions fusing magic + technology (category, complexity, reliability, failure modes)

**magitech_research_nodes** — Tech tree DAG (prerequisites, breakthroughs, unlocks)

**mana_cycles** — How magical energy cycles through the environment (like carbon/water cycles)

**mana_resources** — Harvestable magic as natural resource (extraction, refinement, depletion)

## Cross-Domain Relationship Map

```
MAGIC SYSTEMS (core)
├── magic_sources ──→ geology, cosmology, planes
├── magic_energy_types ──→ planes
├── magic_laws ──→ arcane_engineering_principles
├── magic_taxonomies ──→ cultures, sentient_species
├── magical_materials ──→ geology, flora, fauna
├── spell_classifications → taxonomies, energy_types
├── magical_phenomena ──→ biomes, geography, climate, planes
└── power_scaling ──→ sentient_species, civilizations, labor_market

PLANAR SYSTEMS
├── planes ──→ cosmology, magic_sources
├── planar_connections ──→ geography
└── planar_entities ──→ fauna, sentient_species

ARCANE SCIENCES
├── magitech_eras ──→ history, civilizations
├── magitech_devices ──→ principles, materials, energy_types
├── research_nodes ──→ civilizations, devices, principles
└── magitech_failures ──→ history, biomes, ecosystems

MAGIC ECOLOGY
├── mana_cycles ──→ energy_types, ecosystems, biomes, climate
├── magical_mutations ──→ flora, fauna, species, phenomena
└── mana_saturated_env ──→ biomes, geography, energy_types

MAGIC ECONOMY
├── mana_resources ──→ magic_sources, geography, geology
├── trade_goods ──→ materials, devices, civilizations
├── labor_market ──→ power_scaling, taxonomies
└── regulations ──→ civilizations, cultures
```

## Implementation Phases

### Phase 1: Foundation
- Project setup (package.json, tsconfig, eslint, vitest)
- Express server, middleware, DB connection, migration system
- World CRUD, base layout, dark theme, home page

### Phase 2: Core Domain System
- DomainService<T> generic class
- Domain configs for all 20 domains
- Domain list/detail/edit pages
- Sidebar navigation, breadcrumbs

### Phase 3: Magic Systems Deep Build
- All 9 magic sub-tables
- MagicSystemService (facade over sub-services)
- Tabbed UI for magic system editing
- Power scaling tier ladder visualization

### Phase 4: Planar Systems
- Planes, connections, geography, entities tables
- Layered plane diagram editor
- Planar entity bestiary

### Phase 5: Magic Permeation Layer
- MagicPermeationConfig interface + withMagicPermeation mixin
- All 14 companion _magic_aspects tables
- Collapsible "Magical Aspects" sections on every domain detail page

### Phase 6: Arcane Sciences & Magitech
- Eras, principles, devices, infrastructure, research nodes, failures
- Interactive tech tree DAG visualization
- Magitech timeline

### Phase 7: Magic Ecology
- Mana cycles, mutations, magical food webs, saturated environments
- Circular flow diagram for mana cycles
- Mana saturation heatmap overlay

### Phase 8: Magic Economy
- Resources, trade goods, labor market, regulations, black markets
- Resource map, market catalog, profession cards

### Phase 9: Relationships & Search
- Typed relationships, food webs, impact flags
- FTS5 search, tags, filtering
- Cross-domain reference pickers

### Phase 10: Visualizations
- D3 force-directed relationship graph
- D3 timeline with custom calendars
- SVG map editor (pins, regions, ley lines)
- Food web diagrams, tech trees

### Phase 11: Polish
- Onboarding wizard (6 steps, now includes magic level)
- Consistency validation engine
- Export (JSON + Markdown), Import
- World forking/branching
- Magic toggle (enable/disable per world)

### Phase 12: Quality
- Unit tests for all services
- Route integration tests
- Error handling audit
- Documentation

## File Structure

```
fictional-ecology/
  src/
    server.ts
    config.ts
    db/
      connection.ts
      migrate.ts
      migrations/
        001_initial_schema.sql
        002_domain_tables.sql
        003_magic_systems_expansion.sql
        004_planar_systems.sql
        005_magic_permeation.sql
        006_arcane_sciences.sql
        007_magic_ecology.sql
        008_magic_economy.sql
        009_relationships.sql
        010_maps_timeline.sql
        011_search_fts.sql
        012_tags_media.sql
    services/
      BaseService.ts
      WorldService.ts
      DomainService.ts
      MagicPermeationMixin.ts
      MagicSystemService.ts
      PlanarSystemService.ts
      ArcaneScienceService.ts
      MagicEcologyService.ts
      MagicEconomyService.ts
      RelationshipService.ts
      MapService.ts
      TimelineService.ts
      SearchService.ts
      MediaService.ts
      ValidationService.ts
      ExportService.ts
      PromptService.ts
    domains/
      index.ts
      cosmology.ts ... geography.ts (20 config files)
    routes/
      index.ts
      worlds.ts, elements.ts, domains.ts
      relationships.ts, maps.ts, timeline.ts
      search.ts, export.ts, validation.ts, api.ts
    middleware/
      errorHandler.ts, worldContext.ts, requestLogger.ts
    validation/
      rules/ (ecological.ts, geographical.ts, magical.ts, etc.)
      engine.ts
    types/
      index.ts, domains.ts, database.ts, magic.ts, api.ts
    utils/
      dates.ts, markdown.ts, icons.ts, colors.ts
  templates/
    layouts/ (base.njk, world.njk)
    partials/ (nav, sidebar, cards, forms, magic-aspects-panel, etc.)
    pages/ (home, dashboard, domain-list, element-detail, graph, timeline, map, etc.)
  public/
    css/ (main.css, components.css, visualizations.css)
    js/ (htmx.min.js, alpine.min.js, app.js)
    js-src/ (graph.ts, timeline.ts, map-editor.ts, food-web.ts, tech-tree.ts)
    dist/ (esbuild output)
  data/
    worlds/{world-id}/ (world.db, media/)
  tests/
    services/, routes/, domains/, fixtures/
```
