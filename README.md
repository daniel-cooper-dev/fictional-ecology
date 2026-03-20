# Fictional Ecology

A local web application for designing fictional worlds across 20 interconnected domains — ecology, magic systems, civilizations, and more.

Built for fiction writers, game designers, and worldbuilding enthusiasts. Runs entirely offline with no external services required.

## Features

- **20 World-Building Domains** across Natural World (cosmology, geology, biomes, flora, fauna...), Sentient World (species, civilizations, cultures), Magic & Technology (magic systems, planar systems, magitech, magic ecology/economy), and Meta (history, geography, custom)
- **Deep Magic Framework** — optional per-world magic with 9 sub-systems: sources, energy types, laws, taxonomies, materials, spells, phenomena, costs, and power scaling
- **Magic Permeation** — any domain can gain collapsible magical aspects via companion tables
- **Cross-Domain Relationships** with impact tracking
- **D3 Visualizations** — force-directed relationship graphs, timelines, SVG map editor
- **Full-Text Search** via SQLite FTS5
- **Per-World Database Isolation** — each world gets its own SQLite database
- **Dark Theme** by default

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js + TypeScript (via `tsx`) |
| Server | Express 5 + Nunjucks templates |
| Database | SQLite via `better-sqlite3` |
| Frontend | HTMX + Alpine.js + D3.js |
| Bundling | esbuild (for TS frontends only) |
| Testing | Vitest |

## Getting Started

```bash
# Install dependencies
npm install

# Start in development mode (with hot reload)
npm run dev

# Or start in production mode
npm start
```

Open **http://localhost:3000** in your browser. Migrations run automatically on startup.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm start` | Run the server |
| `npm run dev` | Run with hot reload (`tsx watch`) |
| `npm run build:client` | Bundle frontend TypeScript to `public/dist/` |
| `npm test` | Run tests with Vitest |
| `npm run typecheck` | Type-check without emitting |
| `npm run migrate` | Manually run database migrations |

## Configuration

All optional environment variables:

```bash
PORT=3000          # default: 3000
HOST=localhost     # default: localhost
NODE_ENV=production  # caches templates in production
```

## Project Structure

```
src/
  server.ts              # Express entry point
  config.ts              # App configuration
  db/                    # Database connection, migrations (11 SQL files)
  services/              # Business logic (WorldService, DomainService, etc.)
  domains/               # 20 domain config files
  routes/                # Express route handlers
  middleware/             # Error handling, world context
  types/                 # TypeScript interfaces
templates/               # Nunjucks templates (layouts, pages, partials)
public/                  # CSS, JS libs, TypeScript sources for D3 visualizations
tests/                   # Vitest test suites
data/worlds/             # Per-world SQLite databases (gitignored)
```

## Architecture

- **DomainService\<T\>** — generic CRUD service driven by domain config objects (fields, validation, UI prompts, relationships)
- **MagicSystemService** — facade over 9 magic sub-table services
- **Magic Permeation Mixin** — adds optional `_magic_aspects` companion tables to any domain
- **Per-World Databases** — one SQLite file per world for complete isolation (~95 tables per world)

## License

ISC
