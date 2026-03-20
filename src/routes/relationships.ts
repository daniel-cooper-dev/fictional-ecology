import { Router } from 'express';
import { RelationshipService, RELATIONSHIP_TYPES } from '../services/RelationshipService.js';
import { getWorldDb } from '../db/connection.js';

const router = Router();
const relService = new RelationshipService();

// Graph view
router.get('/:worldId/graph', (req, res) => {
  res.render('pages/graph.njk', { relationshipTypes: RELATIONSHIP_TYPES });
});

// API: graph data
router.get('/:worldId/api/graph', (req, res) => {
  const domains = req.query.domains ? (req.query.domains as string).split(',') : undefined;
  const data = relService.getGraphData(req.params.worldId, domains);
  res.json(data);
});

// Create relationship
router.post('/:worldId/relationships', (req, res) => {
  const { source_id, target_id, relationship_type, description, strength, bidirectional } = req.body;
  relService.create(req.params.worldId, {
    source_id, target_id, relationship_type,
    description: description || '',
    strength: strength || 'moderate',
    bidirectional: bidirectional === 'on',
  });

  if (req.headers['hx-request']) {
    // Re-render relationship list for the source element
    const relationships = relService.listForElement(req.params.worldId, source_id);
    res.render('partials/relationship-list.njk', { relationships, worldId: req.params.worldId });
  } else {
    res.redirect('back');
  }
});

// Delete relationship
router.post('/:worldId/relationships/:relId/delete', (req, res) => {
  relService.delete(req.params.worldId, req.params.relId);

  if (req.headers['hx-request']) {
    res.send('');
  } else {
    res.redirect('back');
  }
});

// API: search elements for relationship picker
router.get('/:worldId/api/elements', (req, res) => {
  const db = getWorldDb(req.params.worldId);
  const q = (req.query.q as string || '').replace(/[%_]/g, '\\$&');
  const elements = db.prepare(`
    SELECT id, name, domain, element_type
    FROM world_elements
    WHERE world_id = ? AND name LIKE ? ESCAPE '\\'
    ORDER BY name
    LIMIT 20
  `).all(req.params.worldId, `%${q}%`);
  res.json(elements);
});

export default router;
