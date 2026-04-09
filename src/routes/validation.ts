import { Router } from 'express';
import { ValidationService } from '../services/ValidationService.js';

const router = Router();
const validationService = new ValidationService();

// Validation report page
router.get('/:worldId/validate', (req, res) => {
  const issues = validationService.validate(req.params.worldId);
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  const infos = issues.filter(i => i.severity === 'info');
  res.render('pages/validation.njk', { issues, errors, warnings, infos });
});

// API: validate (for HTMX)
router.get('/:worldId/api/validate', (req, res) => {
  const issues = validationService.validate(req.params.worldId);
  res.json(issues);
});

export default router;
