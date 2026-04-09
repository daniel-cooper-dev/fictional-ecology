import { Router } from 'express';
import { SearchService } from '../services/SearchService.js';

const router = Router();
const searchService = new SearchService();

router.get('/:worldId/search', (req, res) => {
  const query = ((req.query.q as string) || '').slice(0, 500);
  const domain = req.query.domain as string | undefined;
  let results: any[] = [];

  if (query.trim()) {
    results = searchService.search(req.params.worldId, query, domain);
  }

  if (req.headers['hx-request']) {
    res.render('partials/search-results.njk', { results, query, worldId: req.params.worldId });
  } else {
    res.render('pages/search.njk', { results, query });
  }
});

export default router;
