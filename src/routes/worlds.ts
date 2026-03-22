import { Router } from 'express';
import { WorldService } from '../services/WorldService.js';
import { ConstellationService } from '../services/ConstellationService.js';
import { BlueprintService } from '../services/BlueprintService.js';
import { ALL_DOMAINS, DOMAIN_CATEGORIES } from '../domains/index.js';

const router = Router();
const worldService = new WorldService();
const constellationService = new ConstellationService();
const blueprintService = new BlueprintService();

// List all worlds
router.get('/', (req, res) => {
  const worlds = worldService.list();
  const constellations = constellationService.list();
  const unlinkedWorlds = constellationService.getUnlinkedWorlds();

  // Build constellation groups with their worlds
  const constellationGroups = constellations.map(c => ({
    ...c,
    worlds: constellationService.getWorlds(c.id),
  }));

  res.render('pages/home.njk', { worlds, constellations: constellationGroups, unlinkedWorlds });
});

// Onboarding wizard
router.get('/new/wizard', (req, res) => {
  const blueprints = blueprintService.list();
  res.render('pages/onboarding.njk', { blueprints });
});

// New world form
router.get('/new', (req, res) => {
  const constellations = constellationService.list();
  const blueprints = blueprintService.list();
  const preselectedBlueprint = req.query.blueprint as string || '';
  res.render('pages/world-new.njk', {
    constellations,
    blueprints,
    preselectedConstellation: req.query.constellation || '',
    preselectedBlueprint,
  });
});

// Create world
router.post('/', (req, res) => {
  const { name, tagline, description, magic_enabled, constellation_id, blueprint_id } = req.body;
  if (!name || !name.trim()) {
    const constellations = constellationService.list();
    const blueprints = blueprintService.list();
    res.status(400).render('pages/world-new.njk', { error: 'Name is required', constellations, blueprints });
    return;
  }
  const world = worldService.create({
    name: name.trim(),
    tagline: tagline || '',
    description: description || '',
    magic_enabled: magic_enabled === 'on' || magic_enabled === 'true',
  });

  // Link to constellation if specified
  if (constellation_id) {
    constellationService.addWorld(constellation_id, world.id);
  }

  // Store blueprint if specified
  if (blueprint_id) {
    worldService.update(world.id, { settings: JSON.stringify({ blueprint_id }) });
  }

  const startDomain = req.body.start_domain;
  if (startDomain && startDomain !== 'cosmology') {
    res.redirect(`/worlds/${world.id}/${startDomain}`);
  } else {
    res.redirect(`/worlds/${world.id}`);
  }
});

// World dashboard
router.get('/:worldId', (req, res) => {
  const world = res.locals.world || worldService.get(req.params.worldId);
  if (!world) { res.status(404).render('pages/error.njk', { status: 404, message: 'World not found' }); return; }
  const stats = worldService.getStats(world.id);
  const constellation = world.constellation_id ? constellationService.get(world.constellation_id) : null;

  // Load blueprint if world has one
  let blueprint = null;
  let blueprintSuggestions: any[] = [];
  try {
    const settings = JSON.parse(world.settings || '{}');
    if (settings.blueprint_id) {
      const resolved = blueprintService.getResolved(settings.blueprint_id);
      if (resolved) {
        blueprint = resolved;
        blueprintSuggestions = resolved.resolvedSuggestions;
      }
    }
  } catch {}

  res.render('pages/world-dashboard.njk', {
    world, stats, domains: ALL_DOMAINS,
    magicEnabled: !!world.magic_enabled,
    domainCategories: res.locals.domainCategories || DOMAIN_CATEGORIES,
    constellation,
    blueprint,
    blueprintSuggestions,
  });
});

// Edit world settings
router.post('/:worldId/settings', (req, res) => {
  const { name, tagline, description, magic_enabled } = req.body;
  if (!name || !name.trim()) {
    res.status(400).send('Name is required');
    return;
  }
  worldService.update(req.params.worldId, {
    name, tagline, description,
    magic_enabled: magic_enabled === 'on' || magic_enabled === 'true',
  });

  if (req.headers['hx-request']) {
    res.set('HX-Refresh', 'true');
    res.send('');
  } else {
    res.redirect(`/worlds/${req.params.worldId}`);
  }
});

// Delete world
router.post('/:worldId/delete', (req, res) => {
  worldService.delete(req.params.worldId);
  res.redirect('/');
});

export default router;
