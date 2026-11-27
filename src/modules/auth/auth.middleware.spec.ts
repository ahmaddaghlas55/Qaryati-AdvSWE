import express, { type ErrorRequestHandler } from 'express';
import request from 'supertest';

import { AppError } from '../../shared/errors/app-error';
import { requireRole } from './auth.middleware';

describe('authorization middleware', () => {
  function createApp(role?: string) {
    const app = express();
    app.use((_req, res, next) => {
      if (role) res.locals.authActor = { userId: '5', role };
      next();
    });
    app.get('/admin', requireRole('admin'), (_req, res) => res.status(200).end());
    const errors: ErrorRequestHandler = (error, _req, res, _next) => {
      res.status(error instanceof AppError ? error.statusCode : 500).end();
    };
    app.use(errors);
    return app;
  }

  it('rejects missing and unauthorized identities and allows the required role', async () => {
    expect((await request(createApp()).get('/admin')).status).toBe(401);
    expect((await request(createApp('contributor')).get('/admin')).status).toBe(403);
    expect((await request(createApp('admin')).get('/admin')).status).toBe(200);
  });
});