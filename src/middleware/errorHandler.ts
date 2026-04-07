import type { Request, Response, NextFunction } from 'express';

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction): void {
  console.error('Error:', err.message || err);
  const status = err.status || 500;
  const message = status >= 500 ? 'Internal Server Error' : (err.message || 'Something went wrong');

  if (req.headers['hx-request']) {
    res.status(status).send(`<div class="error-message">${escapeHtml(message)}</div>`);
  } else {
    res.status(status).render('pages/error.njk', { status, message });
  }
}
