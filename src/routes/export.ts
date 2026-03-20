import { Router } from 'express';
import { ExportService } from '../services/ExportService.js';

const router = Router();
const exportService = new ExportService();

router.get('/:worldId/export/json', (req, res) => {
  try {
    const data = exportService.exportWorld(req.params.worldId);
    if (!data || !data.world) {
      res.status(404).json({ error: 'World not found' });
      return;
    }
    const safeName = (data.world.name || 'world').replace(/[^a-z0-9]/gi, '_');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.json"`);
    res.json(data);
  } catch (err: any) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Export failed' });
  }
});

router.get('/:worldId/export/markdown', (req, res) => {
  try {
    const md = exportService.exportWorldAsMarkdown(req.params.worldId);
    const worldData = exportService.exportWorld(req.params.worldId);
    if (!worldData || !worldData.world) {
      res.status(404).json({ error: 'World not found' });
      return;
    }
    const safeName = (worldData.world.name || 'world').replace(/[^a-z0-9]/gi, '_');
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.md"`);
    res.send(md);
  } catch (err: any) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Export failed' });
  }
});

export default router;
