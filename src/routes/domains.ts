import { Router } from 'express';
import { DomainService } from '../services/DomainService.js';
import { TagService } from '../services/TagService.js';
import { getDomainConfig } from '../domains/index.js';

const router = Router();

// List elements in a domain
router.get('/:worldId/:domainId', (req, res) => {
  const config = getDomainConfig(req.params.domainId);
  if (!config) {
    res.status(404).render('pages/error.njk', { status: 404, message: 'Domain not found' });
    return;
  }

  // Skip standard listing for magic_systems — it has its own route
  if (config.id === 'magic_systems') {
    res.redirect(`/worlds/${req.params.worldId}/magic`);
    return;
  }

  const service = new DomainService(config);
  let page = parseInt(req.query.page as string) || 1;
  if (page < 1) page = 1;
  const type = req.query.type as string | undefined;
  const result = service.list(req.params.worldId, { page, limit: 50, type });

  res.render('pages/domain-list.njk', {
    domainConfig: config,
    result,
    currentType: type,
  });
});

// New element form
router.get('/:worldId/:domainId/new', (req, res) => {
  const config = getDomainConfig(req.params.domainId);
  if (!config) { res.status(404).send('Domain not found'); return; }

  res.render('pages/element-form.njk', {
    domainConfig: config,
    element: null,
    isNew: true,
  });
});

// Create element
router.post('/:worldId/:domainId', (req, res) => {
  const config = getDomainConfig(req.params.domainId);
  if (!config) { res.status(404).send('Domain not found'); return; }

  const service = new DomainService(config);
  const { name, element_type, summary, detailed_notes, ...rest } = req.body;

  if (!name || !name.trim()) {
    // Re-render form with error
    res.status(400).render('pages/element-form.njk', {
      domainConfig: config,
      error: 'Name is required',
      element: req.body,
    });
    return;
  }

  // Separate extension fields from magic aspect fields
  const extensionFields: Record<string, any> = {};
  const magicFields: Record<string, any> = {};

  for (const [key, value] of Object.entries(rest)) {
    if (key.startsWith('magic_')) {
      magicFields[key.replace('magic_', '')] = value;
    } else {
      extensionFields[key] = value;
    }
  }

  const element = service.create(req.params.worldId, {
    name: name.trim(),
    element_type: element_type || '',
    summary: summary || '',
    detailed_notes: detailed_notes || '',
    extension: Object.keys(extensionFields).length > 0 ? extensionFields : undefined,
    magic_aspects: Object.keys(magicFields).length > 0 ? magicFields : undefined,
  });

  if (req.headers['hx-request']) {
    res.set('HX-Redirect', `/worlds/${req.params.worldId}/${req.params.domainId}/${element.id}`);
    res.send('');
  } else {
    res.redirect(`/worlds/${req.params.worldId}/${req.params.domainId}/${element.id}`);
  }
});

// View element
router.get('/:worldId/:domainId/:elementId', (req, res) => {
  const config = getDomainConfig(req.params.domainId);
  if (!config) { res.status(404).send('Domain not found'); return; }

  const service = new DomainService(config);
  const element = service.get(req.params.worldId, req.params.elementId);
  if (!element) {
    res.status(404).render('pages/error.njk', { status: 404, message: 'Element not found' });
    return;
  }

  // Load relationships
  const { RelationshipService } = require('../services/RelationshipService.js');
  const relService = new RelationshipService();
  const relationships = relService.listForElement(req.params.worldId, req.params.elementId);

  // Load tags
  const tagService = new TagService();
  const tags = tagService.listForElement(req.params.worldId, req.params.elementId);

  res.render('pages/element-detail.njk', {
    domainConfig: config,
    element,
    relationships,
    tags,
  });
});

// Edit element form
router.get('/:worldId/:domainId/:elementId/edit', (req, res) => {
  const config = getDomainConfig(req.params.domainId);
  if (!config) { res.status(404).send('Domain not found'); return; }

  const service = new DomainService(config);
  const element = service.get(req.params.worldId, req.params.elementId);
  if (!element) { res.status(404).send('Element not found'); return; }

  res.render('pages/element-form.njk', {
    domainConfig: config,
    element,
    isNew: false,
  });
});

// Update element
router.post('/:worldId/:domainId/:elementId', (req, res) => {
  const config = getDomainConfig(req.params.domainId);
  if (!config) { res.status(404).send('Domain not found'); return; }

  const service = new DomainService(config);
  const { name, element_type, summary, detailed_notes, ...rest } = req.body;

  const extensionFields: Record<string, any> = {};
  const magicFields: Record<string, any> = {};

  for (const [key, value] of Object.entries(rest)) {
    if (key.startsWith('magic_')) {
      magicFields[key.replace('magic_', '')] = value;
    } else {
      extensionFields[key] = value;
    }
  }

  service.update(req.params.worldId, req.params.elementId, {
    name, element_type, summary, detailed_notes,
    extension: Object.keys(extensionFields).length > 0 ? extensionFields : undefined,
    magic_aspects: Object.keys(magicFields).length > 0 ? magicFields : undefined,
  });

  if (req.headers['hx-request']) {
    res.set('HX-Redirect', `/worlds/${req.params.worldId}/${req.params.domainId}/${req.params.elementId}`);
    res.send('');
  } else {
    res.redirect(`/worlds/${req.params.worldId}/${req.params.domainId}/${req.params.elementId}`);
  }
});

// Delete element
router.post('/:worldId/:domainId/:elementId/delete', (req, res) => {
  const config = getDomainConfig(req.params.domainId);
  if (!config) { res.status(404).send('Domain not found'); return; }

  const service = new DomainService(config);
  service.delete(req.params.worldId, req.params.elementId);

  if (req.headers['hx-request']) {
    res.set('HX-Redirect', `/worlds/${req.params.worldId}/${req.params.domainId}`);
    res.send('');
  } else {
    res.redirect(`/worlds/${req.params.worldId}/${req.params.domainId}`);
  }
});

export default router;
