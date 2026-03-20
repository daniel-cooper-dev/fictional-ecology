import express from 'express';
import nunjucks from 'nunjucks';
import path from 'path';
import { config } from './config.js';
import { worldContext } from './middleware/worldContext.js';
import { errorHandler } from './middleware/errorHandler.js';
import worldsRouter from './routes/worlds.js';
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
import { getMasterDb } from './db/connection.js';

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

env.addFilter('truncate', (str: string, len: number) => {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
});

// Global template vars
env.addGlobal('allDomains', ALL_DOMAINS);
env.addGlobal('domainCategories', DOMAIN_CATEGORIES);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(config.publicDir));

// Initialize master database
getMasterDb();

// Routes
app.get('/', (req, res) => res.redirect('/worlds'));
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

app.listen(config.port, () => {
  console.log(`\n  Fictional Ecology World-Builder`);
  console.log(`  Running at http://${config.host}:${config.port}\n`);
});
