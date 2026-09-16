import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  ALL_STATIC_CONTENT_TAGS,
  CacheTags,
  CmsPatchError,
  applyPatches,
  siteTreeSchema,
  type ApplyPatchesResult,
  type ContentPatch,
  type ContentPatchResponse,
  type ContentPublishResponse,
  type ContentTreeResponse,
  type SiteTree,
} from '@alcha/shared';
import { PrismaService } from '../prisma/prisma.service';
import { RevalidateService } from '../revalidate/revalidate.module';
import { TreeRepository } from './tree/tree.repository';
import { countChanges } from './tree/diff';
import { validateTree } from './tree/validate';

type Db = Prisma.TransactionClient;

/** The one ContentDraft row (docs/visual-editor.md D1). */
const DRAFT_ID = 'site';

/** pg advisory lock key serialising draft writes and publishes (any app-wide constant). */
const CONTENT_LOCK_KEY = 4_170_207;

/** How long a content transaction waits for the lock before giving up with a 503. */
const LOCK_WAIT_MS = 10_000;

/**
 * Shared by every content transaction. Prisma's 5 s default counts the lock wait, so a patch
 * queued behind a publish would expire: `timeout` covers the full lock wait plus a publish
 * rewriting every content row; `maxWait` bounds getting a pooled connection.
 */
const CONTENT_TX_OPTIONS = { maxWait: 5_000, timeout: LOCK_WAIT_MS + 30_000 };

/** A draft (or, without one, the published tree as both sides); `updatedAt` null = no draft row. */
interface DraftState {
  base: SiteTree;
  tree: SiteTree;
  updatedAt: Date | null;
}

/** The editor's draft tree: read, patch, reset and publish (docs/visual-editor.md §3). */
@Injectable()
export class DraftService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trees: TreeRepository,
    private readonly revalidate: RevalidateService,
  ) {}

  async getTree(): Promise<ContentTreeResponse> {
    return treeResponse(await this.load(this.prisma));
  }

  /** What preview reads render: the draft tree, or the published one when there is no draft. */
  async currentTree(): Promise<SiteTree> {
    const draft = await this.prisma.contentDraft.findUnique({
      where: { id: DRAFT_ID },
      select: { tree: true },
    });
    return draft ? siteTreeSchema.parse(draft.tree) : this.trees.loadPublishedTree();
  }

  /** Applies patches to the draft, forking it from the published tree on the first write. */
  async patch(patches: readonly ContentPatch[]): Promise<ContentPatchResponse> {
    const { state, applied, skipped } = await this.locked(async (tx) => {
      const { base, tree: current } = await this.load(tx);
      const { tree, applied, skipped } = applyOrReject(current, patches);
      const draft = await tx.contentDraft.upsert({
        where: { id: DRAFT_ID },
        create: { id: DRAFT_ID, base, tree },
        update: { tree },
      });
      return { state: { base, tree, updatedAt: draft.updatedAt }, applied, skipped };
    });
    return { ...treeResponse(state), applied, skipped };
  }

  async reset(): Promise<ContentTreeResponse> {
    await this.locked((tx) => tx.contentDraft.deleteMany({ where: { id: DRAFT_ID } }));
    return this.getTree();
  }

  /**
   * Validates the draft, writes it into the content tables and deletes it in one transaction
   * (without a draft this re-publishes the tables as they are), then revalidates the web.
   */
  async publish(): Promise<ContentPublishResponse> {
    const { base, tree, warnings } = await this.locked(async (tx) => {
      const { base, tree } = await this.load(tx);
      const { errors, warnings } = validateTree(tree);
      if (errors.length > 0) {
        throw new UnprocessableEntityException({
          message: 'Черновик нельзя опубликовать: исправьте ошибки',
          errors,
        });
      }
      await this.trees.writeTree(tx, tree);
      await tx.contentDraft.deleteMany({ where: { id: DRAFT_ID } });
      return { base, tree, warnings };
    });

    // After commit, so the web never refetches content that could still roll back.
    const slugs = new Set([...base.projects, ...tree.projects].map((project) => project.slug));
    const tags = [...ALL_STATIC_CONTENT_TAGS, ...[...slugs].map((slug) => CacheTags.project(slug))];
    const revalidated = await this.revalidate.revalidate(tags);
    return { ok: true, tags, revalidated, warnings };
  }

  /** Runs `work` in one transaction under the content lock; running out of time there is a 503. */
  private async locked<T>(work: (tx: Db) => Promise<T>): Promise<T> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        await lockContent(tx);
        return work(tx);
      }, CONTENT_TX_OPTIONS);
    } catch (error) {
      if (isContentBusy(error)) {
        throw new ServiceUnavailableException(
          'Черновик сейчас занят — повторите через пару секунд',
        );
      }
      throw error;
    }
  }

  private async load(db: Db): Promise<DraftState> {
    const draft = await db.contentDraft.findUnique({ where: { id: DRAFT_ID } });
    if (draft) {
      return {
        base: siteTreeSchema.parse(draft.base),
        tree: siteTreeSchema.parse(draft.tree),
        updatedAt: draft.updatedAt,
      };
    }
    const published = await this.trees.loadPublishedTree(db);
    return { base: published, tree: published, updatedAt: null };
  }
}

/**
 * Takes the content lock, held until the surrounding transaction ends; waiting longer than
 * LOCK_WAIT_MS fails with SQLSTATE 55P03. Exported for specs that write the content tables.
 */
export async function lockContent(tx: Db): Promise<void> {
  // SET LOCAL takes no bind parameters; set_config(…, true) is its parameterised form.
  await tx.$executeRaw`SELECT set_config('lock_timeout', ${`${LOCK_WAIT_MS}ms`}, true)`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${CONTENT_LOCK_KEY}::bigint)`;
}

/** Lock wait ran out (55P03, raised by a raw query as P2010) or the transaction expired (P2028). */
function isContentBusy(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === 'P2028' || error.meta?.code === '55P03')
  );
}

/** Applies patches; a malformed patch or an invalid resulting tree is a 400. */
function applyOrReject(tree: SiteTree, patches: readonly ContentPatch[]): ApplyPatchesResult {
  let result: ApplyPatchesResult;
  try {
    result = applyPatches(tree, patches);
  } catch (error) {
    if (error instanceof CmsPatchError) {
      throw new BadRequestException({
        message: error.message,
        path: error.path,
        patchIndex: error.patchIndex,
      });
    }
    throw error;
  }

  const checked = siteTreeSchema.safeParse(result.tree);
  if (!checked.success) {
    throw new BadRequestException({
      message: 'Patches produce an invalid content tree',
      errors: checked.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }
  return { ...result, tree: checked.data };
}

function treeResponse({ base, tree, updatedAt }: DraftState): ContentTreeResponse {
  return {
    tree,
    changes: countChanges(base, tree),
    hasDraft: updatedAt !== null,
    updatedAt: updatedAt?.toISOString() ?? null,
    issues: validateTree(tree),
  };
}
