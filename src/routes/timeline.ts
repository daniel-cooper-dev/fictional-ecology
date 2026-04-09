import { Router } from 'express';
import { TimelineService } from '../services/TimelineService.js';

const router = Router();
const timelineService = new TimelineService();

// Timeline view
router.get('/:worldId/timeline', (req, res) => {
  const eras = timelineService.listEras(req.params.worldId);
  const calendars = timelineService.listCalendars(req.params.worldId);
  res.render('pages/timeline.njk', { eras, calendars });
});

// API: timeline data for D3
router.get('/:worldId/api/timeline', (req, res) => {
  const data = timelineService.getTimelineData(req.params.worldId);
  res.json(data);
});

// Create era
router.post('/:worldId/eras', (req, res) => {
  if (!req.body.name || !req.body.name.trim()) {
    if (req.headers['hx-request']) {
      res.status(400).send('<div class="error-message">Era name is required</div>');
    } else {
      res.redirect(`/worlds/${req.params.worldId}/timeline`);
    }
    return;
  }
  const era = timelineService.createEra(req.params.worldId, req.body);
  if (req.headers['hx-request']) {
    res.set('HX-Refresh', 'true');
    res.send('');
  } else {
    res.redirect(`/worlds/${req.params.worldId}/timeline`);
  }
});

// Update era
router.post('/:worldId/eras/:eraId', (req, res) => {
  timelineService.updateEra(req.params.worldId, req.params.eraId, req.body);
  if (req.headers['hx-request']) {
    res.set('HX-Refresh', 'true');
    res.send('');
  } else {
    res.redirect(`/worlds/${req.params.worldId}/timeline`);
  }
});

// Delete era
router.post('/:worldId/eras/:eraId/delete', (req, res) => {
  timelineService.deleteEra(req.params.worldId, req.params.eraId);
  if (req.headers['hx-request']) {
    res.set('HX-Refresh', 'true');
    res.send('');
  } else {
    res.redirect(`/worlds/${req.params.worldId}/timeline`);
  }
});

// Create calendar
router.post('/:worldId/calendars', (req, res) => {
  const months = req.body.months_text ? req.body.months_text.split(',').map((m: string) => m.trim()).filter(Boolean) : [];
  const day_names = req.body.day_names_text ? req.body.day_names_text.split(',').map((d: string) => d.trim()).filter(Boolean) : [];
  timelineService.createCalendar(req.params.worldId, { ...req.body, months, day_names });
  if (req.headers['hx-request']) {
    res.set('HX-Refresh', 'true');
    res.send('');
  } else {
    res.redirect(`/worlds/${req.params.worldId}/timeline`);
  }
});

// Delete calendar
router.post('/:worldId/calendars/:calendarId/delete', (req, res) => {
  timelineService.deleteCalendar(req.params.worldId, req.params.calendarId);
  if (req.headers['hx-request']) {
    res.set('HX-Refresh', 'true');
    res.send('');
  } else {
    res.redirect(`/worlds/${req.params.worldId}/timeline`);
  }
});

export default router;
