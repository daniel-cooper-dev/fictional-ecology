import type { Request, Response, NextFunction } from 'express';
import { WorldService } from '../services/WorldService.js';
import { ALL_DOMAINS, DOMAIN_CATEGORIES } from '../domains/index.js';

const worldService = new WorldService();

export function worldContext(req: Request, res: Response, next: NextFunction): void {
  const worldId = req.params.worldId as string;
  if (!worldId) return next();

  const world = worldService.get(worldId);
  if (!world) {
    res.status(404).render('pages/error.njk', { status: 404, message: 'World not found' });
    return;
  }

  res.locals.world = world;
  res.locals.worldId = worldId;
  res.locals.domains = ALL_DOMAINS;
  res.locals.domainCategories = DOMAIN_CATEGORIES;
  res.locals.magicEnabled = !!world.magic_enabled;
  res.locals.domainStats = worldService.getStats(worldId);
  next();
}
