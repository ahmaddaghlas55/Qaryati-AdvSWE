import express, { type ErrorRequestHandler } from 'express';
import request from 'supertest';

import { RateLimitedError } from '../../shared/errors/app-error';
import { createCorsMiddleware, createRateLimiters } from '../../shared/security/security.middleware';

describe('auth security middleware', () => {
  it('limits authentication requests by client IP', async () => {
    const app = express();
    const limiters = createRateLimiters({
      windowMs: 60_000,
      generalLimit: 100,
      authenticationLimit: 10,
    });
    app.use('/auth', limiters.authentication);
    app.get('/auth/login', (_req, res) => res.status(200).json({ ok: true }));
    const errors: ErrorRequestHandler = (error, _req, res, _next) => {
      res.status(error instanceof RateLimitedError ? error.statusCode : 500).end();
    };
    app.use(errors);

    for (let count = 0; count < 10; count += 1) {
      expect((await request(app).get('/auth/login')).status).toBe(200);
    }
    expect((await request(app).get('/auth/login')).status).toBe(429);
  });

  it('allows 100 general requests per minute per client IP', async () => {
    const app = express();
    app.use(createRateLimiters({
      windowMs: 60_000,
      generalLimit: 100,
      authenticationLimit: 10,
    }).general);
    app.get('/resource', (_req, res) => res.status(200).end());
    const errors: ErrorRequestHandler = (error, _req, res, _next) => {
      res.status(error instanceof RateLimitedError ? error.statusCode : 500).end();
    };
    app.use(errors);

    for (let count = 0; count < 100; count += 1) {
      expect((await request(app).get('/resource')).status).toBe(200);
    }
    expect((await request(app).get('/resource')).status).toBe(429);
  });

  it('allows configured CORS origins and excludes unlisted origins', async () => {
    const app = express();
    app.use(createCorsMiddleware(['https://client.example']));
    app.get('/resource', (_req, res) => res.status(200).end());

    const allowed = await request(app)
      .get('/resource')
      .set('Origin', 'https://client.example');
    const denied = await request(app)
      .get('/resource')
      .set('Origin', 'https://unlisted.example');

    expect(allowed.headers['access-control-allow-origin']).toBe('https://client.example');
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });
});