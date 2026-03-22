# Client-Side Deployable Version — Implementation Plan

## Plan Iteration Log

### Iteration 1 — Basic Concept
Single HTML file + Alpine.js + localStorage. Rejected: too monolithic, hard to maintain.

### Iteration 2 — Risk Identification
- localStorage has ~5-10MB limit per origin — a world with hundreds of elements could hit this
- 234 archetypes + 20 blueprints + 20 domain configs = ~300KB of static data to bundle
- Nunjucks templates can't run client-side — need complete re-templating
- Maps require image upload (no filesystem access client-side) — must defer or rethink
- D3 visualizations (graph, timeline) add ~200KB bundle size

### Iteration 3 — Data Partitioning Strategy
Partition localStorage by world to avoid the 5MB limit:
- `fe:worlds` — Array of World objects (small, ~1KB per world)
- `fe:constellations` — Array of Constellation objects (small)
- `fe:world:{id}:elements` — Elements for one world
- `fe:world:{id}:relationships` — Relationships for one world
- `fe:world:{id}:tags` — Tags for one world
- `fe:world:{id}:eras` — Eras for one world

This mirrors the existing master.db + per-world.db architecture. Each world's data is loaded only when that world is open.

### Iteration 4 — Feature Scoping
**Core (must ship):**
- World CRUD (create, list, view, edit, delete)
- Constellation CRUD (create, list, view, link/unlink worlds)
- Element CRUD (all 20 domains with full field rendering)
- Archetype pre-fill when creating elements
- Blueprint browsing, filtering, selection during world creation
- Blueprint suggestions on world dashboard
- "Pairs Well With" suggestions on element form
- Relationships between elements
- Tags on elements
- Search (client-side text filtering)
- JSON download per constellation or world
- JSON upload to import a constellation or world
- Eras/timeline data (CRUD, no D3 visualization)

**Deferred (not in initial build):**
- Map editor (requires image handling)
- Graph visualization (D3 dependency, complex)
- Timeline D3 visualization
- Magic system sub-tables (9 tables with custom forms — complex)
- Full-text search ranking (use simple string matching instead)
- Validation service (client-side validation is simpler)

### Iteration 5 — Architecture Decision
**Build approach:** Use esbuild (already in project) to compile a client bundle from shared source files.

**File structure:**
```
client/
├── index.html          — SPA shell, all page templates as Alpine components
├── app.js              — Built by esbuild: data store + domain configs + blueprints + app logic
├── css/
│   ├── main.css        — Copied from public/css/main.css
│   └── components.css  — Copied from public/css/components.css
└── js/
    └── alpine.min.js   — Copied from public/js/alpine.min.js
    └── lucide.min.js   — Copied from public/js/lucide.min.js
```

**Source structure (compiled by esbuild):**
```
client-src/
├── main.ts             — Entry point, initializes Alpine stores
├── store.ts            — localStorage data layer (CRUD operations)
├── router.ts           — Hash-based client-side routing
├── domains-bundle.ts   — Re-exports all domain configs from src/domains/
├── blueprints-bundle.ts — Re-exports blueprints + pairs from src/blueprints/
└── uuid.ts             — Lightweight UUID using crypto.randomUUID()
```

**Key insight:** Domain configs, blueprints, and pairs data are imported directly from the existing `src/domains/` and `src/blueprints/` files. No duplication needed.

### Iteration 6 — Template Conversion Strategy
The existing app has 23 page templates. Convert the core ones to Alpine.js components inside `index.html`.

**Conversion pattern:** Each Nunjucks template becomes a `<template x-if="route === 'page-name'">` block.

**Pages to convert (14):**
1. Home (world list with constellation groups)
2. World create (quick form)
3. World dashboard (domain grid + blueprint suggestions)
4. Constellation create
5. Constellation detail
6. Blueprint list
7. Blueprint detail
8. Archetype search
9. Domain element list
10. Element create/edit form
11. Element detail
12. Onboarding wizard
13. Timeline (data CRUD, no visualization)
14. Error/404

**Shared components:**
- Top navigation bar
- Sidebar (world domains)
- Tag list
- Relationship list

### Iteration 7 — Import/Export JSON Format
```typescript
// Constellation export
{
  version: 2,
  type: 'constellation',
  exported_at: string,
  constellation: Constellation,
  worlds: Array<{
    world: World,
    elements: WorldElement[],
    relationships: Relationship[],
    tags: Tag[],
    element_tags: Array<{ element_id: string, tag_id: string }>,
    eras: Era[],
  }>
}

// Single world export
{
  version: 2,
  type: 'world',
  exported_at: string,
  world: World,
  elements: WorldElement[],
  relationships: Relationship[],
  tags: Tag[],
  element_tags: Array<{ element_id: string, tag_id: string }>,
  eras: Era[],
}
```

**Import behavior:**
- Upload a JSON file via `<input type="file">`
- Parse and validate the JSON structure
- If type === 'constellation': create constellation + all worlds
- If type === 'world': create world (optionally into an existing constellation)
- Generate new UUIDs for all imported entities to avoid collisions
- Preserve internal references (remap old IDs to new IDs)

### Iteration 8 — Data Store API Design
The client-side store must mirror every service method. Organized by entity:

```typescript
// store.ts API
class Store {
  // Worlds
  listWorlds(): World[]
  getWorld(id: string): World | undefined
  createWorld(data: Partial<World>): World
  updateWorld(id: string, data: Partial<World>): World
  deleteWorld(id: string): void
  getWorldStats(worldId: string): Record<string, number>

  // Constellations
  listConstellations(): Constellation[]
  getConstellation(id: string): Constellation | undefined
  createConstellation(data: Partial<Constellation>): Constellation
  updateConstellation(id: string, data: Partial<Constellation>): Constellation
  deleteConstellation(id: string): void
  getConstellationWorlds(constellationId: string): World[]
  getUnlinkedWorlds(): World[]

  // Elements (per-world)
  listElements(worldId: string, domain?: string, type?: string): WorldElement[]
  getElement(worldId: string, elementId: string): WorldElement | undefined
  createElement(worldId: string, data: Partial<WorldElement>): WorldElement
  updateElement(worldId: string, elementId: string, data: Partial<WorldElement>): WorldElement
  deleteElement(worldId: string, elementId: string): void

  // Relationships
  listRelationships(worldId: string, elementId?: string): Relationship[]
  createRelationship(worldId: string, data: Partial<Relationship>): Relationship
  deleteRelationship(worldId: string, relId: string): void

  // Tags
  listTags(worldId: string): Tag[]
  listElementTags(worldId: string, elementId: string): Tag[]
  createTag(worldId: string, name: string, color?: string): Tag
  deleteTag(worldId: string, tagId: string): void
  addTagToElement(worldId: string, elementId: string, tagId: string): void
  removeTagFromElement(worldId: string, elementId: string, tagId: string): void

  // Eras
  listEras(worldId: string): Era[]
  createEra(worldId: string, data: Partial<Era>): Era
  updateEra(worldId: string, eraId: string, data: Partial<Era>): Era
  deleteEra(worldId: string, eraId: string): void

  // Search
  search(worldId: string, query: string, domain?: string): SearchResult[]

  // Import/Export
  exportConstellation(constellationId: string): object
  exportWorld(worldId: string): object
  importData(json: object): { constellationId?: string, worldIds: string[] }
}
```

### Iteration 9 — Error Prevention Checklist
Things that could go wrong and how to prevent them:

1. **localStorage full** → Check `navigator.storage.estimate()` before writes, show warning at 80% usage
2. **ID collisions on import** → Always remap all IDs using a oldId→newId map
3. **Broken references after element delete** → Clean up relationships and tags in deleteElement()
4. **Missing domain config at runtime** → Bundle ALL domain configs, never lazy-load them
5. **Alpine.js reactive gotchas** → Use `$store` for global state, `x-data` for local
6. **Browser back/forward** → Use `hashchange` event for routing, not `popstate`
7. **Large world slowing down UI** → Paginate element lists client-side (show 50 at a time)
8. **Lost work** → Auto-persist to localStorage on every mutation (synchronous writes are fine for localStorage)
9. **Cross-tab conflicts** → Use `storage` event listener to detect external changes
10. **Build errors** → Use the same TypeScript configs and esbuild setup already in the project
11. **CSS conflicts** → Copy CSS files directly, don't modify them
12. **Archetype field mismatch** → Element `properties` stores all extension fields as a JSON object (no separate tables needed)
13. **Export format incompatibility** → Version field allows future format changes
14. **Empty state rendering** → Every list view must handle 0 items gracefully

### Iteration 10 — Final Execution Plan

---

## Execution Plan (22 steps)

### Phase 1: Foundation (Steps 1-4)

#### Step 1 — Build infrastructure
Create `client-src/` directory and esbuild config.
- Create `client-src/main.ts` — entry point
- Create `client-src/uuid.ts` — `crypto.randomUUID()` wrapper
- Create `scripts/build-client.ts` — esbuild script that:
  - Bundles `client-src/main.ts` → `client/app.js`
  - Copies CSS files to `client/css/`
  - Copies Alpine.js and Lucide to `client/js/`
- Add `build:client-app` script to package.json
- Test: the build produces `client/app.js`

#### Step 2 — Data store
Create `client-src/store.ts` — the localStorage data layer.
- Implement all CRUD methods from the API design above
- localStorage key scheme: `fe:worlds`, `fe:constellations`, `fe:world:{id}:elements`, etc.
- Each write immediately persists to localStorage
- Each read deserializes from localStorage (with caching)
- UUID generation for all new entities
- Timestamp handling (created_at, updated_at as ISO strings)
- Test: create/read/update/delete worlds and elements from browser console

#### Step 3 — Domain and blueprint bundles
Create `client-src/domains-bundle.ts` and `client-src/blueprints-bundle.ts`.
- `domains-bundle.ts` imports and re-exports ALL_DOMAINS, DOMAIN_MAP, DOMAIN_CATEGORIES, getDomainConfig from `../src/domains/index.ts`
- `blueprints-bundle.ts` imports and re-exports ALL_BLUEPRINTS, getBlueprint, BLUEPRINT_TAGS from `../src/blueprints/index.ts` and getPairs from `../src/blueprints/pairs.ts`
- esbuild resolves these imports and bundles everything into the single `app.js`
- Test: domain configs and blueprints are accessible in the browser

#### Step 4 — Router
Create `client-src/router.ts` — hash-based client-side routing.
- Routes defined as patterns: `#/`, `#/worlds/new`, `#/worlds/:worldId`, `#/worlds/:worldId/:domainId`, etc.
- `hashchange` event listener updates Alpine.js `$store.route`
- Route params extracted and made available to templates
- Helper: `navigate(path)` function that sets `location.hash`
- Test: navigating to `#/worlds` shows the right page

### Phase 2: HTML Shell & Core Pages (Steps 5-10)

#### Step 5 — HTML shell with layout
Create `client/index.html` — the SPA shell.
- HTML5 structure matching `layouts/base.njk`
- Top navigation bar with links (using `@click` and `navigate()`)
- Conditional sidebar (shown when viewing a world)
- Main content area with Alpine.js template switching
- Include CSS files, Alpine.js, Lucide, and the bundled `app.js`
- Alpine.js `$store` initialization for route, currentWorld, etc.
- Test: shell renders with navigation

#### Step 6 — Home page + World CRUD
Implement the home page (world list with constellation groups).
- List all worlds grouped by constellation
- "Create World" button → inline form or navigate to create page
- World cards with name, tagline, magic badge, blueprint badge
- Quick-create form with name, tagline, description, magic toggle, blueprint selector, constellation selector
- Delete world (with confirmation)
- Test: create a world, see it listed, delete it

#### Step 7 — Constellation CRUD
Implement constellation pages.
- Create constellation form (name, description, color)
- Constellation detail: list linked worlds, add/remove worlds, edit settings
- Delete constellation
- Show empty constellations on home page
- Test: create constellation, add worlds, remove them

#### Step 8 — World dashboard
Implement the world dashboard page.
- Domain grid showing all domains with element counts
- Blueprint suggestions panel (if world has blueprint)
- Settings panel (edit name/tagline/description/magic)
- Archetype count badges on domain cards
- Constellation link
- Test: navigate to world, see domains, click through

#### Step 9 — Blueprint browsing
Implement blueprint list and detail pages.
- Blueprint grid with tag filtering
- Blueprint detail with suggestions grouped by priority (essential/recommended/optional)
- "Use This Blueprint" → navigate to world creation with blueprint pre-selected
- "Use in World" dropdown on suggestion cards
- Test: browse blueprints, filter by tag, view details

#### Step 10 — Archetype search
Implement the archetype search/browse page.
- List all 234 archetypes with search and category/domain filtering
- "Use in World" dropdown on each card
- Test: search archetypes, filter by domain, use in a world

### Phase 3: Element Management (Steps 11-15)

#### Step 11 — Domain element list
Implement the domain element list page.
- List elements for a domain with type filtering
- Sort by name/type/date
- Pagination (50 per page)
- "Surprise Me" random archetype button
- Empty state with archetype quick-start cards
- Test: navigate to a domain, see elements (or empty state)

#### Step 12 — Element creation form
Implement the element creation/edit form.
- Archetype picker (clickable cards above form)
- Dynamic field rendering based on domain config:
  - text, textarea, number, select, multiselect, json, boolean, range
- Element type selector with descriptions
- "Pairs Well With" suggestions when archetype selected
- Magic permeation fields (if world has magic and domain has magicPermeation)
- Pre-fill from archetype when selected
- Save creates/updates element in store
- Test: create element from scratch, create from archetype, edit existing

#### Step 13 — Element detail page
Implement the element detail view.
- Display all fields with labels
- Relationships list with add/remove
- Tags list with add/remove
- Edit and Delete buttons
- Domain-colored header
- Test: view element, see all data, manage relationships and tags

#### Step 14 — Relationships
Implement relationship management.
- Create relationship from element detail page
- Element search dropdown (filter elements by name)
- Relationship type selector
- Bidirectional toggle
- Delete relationship
- Test: create relationship between two elements, delete it

#### Step 15 — Tags
Implement tag management.
- Create tags for a world
- Add/remove tags from elements
- Tag list on element detail
- Color picker for tags
- Test: create tag, add to element, remove from element

### Phase 4: Import/Export & Polish (Steps 16-20)

#### Step 16 — JSON export
Implement download buttons.
- "Download World" button on world dashboard → downloads world JSON
- "Download Constellation" button on constellation detail → downloads constellation JSON with all worlds
- File named `{name}-{date}.json`
- Format matches the v2 schema from the plan
- Test: export a world, open the JSON, verify completeness

#### Step 17 — JSON import
Implement upload functionality.
- "Import" button on home page
- File input accepting `.json`
- Parse and validate JSON structure
- Remap all UUIDs to avoid collisions
- Preserve internal references (relationships, tags, element_tags)
- If constellation: create constellation + all worlds
- If world: create world (user picks constellation or standalone)
- Show import summary (X worlds, Y elements imported)
- Test: export a constellation, delete it, import it back, verify data intact

#### Step 18 — Search
Implement client-side search.
- Search box in top bar (when viewing a world)
- Filter elements by name, summary, detailed_notes
- Show results as clickable list with domain badges
- Keyboard shortcut (Ctrl+K or /) to focus search
- Test: search for an element, click result, navigate to it

#### Step 19 — Eras/Timeline data
Implement era and calendar CRUD (no visualization).
- List eras for a world
- Create/edit/delete eras
- Calendar CRUD (simpler: just name and metadata)
- Test: create eras, edit them, delete them

#### Step 20 — Onboarding wizard
Implement the 7-step onboarding wizard.
- Step 1: Name
- Step 2: Tagline & Description
- Step 3: Blueprint selection (grid of 20 blueprints)
- Step 4: Magic toggle
- Step 5: Magic level (if enabled)
- Step 6: Starting domain
- Step 7: Review & Create
- Uses Alpine.js step state (same as existing onboarding.njk pattern)
- Test: complete full wizard, verify world created with correct settings

### Phase 5: Final (Steps 21-22)

#### Step 21 — Polish and edge cases
- localStorage usage indicator (show % used)
- Dirty form detection (warn before navigating away)
- Ctrl+S to save forms
- Responsive design verification
- Empty states for all list views
- Error handling for corrupt localStorage data
- "Clear All Data" option in settings
- Lucide icon initialization after template updates

#### Step 22 — Build, test, and deploy preparation
- Final esbuild optimization (minification, tree-shaking)
- Test complete user flow end-to-end
- Create a simple README for the client version
- Verify deployment works on GitHub Pages (just push `client/` directory)
- Test: open `client/index.html` directly in browser (file:// protocol)
- Test: serve from static host

---

## Key Technical Decisions

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Framework | Alpine.js | Already in project, lightweight, good for template-heavy UIs |
| Routing | Hash-based (#/path) | Works on file://, no server needed, simple |
| Data store | localStorage (partitioned by world) | No setup, persistent, synchronous, ~5-10MB per origin |
| UUID generation | crypto.randomUUID() | Built into modern browsers, no dependency |
| Build tool | esbuild | Already in project, fast, handles TS |
| Domain configs | Direct import from src/domains/ | No duplication, single source of truth |
| Element storage | properties JSON field | No need for per-domain extension tables — just store all fields in one JSON object |
| CSS | Direct copy from public/css/ | No modifications needed |
| Icons | Lucide (same as server version) | Visual consistency |

## Data Storage Simplification

The server version uses SQLite with separate extension tables per domain (e.g., `celestial_bodies`, `geological_features`). The client version simplifies this:

- All domain-specific fields stored in `element.properties` as a JSON string
- No separate extension tables needed
- Magic permeation fields also stored in properties (keyed with `magic_` prefix)
- This is functionally identical but far simpler to implement in localStorage

## What's NOT Included (and why)

| Feature | Reason for exclusion |
|---------|---------------------|
| Map editor | Requires image upload and SVG manipulation — complex, deferred |
| D3 graph visualization | Large dependency, complex — deferred |
| D3 timeline visualization | Large dependency — deferred |
| Magic system sub-tables | 9 custom forms with unique schemas — complex, deferred |
| Full-text search ranking | No FTS5 equivalent client-side — use simple text matching |
| Validation service | Simpler to do ad-hoc client-side — deferred |
| Image upload on elements | No filesystem — deferred |
| CSRF protection | No server, no cross-origin risk |
| Export as Markdown | JSON export covers the use case — can add later |
