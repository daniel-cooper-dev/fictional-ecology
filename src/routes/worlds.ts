import { Router } from 'express';
import { WorldService } from '../services/WorldService.js';
import { ALL_DOMAINS, DOMAIN_CATEGORIES } from '../domains/index.js';

const router = Router();
const worldService = new WorldService();

// List all worlds
router.get('/', (req, res) => {
  const worlds = worldService.list();
  res.render('pages/home.njk', { worlds });
});

// Onboarding wizard
router.get('/new/wizard', (req, res) => {
  res.render('pages/onboarding.njk');
});

// New world form
router.get('/new', (req, res) => {
  res.render('pages/world-new.njk');
});

// Create world
router.post('/', (req, res) => {
  const { name, tagline, description, magic_enabled } = req.body;
  if (!name || !name.trim()) {
    res.status(400).render('pages/world-new.njk', { error: 'Name is required' });
    return;
  }
  const world = worldService.create({
    name: name.trim(),
    tagline: tagline || '',
    description: description || '',
    magic_enabled: magic_enabled === 'on' || magic_enabled === 'true',
  });
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
  res.render('pages/world-dashboard.njk', {
    world, stats, domains: ALL_DOMAINS,
    magicEnabled: !!world.magic_enabled,
    domainCategories: res.locals.domainCategories || DOMAIN_CATEGORIES,
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
