import express from 'express';
import nunjucks from 'nunjucks';
import { config } from '../src/config.js';
import { worldContext } from '../src/middleware/worldContext.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import worldsRouter from '../src/routes/worlds.js';
import domainsRouter from '../src/routes/domains.js';
import magicRouter from '../src/routes/magic.js';
import relationshipsRouter from '../src/routes/relationships.js';
import searchRouter from '../src/routes/search.js';
import tagsRouter from '../src/routes/tags.js';
import exportRouter from '../src/routes/export.js';
import timelineRouter from '../src/routes/timeline.js';
import mapsRouter from '../src/routes/maps.js';
import validationRouter from '../src/routes/validation.js';
import { ALL_DOMAINS, DOMAIN_CATEGORIES } from '../src/domains/index.js';
import { getMasterDb } from '../src/db/connection.js';
import { WorldService } from '../src/services/WorldService.js';
import { TagService } from '../src/services/TagService.js';
import { TimelineService } from '../src/services/TimelineService.js';
import { MapService } from '../src/services/MapService.js';
import { ValidationService } from '../src/services/ValidationService.js';

const app = express();
const env = nunjucks.configure(config.templateDir, { autoescape: true, express: app, noCache: true });
env.addFilter('json_pretty', (val: any) => { try { return JSON.stringify(typeof val === 'string' ? JSON.parse(val) : val, null, 2); } catch { return val; } });
env.addFilter('parse_json', (val: any) => { try { return typeof val === 'string' ? JSON.parse(val) : val; } catch { return val; } });
env.addFilter('domain_color', (id: string) => { const d = ALL_DOMAINS.find(d => d.id === id); return d ? d.color : '#999'; });
env.addFilter('domain_icon', (id: string) => { const d = ALL_DOMAINS.find(d => d.id === id); return d ? d.icon : 'circle'; });
env.addFilter('domain_name', (id: string) => { const d = ALL_DOMAINS.find(d => d.id === id); return d ? d.name : id; });
env.addFilter('truncate', (str: string, len: number) => { if (!str) return ''; return str.length > len ? str.substring(0, len) + '...' : str; });
env.addGlobal('allDomains', ALL_DOMAINS);
env.addGlobal('domainCategories', DOMAIN_CATEGORIES);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(config.publicDir));
getMasterDb();
app.get('/', (req, res) => res.redirect('/worlds'));
app.use('/worlds', worldsRouter);
app.use('/worlds/:worldId', worldContext);
app.use('/worlds', magicRouter);
app.use('/worlds', relationshipsRouter);
app.use('/worlds', searchRouter);
app.use('/worlds', tagsRouter);
app.use('/worlds', exportRouter);
app.use('/worlds', timelineRouter);
app.use('/worlds', mapsRouter);
app.use('/worlds', validationRouter);
app.use('/worlds', domainsRouter);
app.use(errorHandler);

const server = app.listen(0, async () => {
  const port = (server.address() as any).port;
  const base = 'http://127.0.0.1:' + port;

  function get(path: string) { return fetch(base + path); }
  function post(path: string, body: string) {
    return fetch(base + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      redirect: 'manual',
    });
  }

  let pass = 0;
  let fail = 0;
  function ok(label: string, cond: boolean) {
    if (cond) { pass++; console.log('  OK:', label); }
    else { fail++; console.log('  FAIL:', label); }
  }

  try {
    // 1. Create world
    const createRes = await post('/worlds', 'name=TestWorld&tagline=test&description=desc&magic_enabled=true');
    const worldId = createRes.headers.get('location')?.split('/worlds/')[1];
    ok('Create world', !!worldId);

    // 2. Onboarding page
    const wizardRes = await get('/worlds/new/wizard');
    ok('Onboarding wizard', wizardRes.status === 200);

    // 3. All domain pages
    console.log('\n  Testing domain pages...');
    for (const d of ALL_DOMAINS) {
      const url = d.id === 'magic_systems' ? '/worlds/' + worldId + '/magic' : '/worlds/' + worldId + '/' + d.id;
      const r = await get(url);
      ok(d.name + ' page', r.status === 200);
    }

    // 4. Create element
    const elRes = await post('/worlds/' + worldId + '/flora', 'name=TestPlant&summary=A+test+plant&element_type=tree');
    const elLoc = elRes.headers.get('location');
    const elementId = elLoc?.split('/').pop();
    ok('Create element', !!elementId);

    // 5. Tags
    console.log('\n  Testing tags...');
    const tagService = new TagService();
    const tag = tagService.create(worldId!, 'endangered', '#e74c3c');
    ok('Create tag', !!tag.id);
    tagService.addToElement(worldId!, elementId!, tag.id);
    const elTags = tagService.listForElement(worldId!, elementId!);
    ok('Tag on element', elTags.length === 1);
    tagService.removeFromElement(worldId!, elementId!, tag.id);
    const elTags2 = tagService.listForElement(worldId!, elementId!);
    ok('Remove tag from element', elTags2.length === 0);

    // 6. Timeline
    console.log('\n  Testing timeline...');
    const tlService = new TimelineService();
    const era = tlService.createEra(worldId!, { name: 'Age of Dawn', start_year: 0, end_year: 1000, color: '#4a9eff' });
    ok('Create era', !!era.id);
    const cal = tlService.createCalendar(worldId!, { name: 'Solar Calendar', days_per_year: 360, days_per_week: 6 });
    ok('Create calendar', !!cal.id);
    const tlPageRes = await get('/worlds/' + worldId + '/timeline');
    ok('Timeline page', tlPageRes.status === 200);
    const tlApiRes = await get('/worlds/' + worldId + '/api/timeline');
    const tlData = await tlApiRes.json();
    ok('Timeline API', tlData.eras.length === 1);

    // 7. Maps
    console.log('\n  Testing maps...');
    const mapService = new MapService();
    const map = mapService.createMap(worldId!, { name: 'World Map', width: 1000, height: 800, map_type: 'world' });
    ok('Create map', !!map.id);
    const pin = mapService.createPin(worldId!, map.id, { x: 0.5, y: 0.3, label: 'Capital City', color: '#ff0000' });
    ok('Create pin', !!pin.id);
    const mapsPageRes = await get('/worlds/' + worldId + '/maps');
    ok('Maps list page', mapsPageRes.status === 200);
    const mapEditorRes = await get('/worlds/' + worldId + '/maps/' + map.id);
    ok('Map editor page', mapEditorRes.status === 200);
    const mapApiRes = await get('/worlds/' + worldId + '/api/maps/' + map.id);
    const mapData = await mapApiRes.json();
    ok('Map API', mapData.pins.length === 1);

    // 8. Validation
    console.log('\n  Testing validation...');
    const valRes = await get('/worlds/' + worldId + '/validate');
    ok('Validation page', valRes.status === 200);
    const valService = new ValidationService();
    const issues = valService.validate(worldId!);
    ok('Validation runs', Array.isArray(issues));
    ok('Validation finds issues', issues.length > 0);

    // 9. Export
    console.log('\n  Testing export...');
    const jsonExportRes = await get('/worlds/' + worldId + '/export/json');
    ok('JSON export', jsonExportRes.status === 200);
    const jsonData = await jsonExportRes.json();
    ok('Export has elements', jsonData.elements.length > 0);
    ok('Export has world name', jsonData.world.name === 'TestWorld');

    const mdExportRes = await get('/worlds/' + worldId + '/export/markdown');
    ok('Markdown export', mdExportRes.status === 200);
    const mdText = await mdExportRes.text();
    ok('Markdown has content', mdText.includes('TestWorld'));

    // 10. Graph still works
    const graphRes = await get('/worlds/' + worldId + '/graph');
    ok('Graph page', graphRes.status === 200);
    const graphApiRes = await get('/worlds/' + worldId + '/api/graph');
    ok('Graph API', graphApiRes.status === 200);

    // 11. Search still works
    const searchRes = await get('/worlds/' + worldId + '/search?q=Test');
    ok('Search', searchRes.status === 200);

    // Summary
    console.log('\n===========================');
    console.log('Results: ' + pass + ' passed, ' + fail + ' failed');
    if (fail === 0) console.log('ALL TESTS PASSED');
    else console.log('SOME TESTS FAILED');
    console.log('===========================\n');

    // Cleanup
    new WorldService().delete(worldId!);
  } catch (err) {
    console.error('TEST ERROR:', err);
  }

  server.close();
});
