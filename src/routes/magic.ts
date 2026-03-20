import { Router } from 'express';
import { MagicSystemService } from '../services/MagicSystemService.js';

const router = Router();
const magicService = new MagicSystemService();

// Magic system dashboard for a world
router.get('/:worldId/magic', (req, res) => {
  const worldId = req.params.worldId;
  const overview = magicService.getOverview(worldId);
  const subTables = MagicSystemService.getSubTableList();

  res.render('pages/magic-dashboard.njk', {
    overview,
    subTables: subTables.map(t => ({
      id: t,
      label: MagicSystemService.getSubTableLabel(t),
      count: overview[t as keyof typeof overview] || 0,
    })),
  });
});

// List sub-entities
router.get('/:worldId/magic/:subTable', (req, res) => {
  const { worldId, subTable } = req.params;
  const validTables = MagicSystemService.getSubTableList();
  if (!validTables.includes(subTable)) {
    res.status(404).send('Invalid magic sub-table');
    return;
  }

  const items = magicService.listSubEntities(worldId, subTable as any);
  res.render('pages/magic-subtable-list.njk', {
    subTable,
    subTableLabel: MagicSystemService.getSubTableLabel(subTable),
    items,
  });
});

// New sub-entity form
router.get('/:worldId/magic/:subTable/new', (req, res) => {
  const { worldId, subTable } = req.params;
  res.render('pages/magic-subtable-form.njk', {
    subTable,
    subTableLabel: MagicSystemService.getSubTableLabel(subTable),
    item: null,
    isNew: true,
  });
});

// Create sub-entity
router.post('/:worldId/magic/:subTable', (req, res) => {
  const { worldId, subTable } = req.params;
  const validTables = MagicSystemService.getSubTableList();
  if (!validTables.includes(subTable)) {
    res.status(404).render('pages/error.njk', { status: 404, message: 'Invalid magic sub-table' });
    return;
  }
  const item = magicService.createSubEntity(worldId, subTable as any, req.body);

  if (req.headers['hx-request']) {
    res.set('HX-Redirect', `/worlds/${worldId}/magic/${subTable}/${item.id}`);
    res.send('');
  } else {
    res.redirect(`/worlds/${worldId}/magic/${subTable}/${item.id}`);
  }
});

// View sub-entity
router.get('/:worldId/magic/:subTable/:itemId', (req, res) => {
  const { worldId, subTable, itemId } = req.params;
  const item = magicService.getSubEntity(worldId, subTable as any, itemId);
  if (!item) { res.status(404).send('Not found'); return; }

  res.render('pages/magic-subtable-detail.njk', {
    subTable,
    subTableLabel: MagicSystemService.getSubTableLabel(subTable),
    item,
  });
});

// Edit sub-entity form
router.get('/:worldId/magic/:subTable/:itemId/edit', (req, res) => {
  const { worldId, subTable, itemId } = req.params;
  const item = magicService.getSubEntity(worldId, subTable as any, itemId);
  if (!item) { res.status(404).send('Not found'); return; }

  res.render('pages/magic-subtable-form.njk', {
    subTable,
    subTableLabel: MagicSystemService.getSubTableLabel(subTable),
    item,
    isNew: false,
  });
});

// Update sub-entity
router.post('/:worldId/magic/:subTable/:itemId', (req, res) => {
  const { worldId, subTable, itemId } = req.params;
  const validTables = MagicSystemService.getSubTableList();
  if (!validTables.includes(subTable)) {
    res.status(404).render('pages/error.njk', { status: 404, message: 'Invalid magic sub-table' });
    return;
  }
  magicService.updateSubEntity(worldId, subTable as any, itemId, req.body);

  if (req.headers['hx-request']) {
    res.set('HX-Redirect', `/worlds/${worldId}/magic/${subTable}/${itemId}`);
    res.send('');
  } else {
    res.redirect(`/worlds/${worldId}/magic/${subTable}/${itemId}`);
  }
});

// Delete sub-entity
router.post('/:worldId/magic/:subTable/:itemId/delete', (req, res) => {
  const { worldId, subTable, itemId } = req.params;
  const validTables = MagicSystemService.getSubTableList();
  if (!validTables.includes(subTable)) {
    res.status(404).render('pages/error.njk', { status: 404, message: 'Invalid magic sub-table' });
    return;
  }
  magicService.deleteSubEntity(worldId, subTable as any, itemId);

  if (req.headers['hx-request']) {
    res.set('HX-Redirect', `/worlds/${worldId}/magic/${subTable}`);
    res.send('');
  } else {
    res.redirect(`/worlds/${worldId}/magic/${subTable}`);
  }
});

export default router;
