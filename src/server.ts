import express from 'express';
import nunjucks from 'nunjucks';
import path from 'path';
import { config } from './config.js';
import { worldContext } from './middleware/worldContext.js';
import { errorHandler } from './middleware/errorHandler.js';
import worldsRouter from './routes/worlds.js';
import constellationsRouter from './routes/constellations.js';
import blueprintsRouter from './routes/blueprints.js';
import archetypesRouter from './routes/archetypes.js';
import domainsRouter from './routes/domains.js';
import magicRouter from './routes/magic.js';
import relationshipsRouter from './routes/relationships.js';
import searchRouter from './routes/search.js';
import tagsRouter from './routes/tags.js';
import exportRouter from './routes/export.js';
import timelineRouter from './routes/timeline.js';
import mapsRouter from './routes/maps.js';
import validationRouter from './routes/validation.js';
import { ALL_DOMAINS, DOMAIN_CATEGORIES } from './domains/index.js';
import { getMasterDb, closeAllDbs, closeMasterDb } from './db/connection.js';

const app = express();

// Template engine
const env = nunjucks.configure(config.templateDir, {
  autoescape: true,
  express: app,
  noCache: process.env.NODE_ENV !== 'production',
});

// Custom filters
env.addFilter('json_pretty', (val: any) => {
  try {
    const parsed = typeof val === 'string' ? JSON.parse(val) : val;
    return JSON.stringify(parsed, null, 2);
  } catch { return val; }
});

env.addFilter('parse_json', (val: any) => {
  try { return typeof val === 'string' ? JSON.parse(val) : val; }
  catch { return val; }
});

env.addFilter('domain_color', (domainId: string) => {
  const d = ALL_DOMAINS.find(d => d.id === domainId);
  return d ? d.color : '#999';
});

env.addFilter('domain_icon', (domainId: string) => {
  const d = ALL_DOMAINS.find(d => d.id === domainId);
  return d ? d.icon : 'circle';
});

env.addFilter('domain_name', (domainId: string) => {
  const d = ALL_DOMAINS.find(d => d.id === domainId);
  return d ? d.name : domainId;
});

env.addFilter('random_item', (arr: any[]) => {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
});

env.addFilter('truncate', (str: string, len: number) => {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
});

env.addFilter('relative_time', (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr + (dateStr.includes('Z') ? '' : 'Z'));
  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
});

// Global template vars
env.addGlobal('allDomains', ALL_DOMAINS);
env.addGlobal('domainCategories', DOMAIN_CATEGORIES);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(config.publicDir));

// CSRF protection: reject cross-origin mutations
app.use((req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }
  const origin = req.get('origin');
  if (origin) {
    const allowed = `http://${config.host}:${config.port}`;
    const allowedLocalhost = `http://localhost:${config.port}`;
    if (origin !== allowed && origin !== allowedLocalhost) {
      res.status(403).send('Forbidden: cross-origin request');
      return;
    }
  }
  next();
});

// Initialize master database
getMasterDb();

// Routes
app.get('/', (req, res) => res.redirect('/worlds'));
app.use('/constellations', constellationsRouter);
app.use('/blueprints', blueprintsRouter);
app.use('/archetypes', archetypesRouter);
app.use('/worlds', worldsRouter);

// All world-scoped routes go through worldContext
app.use('/worlds/:worldId', worldContext);
app.use('/worlds', magicRouter);
app.use('/worlds', relationshipsRouter);
app.use('/worlds', searchRouter);
app.use('/worlds', tagsRouter);
app.use('/worlds', exportRouter);
app.use('/worlds', timelineRouter);
app.use('/worlds', mapsRouter);
app.use('/worlds', validationRouter);
// Domain routes must come last (catch-all /:worldId/:domainId pattern)
app.use('/worlds', domainsRouter);

// Error handling
app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`\n  Fictional Ecology World-Builder`);
  console.log(`  Running at http://${config.host}:${config.port}\n`);
});

function shutdown() {
  console.log('\nShutting down...');
  server.close(() => {
    closeAllDbs();
    closeMasterDb();
    process.exit(0);
  });
  // Force exit after 5s if server.close hangs
  setTimeout(() => process.exit(1), 5000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
