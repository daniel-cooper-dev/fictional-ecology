import type { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction): void {
  console.error('Error:', err.message || err);
  const status = err.status || 500;
  const message = status >= 500 ? 'Internal Server Error' : (err.message || 'Something went wrong');

  if (req.headers['hx-request']) {
    res.status(status).send(`<div class="error-message">${message}</div>`);
  } else {
    res.status(status).render('pages/error.njk', { status, message });
  }
}
