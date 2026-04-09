import { Router } from 'express';
import { TagService } from '../services/TagService.js';

const router = Router();
const tagService = new TagService();

router.get('/:worldId/tags', (req, res) => {
  const tags = tagService.listForWorld(req.params.worldId);
  res.json(tags);
});

router.post('/:worldId/tags', (req, res) => {
  const { name, color } = req.body;
  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Tag name is required' });
    return;
  }
  const tag = tagService.create(req.params.worldId, name, color || '#4a9eff');
  res.json(tag);
});

router.post('/:worldId/tags/:tagId/delete', (req, res) => {
  tagService.delete(req.params.worldId, req.params.tagId);
  if (req.headers['hx-request']) {
    res.send('');
  } else {
    res.redirect('back');
  }
});

router.post('/:worldId/elements/:elementId/tags', (req, res) => {
  const { tag_id, new_tag_name, color } = req.body;
  const worldId = req.params.worldId;
  const elementId = req.params.elementId;

  let tagId = tag_id;
  if (!tagId && new_tag_name && new_tag_name.trim()) {
    const tag = tagService.findOrCreate(worldId, new_tag_name, color || '#4a9eff');
    tagId = tag.id;
  }

  if (!tagId) {
    if (req.headers['hx-request']) {
      res.status(400).send('<div class="error-message">Tag name is required</div>');
    } else {
      res.redirect('back');
    }
    return;
  }

  tagService.addToElement(worldId, elementId, tagId);

  if (req.headers['hx-request']) {
    const tags = tagService.listForElement(worldId, elementId);
    res.render('partials/tag-list.njk', { tags, world: res.locals.world, element: { id: elementId } });
  } else {
    res.redirect('back');
  }
});

router.post('/:worldId/elements/:elementId/tags/:tagId/delete', (req, res) => {
  tagService.removeFromElement(req.params.worldId, req.params.elementId, req.params.tagId);

  if (req.headers['hx-request']) {
    const tags = tagService.listForElement(req.params.worldId, req.params.elementId);
    res.render('partials/tag-list.njk', { tags, world: res.locals.world, element: { id: req.params.elementId } });
  } else {
    res.redirect('back');
  }
});

export default router;
