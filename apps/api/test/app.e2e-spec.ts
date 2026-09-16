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

  // These run against the dev database: every draft is deleted and every publish restored,
  // so they refuse to start while a draft (the owner's unpublished edits) exists.
  describe('visual editor content', () => {
    const bearer = (value: string) => ({ Authorization: `Bearer ${value}` });
    const setHeroTitle = (value: string) =>
      request(app.getHttpServer())
        .patch('/admin/content/draft')
        .set(bearer(token))
        .send({ patches: [{ op: 'set', path: 'home.ru.heroTitle', value }] })
        .expect(200);
    const publishDraft = () =>
      request(app.getHttpServer()).post('/admin/content/publish').set(bearer(token));
    const publishedHeroTitle = async (): Promise<string> => {
      const res = await request(app.getHttpServer()).get('/content/home?locale=ru').expect(200);
      return res.body.content.heroTitle;
    };

    let originalTitle = '';
    let previewToken = '';
    let startedWithoutDraft = false;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/content/tree')
        .set(bearer(token))
        .expect(200);
      // A failed beforeAll skips the tests but not afterAll, hence the flag.
      if (res.body.hasDraft) {
        throw new Error(
          'A content draft exists: these tests would discard or publish its unpublished edits. ' +
            'Publish or reset it in the CRM (or run e2e against a test database) first.',
        );
      }
      startedWithoutDraft = true;
      originalTitle = await publishedHeroTitle();
    });

    afterAll(async () => {
      if (!startedWithoutDraft) return;
      await request(app.getHttpServer())
        .delete('/admin/content/draft')
        .set(bearer(token))
        .expect(200);
    });

    it('requires an admin JWT for the content tree', async () => {
      await request(app.getHttpServer()).get('/admin/content/tree').expect(401);
      const res = await request(app.getHttpServer())
        .get('/admin/content/tree')
        .set(bearer(token))
        .expect(200);
      expect(res.body.tree.version).toBe(1);
    });

    it('patches the draft without touching the published site', async () => {
      const res = await setHeroTitle(`e2e draft ${Date.now()}`);
      expect(res.body).toMatchObject({ hasDraft: true, applied: 1, skipped: 0 });
      expect(res.body.changes).toBeGreaterThanOrEqual(1);
      expect(res.body.tree.home.ru.heroTitle).toMatch(/^e2e draft /);
      expect(await publishedHeroTitle()).toBe(originalTitle);
    });

    it('serves draft reads only with a preview token', async () => {
      await request(app.getHttpServer()).get('/content/draft/home?locale=ru').expect(401);
      await request(app.getHttpServer())
        .get('/content/draft/home?locale=ru')
        .set(bearer(token))
        .expect(401);

      const issued = await request(app.getHttpServer())
        .post('/admin/content/preview-token')
        .set(bearer(token))
        .expect(201);
      previewToken = issued.body.token;
      expect(Date.parse(issued.body.expiresAt)).toBeGreaterThan(Date.now());

      await request(app.getHttpServer())
        .get('/content/draft/verify')
        .set(bearer(previewToken))
        .expect(200, { expiresAt: issued.body.expiresAt });
      const draft = await request(app.getHttpServer())
        .get('/content/draft/home?locale=ru')
        .set(bearer(previewToken))
        .expect(200);
      expect(draft.body.content.heroTitle).toMatch(/^e2e draft /);
      expect(draft.body.hiddenSections).toEqual(expect.any(Array));
    });

    it('never accepts a preview token as an admin token', async () => {
      await request(app.getHttpServer())
        .get('/admin/content/tree')
        .set(bearer(previewToken))
        .expect(401);
    });

    it('rejects a patch with an unknown path', async () => {
      const res = await request(app.getHttpServer())
        .patch('/admin/content/draft')
        .set(bearer(token))
        .send({ patches: [{ op: 'set', path: 'home.ru.nope', value: 'x' }] })
        .expect(400);
      expect(res.body).toMatchObject({ path: 'home.ru.nope', patchIndex: 0 });
    });

    it('blocks publishing a blank required RU field', async () => {
      await setHeroTitle('');
      const res = await publishDraft().expect(422);
      expect(res.body.message).toEqual(expect.any(String));
      expect(res.body.errors).toContainEqual(
        expect.objectContaining({ path: 'home.ru.heroTitle', locale: 'ru' }),
      );
      expect(await publishedHeroTitle()).toBe(originalTitle);
    });

    it('resets the draft to the published tree', async () => {
      const res = await request(app.getHttpServer())
        .delete('/admin/content/draft')
        .set(bearer(token))
        .expect(200);
      expect(res.body).toMatchObject({ hasDraft: false, changes: 0, updatedAt: null });
      expect(res.body.tree.home.ru.heroTitle).toBe(originalTitle);
    });

    it('publishes the draft and revalidates every content tag', async () => {
      const marker = `e2e publish ${Date.now()}`;
      try {
        const patched = await setHeroTitle(marker);
        const projectTag = `project:${patched.body.tree.projects[0].slug}`;
        capturedTags = [];

        const res = await publishDraft().expect(200);
        expect(res.body).toMatchObject({ ok: true, revalidated: true, warnings: [] });
        for (const tags of [res.body.tags, capturedTags]) {
          expect(tags).toEqual(
            expect.arrayContaining(['content:home', 'content:chrome', projectTag]),
          );
        }
        expect(await publishedHeroTitle()).toBe(marker);

        const tree = await request(app.getHttpServer())
          .get('/admin/content/tree')
          .set(bearer(token))
          .expect(200);
        expect(tree.body).toMatchObject({ hasDraft: false, changes: 0 });
      } finally {
        await setHeroTitle(originalTitle);
        await publishDraft().expect(200);
      }
      expect(await publishedHeroTitle()).toBe(originalTitle);
    });
  });
});
