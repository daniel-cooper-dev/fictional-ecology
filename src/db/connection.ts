import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from '../config.js';
import { runMigrations } from './migrate.js';

// WAL mode requires shared memory, which doesn't work on NTFS mounts in WSL
const isNtfsMount = config.dataDir.startsWith('/mnt/');
const journalMode = isNtfsMount ? 'DELETE' : 'WAL';

const dbInstances = new Map<string, Database.Database>();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertValidWorldId(worldId: string): void {
  if (!UUID_RE.test(worldId)) {
    throw new Error(`Invalid world ID: ${worldId}`);
  }
}

export function getWorldDbPath(worldId: string): string {
  assertValidWorldId(worldId);
  const worldDir = path.join(config.dataDir, worldId);
  if (!fs.existsSync(worldDir)) {
    fs.mkdirSync(worldDir, { recursive: true });
  }
  return path.join(worldDir, 'world.db');
}

export function getWorldDb(worldId: string): Database.Database {
  if (dbInstances.has(worldId)) {
    return dbInstances.get(worldId)!;
  }
  const dbPath = getWorldDbPath(worldId);
  const db = new Database(dbPath);
  db.pragma(`journal_mode = ${journalMode}`);
  db.pragma('foreign_keys = ON');
  runMigrations(db);
  dbInstances.set(worldId, db);
  return db;
}

export function closeWorldDb(worldId: string): void {
  const db = dbInstances.get(worldId);
  if (db) {
    db.close();
    dbInstances.delete(worldId);
  }
}

export function closeAllDbs(): void {
  for (const [id, db] of dbInstances) {
    db.close();
  }
  dbInstances.clear();
}

// Master DB for world list (lives in data dir root)
let masterDb: Database.Database | null = null;

export function getMasterDb(): Database.Database {
  if (masterDb) return masterDb;
  if (!fs.existsSync(config.dataDir)) {
    fs.mkdirSync(config.dataDir, { recursive: true });
  }
  const dbPath = path.join(config.dataDir, 'master.db');
  masterDb = new Database(dbPath);
  masterDb.pragma(`journal_mode = ${journalMode}`);
  masterDb.pragma('foreign_keys = ON');

  masterDb.exec(`
    CREATE TABLE IF NOT EXISTS constellations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      color TEXT DEFAULT '#6366f1',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  masterDb.exec(`
    CREATE TABLE IF NOT EXISTS worlds (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tagline TEXT DEFAULT '',
      description TEXT DEFAULT '',
      magic_enabled INTEGER DEFAULT 1,
      settings TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      forked_from TEXT,
      constellation_id TEXT REFERENCES constellations(id) ON DELETE SET NULL,
      blueprint_id TEXT
    )
  `);

  // Migration: add columns to existing worlds table if missing
  const worldCols = masterDb.prepare("PRAGMA table_info(worlds)").all() as { name: string }[];
  if (!worldCols.some(c => c.name === 'constellation_id')) {
    masterDb.exec(`ALTER TABLE worlds ADD COLUMN constellation_id TEXT REFERENCES constellations(id) ON DELETE SET NULL`);
  }
  if (!worldCols.some(c => c.name === 'blueprint_id')) {
    masterDb.exec(`ALTER TABLE worlds ADD COLUMN blueprint_id TEXT`);
  }

  return masterDb;
}

export function closeMasterDb(): void {
  if (masterDb) {
    masterDb.close();
    masterDb = null;
  }
}
