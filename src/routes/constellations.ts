import { Router } from 'express';
import { ConstellationService } from '../services/ConstellationService.js';
import { WorldService } from '../services/WorldService.js';

const router = Router();
const constellationService = new ConstellationService();
const worldService = new WorldService();

// New constellation form
router.get('/new', (req, res) => {
  res.render('pages/constellation-new.njk');
});

// Create constellation
router.post('/', (req, res) => {
  const { name, description, color } = req.body;
  if (!name || !name.trim()) {
    res.status(400).render('pages/constellation-new.njk', { error: 'Name is required' });
    return;
  }
  const constellation = constellationService.create({
    name: name.trim(),
    description: description || '',
    color: color || '#6366f1',
  });
  res.redirect(`/constellations/${constellation.id}`);
});

// Constellation detail
router.get('/:constellationId', (req, res) => {
  const constellation = constellationService.get(req.params.constellationId);
  if (!constellation) {
    res.status(404).render('pages/error.njk', { status: 404, message: 'Constellation not found' });
    return;
  }
  const worlds = constellationService.getWorlds(constellation.id);
  const unlinkedWorlds = constellationService.getUnlinkedWorlds();
  res.render('pages/constellation-detail.njk', { constellation, worlds, unlinkedWorlds });
});

// Update constellation settings
router.post('/:constellationId/settings', (req, res) => {
  const { name, description, color } = req.body;
  if (!name || !name.trim()) {
    res.status(400).send('Name is required');
    return;
  }
  constellationService.update(req.params.constellationId, { name, description, color });

  if (req.headers['hx-request']) {
    res.set('HX-Refresh', 'true');
    res.send('');
  } else {
    res.redirect(`/constellations/${req.params.constellationId}`);
  }
});

// Add world to constellation
router.post('/:constellationId/worlds', (req, res) => {
  const { world_id } = req.body;
  if (!world_id) {
    res.status(400).send('World ID is required');
    return;
  }
  constellationService.addWorld(req.params.constellationId, world_id);

  if (req.headers['hx-request']) {
    res.set('HX-Refresh', 'true');
    res.send('');
  } else {
    res.redirect(`/constellations/${req.params.constellationId}`);
  }
});

// Remove world from constellation
router.post('/:constellationId/worlds/:worldId/remove', (req, res) => {
  constellationService.removeWorld(req.params.worldId);

  if (req.headers['hx-request']) {
    res.set('HX-Refresh', 'true');
    res.send('');
  } else {
    res.redirect(`/constellations/${req.params.constellationId}`);
  }
});

// Delete constellation
router.post('/:constellationId/delete', (req, res) => {
  constellationService.delete(req.params.constellationId);
  res.redirect('/worlds');
});

export default router;
