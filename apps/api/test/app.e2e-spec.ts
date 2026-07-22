import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ZodExceptionFilter } from '../src/common/filters/zod-exception.filter';

describe('alcha.dev API (e2e)', () => {
  let app: INestApplication;
  let revalidateServer: Server;
  let capturedTags: string[] = [];
  let token = '';

  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@alcha.dev';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'changeme123';

  beforeAll(async () => {
    // A stand-in for the web app's revalidate endpoint.
    revalidateServer = createServer((req, res) => {
      if (req.method === 'POST' && req.url === '/api/revalidate') {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
          try {
            capturedTags = JSON.parse(body).tags ?? [];
          } catch {
            capturedTags = [];
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ revalidated: true, tags: capturedTags, now: 0 }));
        });
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    await new Promise<void>((resolve) => revalidateServer.listen(0, resolve));
    const { port } = revalidateServer.address() as AddressInfo;
    process.env.WEB_URL = `http://localhost:${port}`;

    // Import AppModule only after WEB_URL is set — ConfigModule reads env eagerly.
    const { AppModule } = await import('../src/app.module');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.use(helmet());
    app.use(cookieParser());
    app.useGlobalFilters(new ZodExceptionFilter());
    await app.init();

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    token = login.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
    await new Promise<void>((resolve) => revalidateServer.close(() => resolve()));
  });

  describe('auth', () => {
    it('rejects invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: 'definitely-wrong' })
        .expect(401);
    });

    it('returns the current admin user with a valid token', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.email).toBe(email);
      expect(res.body.role).toBe('ADMIN');
    });

    it('blocks admin routes without a token', async () => {
      await request(app.getHttpServer()).get('/admin/leads').expect(401);
    });
  });

  describe('leads', () => {
    it('accepts a public lead and stores it', async () => {
      const marker = `e2e-${Date.now()}`;
      await request(app.getHttpServer())
        .post('/leads')
        .send({ name: marker, contact: 'e2e@test.dev', message: 'hello from e2e', sourcePath: '/' })
        .expect(201)
        .expect({ ok: true });

      const list = await request(app.getHttpServer())
        .get('/admin/leads')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(list.body.some((l: { name: string }) => l.name === marker)).toBe(true);
    });

    it('silently drops honeypot submissions', async () => {
      const marker = `honeypot-${Date.now()}`;
      await request(app.getHttpServer())
        .post('/leads')
        .send({ name: marker, contact: 'bot@test.dev', message: 'spam', website: 'http://spam.example' })
        .expect(201);

      const list = await request(app.getHttpServer())
        .get('/admin/leads')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(list.body.some((l: { name: string }) => l.name === marker)).toBe(false);
    });
  });

  describe('publish → revalidate', () => {
    it('publishes home content and calls the web revalidate webhook', async () => {
      capturedTags = [];
      const res = await request(app.getHttpServer())
        .post('/publish')
        .set('Authorization', `Bearer ${token}`)
        .send({ target: 'home' })
        .expect(201);

      expect(res.body.ok).toBe(true);
      expect(res.body.tags).toContain('content:home');
      expect(res.body.revalidated).toBe(true);
      expect(capturedTags).toContain('content:home');
    });

    it('includes the project slug tag when publishing a single project', async () => {
      capturedTags = [];
      const res = await request(app.getHttpServer())
        .post('/publish')
        .set('Authorization', `Bearer ${token}`)
        .send({ target: 'projects', slug: 'chaban' })
        .expect(201);

      expect(res.body.tags).toEqual(
        expect.arrayContaining(['content:projects', 'project:chaban']),
      );
      expect(capturedTags).toContain('project:chaban');
    });
  });
});
