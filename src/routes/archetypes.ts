import { Router } from 'express';
import { ALL_DOMAINS } from '../domains/index.js';

const router = Router();

// Searchable list of ALL archetypes across all domains
router.get('/', (req, res) => {
  const query = (req.query.q as string || '').toLowerCase().trim();
  const domainFilter = req.query.domain as string || '';
  const categoryFilter = req.query.category as string || '';

  // Gather all archetypes with domain metadata
  let allArchetypes: any[] = [];
  for (const domain of ALL_DOMAINS) {
    if (!domain.archetypes) continue;
    if (domainFilter && domain.id !== domainFilter) continue;
    if (categoryFilter && domain.category !== categoryFilter) continue;

    for (const arch of domain.archetypes) {
      allArchetypes.push({
        ...arch,
        domainId: domain.id,
        domainName: domain.name,
        domainIcon: domain.icon,
        domainColor: domain.color,
        domainCategory: domain.category,
      });
    }
  }

  // Filter by search query
  if (query) {
    allArchetypes = allArchetypes.filter(a =>
      a.name.toLowerCase().includes(query) ||
      a.description.toLowerCase().includes(query) ||
      a.domainName.toLowerCase().includes(query) ||
      a.element_type.toLowerCase().includes(query)
    );
  }

  const domains = ALL_DOMAINS.filter(d => d.archetypes && d.archetypes.length > 0);
  const categories = ['natural', 'sentient', 'magic', 'meta'];

  res.render('pages/archetype-search.njk', {
    archetypes: allArchetypes,
    total: allArchetypes.length,
    query,
    domainFilter,
    categoryFilter,
    domains,
    categories,
  });
});

export default router;
