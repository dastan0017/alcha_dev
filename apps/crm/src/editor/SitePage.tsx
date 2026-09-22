import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  CMS_SECTION_LABELS,
  DEFAULT_LOCALE,
  HOME_SECTION_KEYS,
  cmsNodeKey,
  cmsPath,
  getAtPath,
  hiddenSectionPatch,
  parseCmsItemRef,
  parseCmsPath,
  type CmsEditorMode,
  type CmsNode,
  type CollectionKey,
  type CollectionNode,
  type ContentPatch,
  type HomeSectionKey,
  type Locale,
} from '@alcha/shared';
import { useAuth } from '../auth/AuthContext';
import { PublishBlockedError } from './api';
import { BottomBar } from './chrome/BottomBar';
import { OnboardingStrip } from './chrome/OnboardingStrip';
import { ResetDialog } from './chrome/ResetDialog';
import { Toast } from './chrome/Toast';
import { TopBar, type Device } from './chrome/TopBar';
import { EditorDrawer } from './drawer/EditorDrawer';
import { MediaPickerModal } from './media/MediaPickerModal';
import { Overlay, type OverlayActions } from './overlay/Overlay';
import {
  caseProjects,
  frameSrc,
  localizedPath,
  pagePath,
  resolvePage,
  type PageKind,
} from './pages';
import {
  SECTION_SCHEMAS,
  collectionSchema,
  drawerTargetForPath,
  findItem,
  labelForPath,
  targetLabel,
  type DrawerTarget,
  type ItemDrawerTarget,
} from './schemas';
import { Button, cx, editorRoot } from './ui';
import { useBridge, useBridgeState } from './useBridge';
import { useDraft } from './useDraft';
import { usePreviewToken } from './usePreviewToken';
import { useToast } from './useToast';
import styles from './SitePage.module.css';

/** How long «+ Добавить» waits for the new card to render before opening its drawer anyway. */
const ADD_WAIT_MS = 3000;
const PUBLISH_ISSUES_SHOWN = 3;
/** A document that loaded but never announced itself (an error page) is shown after this long. */
const READY_GRACE_MS = 4000;
/** Reloads in a row for a preview that keeps landing on another page before it is accepted as is. */
const MAX_STRAY_RELOADS = 2;

const PAGE_TITLES: Record<Exclude<PageKind, 'case'>, string> = {
  home: 'Главная',
};

const isHideableSection = (section: string): section is HomeSectionKey =>
  (HOME_SECTION_KEYS as readonly string[]).includes(section);

const NON_TEXT_INPUTS = new Set([
  'button',
  'checkbox',
  'color',
  'file',
  'image',
  'radio',
  'range',
  'reset',
  'submit',
]);

/** Text entry keeps Cmd/Ctrl+Z to itself; a focused top-bar radio or button does not. */
const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLInputElement && !NON_TEXT_INPUTS.has(target.type)));

/** The preview document: the page and locale it was opened for, and the token in its URL. */
interface Frame {
  path: string;
  locale: Locale;
  token: string;
  src: string;
  /** Bumped to load the same page again (the iframe's key). */
  reloads: number;
}

const openFrame = (path: string, locale: Locale, token: string, reloads = 0): Frame => ({
  path,
  locale,
  token,
  src: frameSrc(path, locale, token),
  reloads,
});

/**
 * «Сайт»: the real site in a draft-preview iframe with an editing overlay, drawers for
 * cards and sections, undo, reset and publish (docs/visual-editor.md §6).
 */
export function SitePage() {
  const { user } = useAuth();
  const { toast, show: showToast, dismiss: dismissToast } = useToast();
  const draft = useDraft({
    onSaveError: () => showToast('Не удалось сохранить изменения'),
    // The bridge wrote the failed texts into the preview itself, and a refresh leaves them
    // there (React sees no prop change): put the server's values back first.
    onResync: (failed, serverTree) => {
      for (const patch of failed) {
        if (patch.op === 'set') restorePreview(patch.path, getAtPath(serverTree, patch.path));
      }
      refreshPreview();
    },
  });
  const previewToken = usePreviewToken();
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [pageKind, setPageKind] = useState<PageKind>('home');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [mode, setMode] = useState<CmsEditorMode>('edit');
  const [device, setDevice] = useState<Device>('desktop');
  const [drawer, setDrawer] = useState<DrawerTarget | null>(null);
  const [picker, setPicker] = useState<((url: string) => void) | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const { tree } = draft;
  const page = tree ? resolvePage(tree, pageKind, projectId) : null;
  const path = page && pagePath(page);
  const token = previewToken.data?.token;

  // The token is captured when the page or locale changes: a re-issued token alone never
  // reloads the preview. A slug edit waits for its PATCH so the new URL exists in the draft.
  const [frame, setFrame] = useState<Frame | null>(null);
  if (path && token && !draft.pending && (frame?.path !== path || frame.locale !== locale)) {
    setFrame(openFrame(path, locale, token));
  }

  const dialogOpen = drawer !== null || picker !== null || resetOpen;

  // ─── Changes ───────────────────────────────────────────────────────────────

  const strayReloads = useRef(0);
  const bridge = useBridge(iframeRef, {
    src: frame?.src ?? null,
    mode,
    onReady: (ready) => {
      if (!frame || !token) return false;
      const expected =
        ready.pathname === localizedPath(frame.path, frame.locale) && ready.locale === frame.locale;
      if (!expected && strayReloads.current < MAX_STRAY_RELOADS) {
        // The preview navigated by itself (e.g. the site's language switch): back to the page picked in the top bar.
        strayReloads.current += 1;
        setFrame(openFrame(frame.path, frame.locale, token, frame.reloads + 1));
        return false;
      }
      strayReloads.current = 0;
      if (token !== frame.token) bridge.send({ type: 'preview-token', token });
      return true;
    },
    onCommit: ({ path: fieldPath, value }) => {
      const parsed = parseCmsPath(fieldPath);
      const index = parsed?.kind === 'field' || parsed?.kind === 'itemField' ? parsed.index : null;
      if (index !== null && value.trim() === '') {
        removeListEntry(fieldPath, index);
        return;
      }
      // Other copies of the same text (header + footer) update at once.
      bridge.send({ type: 'patch', path: fieldPath, value });
      change([{ op: 'set', path: fieldPath, value }], 'Текст');
    },
    onOpenField: ({ path: fieldPath }) => openPath(fieldPath),
    onAdd: ({ collection }) => void addItem(collection),
    onShowSection: ({ section }) => setSectionHidden(section, false),
  });
  const { send: sendToPreview, store: bridgeStore } = bridge;
  const frameReady = useBridgeState(bridgeStore, (state) => state.ready);

  // A re-issued token renews the preview cookie in place; 'ready' covers a document still loading.
  useEffect(() => {
    if (token && frame && token !== frame.token && bridgeStore.get().ready) {
      sendToPreview({ type: 'preview-token', token });
    }
  }, [bridgeStore, frame, sendToPreview, token]);

  const refreshQueued = useRef(false);
  /**
   * `router.refresh()` in the preview once the PATCH queue drains — after every change, as
   * the bridge cannot patch split values (`data-cms-value`) or anything structural itself.
   */
  const refreshPreview = () => {
    if (refreshQueued.current) return;
    refreshQueued.current = true;
    void draft.whenIdle().then(() => {
      refreshQueued.current = false;
      bridge.send({ type: 'refresh' });
    });
  };

  /** Applies a change and schedules the preview refresh; returns the history entry id. */
  const change = (patches: ContentPatch[], label: string) => {
    const entryId = draft.apply(patches, label);
    if (entryId !== null) refreshPreview();
    return entryId;
  };

  /** Optimistic text in the preview for every string `set`, ahead of the refresh. */
  const previewText = (patches: readonly ContentPatch[]) => {
    for (const patch of patches) {
      if (patch.op === 'set' && typeof patch.value === 'string') {
        bridge.send({ type: 'patch', path: patch.path, value: patch.value });
      }
    }
  };

  /** `value` back into the preview's text at `fieldPath`, entry by entry for a string list. */
  const restorePreview = (fieldPath: string, value: unknown) => {
    if (typeof value === 'string') bridge.send({ type: 'patch', path: fieldPath, value });
    else if (Array.isArray(value))
      value.forEach((entry, index) => restorePreview(`${fieldPath}.${index}`, entry));
  };

  /** A list entry cleared inline (a ✓ bullet, a pill) is removed instead of saved blank. */
  const removeListEntry = (entryPath: string, index: number) => {
    const listPath = entryPath.slice(0, entryPath.lastIndexOf('.'));
    const list = tree && getAtPath(tree, listPath);
    if (!Array.isArray(list) || index >= list.length) return;
    const next: string[] = list.filter((_, i) => i !== index);
    // The later entries move up at once; the refresh drops the last one.
    next
      .slice(index)
      .forEach((entry, offset) => restorePreview(`${listPath}.${index + offset}`, entry));
    change([{ op: 'set', path: listPath, value: next }], 'Удаление пункта');
  };

  const openPath = (fieldPath: string) => {
    const target = drawerTargetForPath(fieldPath);
    if (target) setDrawer(target);
  };

  const undo = () => {
    const entry = draft.undo();
    if (!entry) return;
    dismissToast();
    previewText(entry.inverse);
    refreshPreview();
  };

  const addItem = async (collection: CollectionKey) => {
    if (!tree) return;
    const node = collectionSchema(collection).blank({ page: page?.kind ?? 'home' });
    const label = `Новая карточка: ${collectionSchema(collection).noun}`;
    if (change([{ op: 'insert', path: collection, value: node }], label) === null) return;
    const key = cmsNodeKey.item(collection, node.id);
    if (await bridge.waitForNode(key, ADD_WAIT_MS)) bridge.send({ type: 'scroll-to', key });
    setDrawer({ kind: 'item', collection, id: node.id });
  };

  const removeItem = ({ collection, id }: ItemDrawerTarget) => {
    const item = tree && findItem(tree, collection, id);
    if (!item) return;
    const label = targetLabel({ kind: 'item', collection, id }, tree);
    setDrawer(null);
    const entryId = change(
      [{ op: 'remove', path: cmsPath.item(collection, id) }],
      `Удаление: ${label}`,
    );
    if (entryId !== null) {
      showToast(`Удалено: «${collectionSchema(collection).title(item, DEFAULT_LOCALE)}»`, entryId);
    }
  };

  const setSectionHidden = (section: HomeSectionKey, hidden: boolean) => {
    if (!tree) return;
    const label = CMS_SECTION_LABELS[section];
    const entryId = change([hiddenSectionPatch(tree, section, hidden)], `Секция «${label}»`);
    if (entryId !== null) {
      showToast(hidden ? `Секция «${label}» скрыта` : `Секция «${label}» снова видна`, entryId);
    }
  };

  const itemTarget = (node: CmsNode): ItemDrawerTarget | null =>
    node.collection && node.id ? { kind: 'item', collection: node.collection, id: node.id } : null;

  const overlayActions: OverlayActions = {
    onEditItem: (node) => setDrawer(itemTarget(node)),
    onDuplicateItem: (node) => {
      const target = itemTarget(node);
      if (!tree || !target) return;
      const items: readonly CollectionNode[] = tree[target.collection];
      const index = items.findIndex(({ id }) => id === target.id);
      if (index < 0) return;
      const copy = collectionSchema(target.collection).duplicate(items[index]);
      const entryId = change(
        [{ op: 'insert', path: target.collection, value: copy, index: index + 1 }],
        `Копия: ${targetLabel(target, tree)}`,
      );
      if (entryId !== null) showToast('Карточка скопирована', entryId);
    },
    onDeleteItem: (node) => {
      const target = itemTarget(node);
      if (target) removeItem(target);
    },
    onMoveItem: (node, neighbour) => {
      const target = itemTarget(node);
      if (!tree || !target) return;
      const items: readonly CollectionNode[] = tree[target.collection];
      const index = items.findIndex(({ id }) => id === neighbour.id);
      if (index < 0) return;
      change(
        [{ op: 'move', path: cmsPath.item(target.collection, target.id), value: index }],
        `Порядок: ${targetLabel(target, tree)}`,
      );
    },
    onEditSection: (node) => {
      if (!node.section) return;
      if (!SECTION_SCHEMAS[node.section].item) {
        setDrawer({ kind: 'section', section: node.section });
        return;
      }
      // The case page's chip edits the project it renders.
      const ref = node.sectionItem ? parseCmsItemRef(node.sectionItem) : null;
      if (ref) setDrawer({ kind: 'item', ...ref });
    },
    onHideSection: (node) => {
      if (node.section && isHideableSection(node.section)) setSectionHidden(node.section, true);
    },
    onReplaceImage: ({ path: imagePath }) => {
      if (!imagePath) return;
      setPicker(() => (url: string) => {
        if (change([{ op: 'set', path: imagePath, value: url }], 'Фото') !== null)
          showToast('Фото обновлено');
      });
    },
    onWheelScroll: (dx, dy) => sendToPreview({ type: 'scroll-by', dx, dy }),
  };

  // ─── Drawer & picker ───────────────────────────────────────────────────────

  const closeDrawer = useCallback(() => setDrawer(null), []);
  const closePicker = useCallback(() => setPicker(null), []);
  const pickImage = useCallback((apply: (url: string) => void) => setPicker(() => apply), []);

  const saveDrawer = (patches: ContentPatch[], label: string) => {
    change(patches, label);
    previewText(patches);
    showToast('Сохранено в черновике');
  };

  // A dialog opened from the overlay loses its opener (the overlay unmounts under dialogs):
  // keep focus in the editor rather than on <body>. Runs after the dialog's own focus restore.
  const dialogWasOpen = useRef(false);
  useEffect(() => {
    if (dialogWasOpen.current && !dialogOpen && document.activeElement === document.body) {
      canvasRef.current?.focus();
    }
    dialogWasOpen.current = dialogOpen;
  }, [dialogOpen]);

  // ─── Reset & publish ───────────────────────────────────────────────────────

  const confirmReset = async () => {
    setResetting(true);
    try {
      await draft.reset();
      setDrawer(null);
      refreshPreview();
      showToast('Черновик сброшен к опубликованной версии');
    } catch {
      showToast('Не удалось сбросить черновик');
    } finally {
      setResetting(false);
      setResetOpen(false);
    }
  };

  const publish = async () => {
    setPublishing(true);
    try {
      const { warnings } = await draft.publish();
      refreshPreview();
      showToast(
        `Изменения опубликованы${warnings.length > 0 ? ` · EN не заполнено: ${warnings.length}` : ''}`,
      );
    } catch (error) {
      if (!(error instanceof PublishBlockedError) || !tree) {
        showToast('Не удалось опубликовать изменения');
        return;
      }
      const { errors } = error;
      const labels = errors
        .slice(0, PUBLISH_ISSUES_SHOWN)
        .map((issue) => labelForPath(issue.path, tree));
      const more =
        errors.length > PUBLISH_ISSUES_SHOWN
          ? ` и ещё ${errors.length - PUBLISH_ISSUES_SHOWN}`
          : '';
      showToast(`Нельзя опубликовать: заполните ${labels.join('; ')}${more}`);
      if (errors[0]) openPath(errors[0].path);
    } finally {
      setPublishing(false);
    }
  };

  // ─── Preview visibility ────────────────────────────────────────────────────

  // Hidden until the document has announced itself and got the editor mode, so «Просмотр»
  // never flashes edit affordances; one that loads and stays silent (an error page) shows anyway.
  const [strandedFrame, setStrandedFrame] = useState<Frame | null>(null);
  const graceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(graceTimer.current), []);
  const onFrameLoad = () => {
    clearTimeout(graceTimer.current);
    const loaded = frame;
    graceTimer.current = setTimeout(() => setStrandedFrame(loaded), READY_GRACE_MS);
  };
  const frameShown = frameReady || (frame !== null && strandedFrame === frame);

  // ─── Cmd/Ctrl+Z ────────────────────────────────────────────────────────────

  const onUndoShortcut = useRef<(event: KeyboardEvent) => void>(() => {});
  useLayoutEffect(() => {
    onUndoShortcut.current = (event) => {
      // `code`: the physical Z key, whatever the keyboard layout.
      if (
        event.code !== 'KeyZ' ||
        !(event.metaKey || event.ctrlKey) ||
        event.shiftKey ||
        event.altKey
      )
        return;
      if (
        event.defaultPrevented ||
        dialogOpen ||
        isTypingTarget(event.target) ||
        bridgeStore.get().editing
      )
        return;
      event.preventDefault();
      undo();
    };
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => onUndoShortcut.current(event);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────────

  const projects = tree
    ? caseProjects(tree).map((project) => ({
        id: project.id,
        title: collectionSchema('projects').title(project, DEFAULT_LOCALE),
      }))
    : [];
  // Until the tree loads, the page is the initial homepage.
  const pageTitle =
    page?.kind === 'case'
      ? `Кейс: ${collectionSchema('projects').title(page.project, DEFAULT_LOCALE)}`
      : PAGE_TITLES[page?.kind ?? 'home'];
  const enWarnings = tree
    ? (draft.issues?.warnings ?? []).map((issue) => ({
        path: issue.path,
        label: labelForPath(issue.path, tree),
      }))
    : [];
  // Only a first load that failed replaces the canvas; a failed background refetch keeps the preview.
  const loadFailed = draft.query.isLoadingError || previewToken.isLoadingError;
  const refetchFailed = draft.query.isRefetchError || previewToken.isRefetchError;
  const retry = () => {
    if (draft.query.isError) void draft.query.refetch();
    if (previewToken.isError) void previewToken.refetch();
  };

  return (
    <div ref={rootRef} className={cx(editorRoot, styles.root)}>
      <TopBar
        pageTitle={pageTitle}
        pageKind={page?.kind ?? pageKind}
        onPageKindChange={setPageKind}
        projects={projects}
        projectId={page?.kind === 'case' ? page.project.id : null}
        onProjectChange={setProjectId}
        locale={locale}
        onLocaleChange={setLocale}
        mode={mode}
        onModeChange={setMode}
        device={device}
        onDeviceChange={setDevice}
        undoLabel={draft.lastEntry?.label ?? null}
        onUndo={undo}
        changes={draft.changes}
      />
      {user && <OnboardingStrip userId={user.id} hidden={mode === 'view'} />}

      <div ref={canvasRef} tabIndex={-1} className={styles.canvas}>
        {loadFailed ? (
          <div role="alert" className={styles.state}>
            Не удалось загрузить сайт.
            <Button variant="ghost" size="sm" onClick={retry}>
              Повторить
            </Button>
          </div>
        ) : frame ? (
          <div className={cx(styles.frame, device === 'phone' && styles.phone)}>
            {!frameShown && (
              <p role="status" className={styles.frameState}>
                Загружаем сайт…
              </p>
            )}
            <iframe
              key={frame.reloads}
              ref={iframeRef}
              src={frame.src}
              title="Предпросмотр сайта"
              className={cx(styles.iframe, !frameShown && styles.iframeLoading)}
              onLoad={onFrameLoad}
            />
            {mode === 'edit' && !dialogOpen && <Overlay store={bridgeStore} {...overlayActions} />}
          </div>
        ) : (
          <p role="status" className={styles.state}>
            Загружаем сайт…
          </p>
        )}
        {refetchFailed && !loadFailed && (
          <div role="alert" className={styles.banner}>
            Не удалось обновить данные с сервера.
            <Button variant="ghost" size="sm" onClick={retry}>
              Повторить
            </Button>
          </div>
        )}
      </div>

      {draft.changes > 0 && (
        <BottomBar
          changes={draft.changes}
          enWarnings={enWarnings}
          publishing={publishing}
          onReset={() => setResetOpen(true)}
          onPublish={() => void publish()}
          onOpenWarning={openPath}
        />
      )}

      <Toast
        toast={toast}
        canUndo={toast?.undoEntryId != null && toast.undoEntryId === draft.lastEntry?.id}
        onUndo={undo}
        raised={draft.changes > 0}
        besideDrawer={drawer !== null}
        anchor={rootRef}
      />
      {tree && (
        <EditorDrawer
          target={drawer}
          tree={tree}
          onSave={saveDrawer}
          onDelete={removeItem}
          onClose={closeDrawer}
          onPickImage={pickImage}
        />
      )}
      <MediaPickerModal
        open={picker !== null}
        onPick={(url) => picker?.(url)}
        onClose={closePicker}
      />
      <ResetDialog
        open={resetOpen}
        busy={resetting}
        onCancel={() => setResetOpen(false)}
        onConfirm={() => void confirmReset()}
      />
    </div>
  );
}
