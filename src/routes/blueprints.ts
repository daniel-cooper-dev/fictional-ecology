import { Router } from 'express';
import { BlueprintService } from '../services/BlueprintService.js';

const router = Router();
const blueprintService = new BlueprintService();

// List all blueprints
router.get('/', (req, res) => {
  const tag = req.query.tag as string | undefined;
  const blueprints = tag ? blueprintService.filterByTag(tag) : blueprintService.list();
  const tags = blueprintService.getTags();
  res.render('pages/blueprint-list.njk', { blueprints, tags, currentTag: tag || '' });
});

// Blueprint detail
router.get('/:blueprintId', (req, res) => {
  const resolved = blueprintService.getResolved(req.params.blueprintId);
  if (!resolved) {
    res.status(404).render('pages/error.njk', { status: 404, message: 'Blueprint not found' });
    return;
  }

  // Group suggestions by domain category
  const essential = resolved.resolvedSuggestions.filter(s => s.priority === 'essential');
  const recommended = resolved.resolvedSuggestions.filter(s => s.priority === 'recommended');
  const optional = resolved.resolvedSuggestions.filter(s => s.priority === 'optional');

  res.render('pages/blueprint-detail.njk', {
    blueprint: resolved,
    essential,
    recommended,
    optional,
  });
});

export default router;
