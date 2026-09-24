import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_LABELS,
  applyPatches,
  exclusiveFlagPatches,
  getAtPath,
  type CmsFlagField,
  normalizeFacts,
  type CollectionKey,
  type ContentPatch,
  type Locale,
  type ProjectFact,
  type SiteTree,
} from '@alcha/shared';
import { Button, Dialog, IconButton, cx, srOnly } from '../ui';
import {
  COLLECTION_SCHEMAS,
  SECTION_SCHEMAS,
  collectionSchema,
  fieldPath,
  findItem,
  isRequired,
  targetLabel,
  type DrawerTarget,
  type FieldSchema,
  type ItemDrawerTarget,
} from '../schemas';
import { BooleanField } from './fields/BooleanField';
import { FactsField } from './fields/FactsField';
import { ImageField } from './fields/ImageField';
import { ImagesField } from './fields/ImagesField';
import { SelectField } from './fields/SelectField';
import { StringListField } from './fields/StringListField';
import { TagsField } from './fields/TagsField';
import { TextField } from './fields/TextField';
import { TextareaField } from './fields/TextareaField';
import styles from './EditorDrawer.module.css';

export interface EditorDrawerProps {
  /** What to edit; null keeps the drawer closed. */
  target: DrawerTarget | null;
  tree: SiteTree;
  /**
   * The changed fields as minimal patches, with a label such as «Тариф «Лендинг»» for
   * history and toasts. Called on «Сохранить» only when something changed; `onClose` follows.
   */
  onSave: (patches: ContentPatch[], label: string) => void;
  /** Shows «Удалить» on items. The drawer closes by itself once the item leaves `tree`. */
  onDelete?: (target: ItemDrawerTarget) => void;
  onClose: () => void;
  /** Open the media picker and call `apply` with the chosen URL. */
  onPickImage: (apply: (url: string) => void) => void;
}

type FieldValue = string | string[] | ProjectFact[] | boolean | null;
type Values = Record<string, FieldValue>;
type ValueUpdate = FieldValue | ((current: FieldValue) => FieldValue);

/** One control: a field in one locale (`locale` is null for language-neutral fields). */
interface Slot {
  field: FieldSchema;
  locale: Locale | null;
  path: string;
}

/** DOM id of a path's control; `controlId(listPath) + '.' + index` equals `controlId(entryPath)`. */
const controlId = (path: string) => `cms-field:${path}`;

/**
 * Right-hand drawer that edits one collection item or one section in both locales. Form state
 * is local and starts from `tree` when a target opens; «Отмена», Esc and the scrim discard it.
 */
export function EditorDrawer({ target, tree, onClose, ...handlers }: EditorDrawerProps) {
  const missing = target?.kind === 'item' && !findItem(tree, target.collection, target.id);

  // The item was deleted or undone while the drawer was open.
  useEffect(() => {
    if (missing) onClose();
  }, [missing, onClose]);

  if (!target || missing) return null;
  const key =
    target.kind === 'item' ? `item:${target.collection}:${target.id}` : `section:${target.section}`;
  return <DrawerPanel key={key} target={target} tree={tree} onClose={onClose} {...handlers} />;
}

type DrawerPanelProps = Omit<EditorDrawerProps, 'target'> & { target: DrawerTarget };

function DrawerPanel({ target, tree, onSave, onDelete, onClose, onPickImage }: DrawerPanelProps) {
  const titleId = useId();
  const bodyRef = useRef<HTMLDivElement>(null);
  const fields =
    target.kind === 'item'
      ? COLLECTION_SCHEMAS[target.collection].fields
      : SECTION_SCHEMAS[target.section].fields;
  const [initial] = useState(() => readValues(tree, target, fields));
  const [values, setValues] = useState(initial);

  const update = (path: string, next: ValueUpdate) =>
    setValues((current) => ({
      ...current,
      [path]: typeof next === 'function' ? next(current[path]) : next,
    }));

  const patches = diffPatches(tree, target, fields, initial, values);
  const errors = validationErrors(target, fields, values);
  const draftTree = patches.length > 0 ? applyPatches(tree, patches).tree : tree;
  const heading = drawerHeading(draftTree, target);

  const save = () => {
    const [invalidPath] = Object.keys(errors);
    if (invalidPath) {
      document.getElementById(controlId(invalidPath))?.focus();
      return;
    }
    if (patches.length > 0) onSave(patches, targetLabel(target, draftTree));
    onClose();
  };

  const initialFocus = () => {
    const { focusPath } = target;
    // A list entry that no longer exists falls back to its list.
    const control =
      focusPath &&
      (document.getElementById(controlId(focusPath)) ??
        document.getElementById(controlId(focusPath.replace(/\.\d+$/, ''))));
    return control || bodyRef.current;
  };

  return (
    <Dialog
      open
      placement="right"
      labelledBy={titleId}
      initialFocus={initialFocus}
      className={styles.panel}
      onClose={onClose}
    >
      <header className={styles.header}>
        <div className={styles.heading}>
          <p className={styles.kind}>{heading.kind}</p>
          <h2 id={titleId} className={styles.title}>
            {heading.title}
          </h2>
        </div>
        <IconButton aria-label="Закрыть" onClick={onClose}>
          ✕
        </IconButton>
      </header>

      <div ref={bodyRef} className={styles.body}>
        {fields.map((field) => (
          <FieldBlock
            key={`${field.scope ?? target.kind}.${field.key}`}
            target={target}
            field={field}
            values={values}
            errors={errors}
            update={update}
            onPickImage={onPickImage}
          />
        ))}
      </div>

      <footer className={styles.footer}>
        {onDelete && target.kind === 'item' && (
          <Button variant="danger" onClick={() => onDelete(target)}>
            Удалить
          </Button>
        )}
        <Button variant="subtle" className={styles.cancel} onClick={onClose}>
          Отмена
        </Button>
        <Button variant="primary" onClick={save}>
          Сохранить
        </Button>
      </footer>
    </Dialog>
  );
}

interface FieldBlockProps {
  target: DrawerTarget;
  field: FieldSchema;
  values: Values;
  errors: Record<string, string>;
  update: (path: string, next: ValueUpdate) => void;
  onPickImage: EditorDrawerProps['onPickImage'];
}

/** A field's caption and controls; localized fields stack RU above EN under a shared caption. */
function FieldBlock({ target, field, values, errors, update, onPickImage }: FieldBlockProps) {
  const captionId = useId();
  const required = isRequired(target, field);
  const slots = slotsOf(target, field);

  const control = (slot: Slot, label: ReactNode) => (
    <FieldControl
      key={slot.path}
      slot={slot}
      label={label}
      value={values[slot.path]}
      error={errors[slot.path]}
      required={required && slot.locale !== 'en'}
      update={update}
      onPickImage={onPickImage}
    />
  );

  if (!field.localized)
    return control(slots[0], <Caption label={field.label} required={required} />);

  return (
    <div role="group" aria-labelledby={captionId} className={styles.localized}>
      <Caption id={captionId} label={field.label} required={required} />
      {slots.map((slot) =>
        control(
          slot,
          <LocaleBadge
            locale={slot.locale ?? DEFAULT_LOCALE}
            fieldLabel={field.label}
            blank={isBlank(values[slot.path])}
          />,
        ),
      )}
    </div>
  );
}

function Caption({ id, label, required }: { id?: string; label: string; required: boolean }) {
  return (
    <span id={id} className={styles.caption}>
      {label}
      {required && (
        <>
          <span aria-hidden="true" className={styles.required}>
            *
          </span>
          <span className={srOnly}>, обязательное поле</span>
        </>
      )}
    </span>
  );
}

function LocaleBadge({
  locale,
  fieldLabel,
  blank,
}: {
  locale: Locale;
  fieldLabel: string;
  blank: boolean;
}) {
  const missing = locale !== DEFAULT_LOCALE && blank;
  return (
    <span className={cx(styles.badge, missing && styles.badgeMissing)}>
      <span className={srOnly}>{fieldLabel}, </span>
      {LOCALE_LABELS[locale]}
      {missing && ' · не заполнено'}
    </span>
  );
}

interface FieldControlProps {
  slot: Slot;
  label: ReactNode;
  value: FieldValue;
  error: string | undefined;
  required: boolean;
  update: (path: string, next: ValueUpdate) => void;
  onPickImage: EditorDrawerProps['onPickImage'];
}

function FieldControl({
  slot: { field, path },
  label,
  value,
  error,
  required,
  update,
  onPickImage,
}: FieldControlProps) {
  const id = controlId(path);
  const set = (next: ValueUpdate) => update(path, next);

  switch (field.type) {
    case 'text':
      return (
        <TextField
          id={id}
          label={label}
          value={asText(value)}
          placeholder={field.hint}
          error={error}
          required={required}
          onChange={set}
        />
      );
    case 'textarea':
      return (
        <TextareaField
          id={id}
          label={label}
          value={asText(value)}
          placeholder={field.hint}
          required={required}
          onChange={set}
        />
      );
    case 'list':
      return (
        <StringListField
          id={id}
          label={label}
          value={asList(value)}
          addLabel={field.addLabel}
          marker={field.marker}
          onChange={set}
        />
      );
    case 'facts':
      return (
        <FactsField
          id={id}
          label={label}
          value={asFacts(value)}
          addLabel={field.addLabel}
          onChange={set}
        />
      );
    case 'tags':
      return <TagsField id={id} label={label} value={asList(value)} onChange={set} />;
    case 'image':
      return (
        <ImageField
          id={id}
          label={label}
          value={typeof value === 'string' ? value : null}
          onChange={set}
          onPick={() => onPickImage(set)}
        />
      );
    case 'images':
      return (
        <ImagesField
          id={id}
          label={label}
          value={asList(value)}
          onChange={set}
          onAdd={() => onPickImage((url) => set((current) => [...asList(current), url]))}
        />
      );
    case 'boolean':
      return (
        <BooleanField
          id={id}
          label={label}
          value={value === true}
          onLabel={field.onLabel}
          offLabel={field.offLabel}
          onChange={set}
        />
      );
    case 'select':
      return (
        <SelectField
          id={id}
          label={label}
          value={asText(value)}
          options={field.options ?? []}
          onChange={set}
        />
      );
  }
}

// ─── Form state ──────────────────────────────────────────────────────────────

const asText = (value: FieldValue) => (typeof value === 'string' ? value : '');
const asList = (value: FieldValue): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];

const asFacts = (value: FieldValue): ProjectFact[] =>
  Array.isArray(value) ? value.filter((entry): entry is ProjectFact => isFact(entry)) : [];

const isFact = (value: unknown): value is ProjectFact =>
  typeof value === 'object' && value !== null && typeof (value as ProjectFact).text === 'string';

const isBlank = (value: FieldValue) =>
  Array.isArray(value)
    ? value.length === 0
    : typeof value === 'string'
      ? value.trim() === ''
      : value === null;

const sameEntry = (a: unknown, b: unknown) =>
  isFact(a) && isFact(b) ? a.text === b.text && (a.lead ?? '') === (b.lead ?? '') : a === b;

const sameValue = (a: FieldValue, b: FieldValue) =>
  Array.isArray(a) && Array.isArray(b)
    ? a.length === b.length && a.every((entry, i) => sameEntry(entry, b[i]))
    : a === b;

function slotsOf(target: DrawerTarget, field: FieldSchema): Slot[] {
  return field.localized
    ? LOCALES.map((locale) => ({ field, locale, path: fieldPath(target, field, locale) }))
    : [{ field, locale: null, path: fieldPath(target, field, DEFAULT_LOCALE) }];
}

function toFieldValue(field: FieldSchema, raw: unknown): FieldValue {
  switch (field.type) {
    case 'boolean':
      return raw === true;
    case 'image':
      return typeof raw === 'string' ? raw : null;
    case 'facts':
      return Array.isArray(raw) ? raw.filter(isFact) : [];
    case 'list':
    case 'tags':
    case 'images':
      return Array.isArray(raw)
        ? raw.filter((entry): entry is string => typeof entry === 'string')
        : [];
    default:
      return typeof raw === 'string' ? raw : '';
  }
}

function readValues(tree: SiteTree, target: DrawerTarget, fields: readonly FieldSchema[]): Values {
  return Object.fromEntries(
    fields.flatMap((field) =>
      slotsOf(target, field).map(({ path }) => [path, toFieldValue(field, getAtPath(tree, path))]),
    ),
  );
}

/** Blank bullet entries are dropped rather than published as empty ✓ lines. */
function normalize(field: FieldSchema, value: FieldValue): FieldValue {
  if (!Array.isArray(value)) return value;
  if (field.type === 'facts') return normalizeFacts(asFacts(value));
  if (field.type === 'list') return asList(value).filter((entry) => entry.trim() !== '');
  return value;
}

/** One `set` per changed leaf (whole lists); an exclusive flag also clears it on the other items. */
function diffPatches(
  tree: SiteTree,
  target: DrawerTarget,
  fields: readonly FieldSchema[],
  initial: Values,
  values: Values,
): ContentPatch[] {
  return fields.flatMap((field) =>
    slotsOf(target, field).flatMap(({ path }): ContentPatch[] => {
      const value = normalize(field, values[path]);
      if (sameValue(value, normalize(field, initial[path]))) return [];
      if (field.exclusive && target.kind === 'item' && typeof value === 'boolean') {
        const flag = field.key as CmsFlagField<CollectionKey>;
        return exclusiveFlagPatches(tree, target.collection, target.id, flag, value);
      }
      return [{ op: 'set', path, value }];
    }),
  );
}

function validationErrors(target: DrawerTarget, fields: readonly FieldSchema[], values: Values) {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    if (!field.validate) continue;
    for (const { path } of slotsOf(target, field)) {
      const value = values[path];
      const error = typeof value === 'string' ? field.validate(value) : null;
      if (error) errors[path] = error;
    }
  }
  return errors;
}

function drawerHeading(tree: SiteTree, target: DrawerTarget): { kind: string; title: string } {
  if (target.kind === 'section')
    return { kind: 'СЕКЦИЯ', title: SECTION_SCHEMAS[target.section].label };
  const schema = collectionSchema(target.collection);
  const item = findItem(tree, target.collection, target.id);
  return { kind: schema.kind, title: item ? schema.title(item, DEFAULT_LOCALE) : '' };
}
