import { Router } from 'express';
import { MapService } from '../services/MapService.js';

const router = Router();
const mapService = new MapService();

// Map list
router.get('/:worldId/maps', (req, res) => {
  const maps = mapService.listMaps(req.params.worldId);
  res.render('pages/maps.njk', { maps });
});

// Create map
router.post('/:worldId/maps', (req, res) => {
  if (!req.body.name || !req.body.name.trim()) {
    res.redirect(`/worlds/${req.params.worldId}/maps`);
    return;
  }
  const width = Math.max(100, Math.min(8000, parseInt(req.body.width) || 800));
  const height = Math.max(100, Math.min(8000, parseInt(req.body.height) || 600));
  const map = mapService.createMap(req.params.worldId, { ...req.body, width, height });
  res.redirect(`/worlds/${req.params.worldId}/maps/${map.id}`);
});

// Map editor view
router.get('/:worldId/maps/:mapId', (req, res) => {
  const mapData = mapService.getMapData(req.params.worldId, req.params.mapId);
  if (!mapData) { res.status(404).render('pages/error.njk', { status: 404, message: 'Map not found' }); return; }
  res.render('pages/map-editor.njk', mapData);
});

// Delete map
router.post('/:worldId/maps/:mapId/delete', (req, res) => {
  mapService.deleteMap(req.params.worldId, req.params.mapId);
  res.redirect(`/worlds/${req.params.worldId}/maps`);
});

// API: map data for SVG editor
router.get('/:worldId/api/maps/:mapId', (req, res) => {
  const data = mapService.getMapData(req.params.worldId, req.params.mapId);
  if (!data) { res.status(404).json({ error: 'Map not found' }); return; }
  res.json(data);
});

// API: create pin
router.post('/:worldId/maps/:mapId/pins', (req, res) => {
  const pin = mapService.createPin(req.params.worldId, req.params.mapId, req.body);
  res.json(pin);
});

// API: update pin position
router.post('/:worldId/maps/:mapId/pins/:pinId', (req, res) => {
  mapService.updatePin(req.params.worldId, req.params.pinId, req.body);
  res.json({ ok: true });
});

// API: delete pin
router.post('/:worldId/maps/:mapId/pins/:pinId/delete', (req, res) => {
  mapService.deletePin(req.params.worldId, req.params.pinId);
  res.json({ ok: true });
});

// API: create region
router.post('/:worldId/maps/:mapId/regions', (req, res) => {
  const region = mapService.createRegion(req.params.worldId, req.params.mapId, req.body);
  res.json(region);
});

// API: delete region
router.post('/:worldId/maps/:mapId/regions/:regionId/delete', (req, res) => {
  mapService.deleteRegion(req.params.worldId, req.params.regionId);
  res.json({ ok: true });
});

export default router;
