import { LOCALE_LABELS, type Locale, type ProjectShot, type ScreenshotDevice } from '@alcha/shared';
import { Button, IconButton, Segmented, cx, srOnly } from '../../ui';
import { entryControl, moveEntry, useEntryFocus } from './entries';
import styles from './fields.module.css';

/** One caption list the control edits alongside the pictures. */
export interface CaptionTrack {
  locale: Locale;
  value: string[];
  onChange: (value: string[]) => void;
}

export interface MediaRowsFieldProps {
  id: string;
  label: string;
  /** Picture URLs, or screenshots when the control also edits the device. */
  value: string[] | ProjectShot[];
  onChange: (value: string[] | ProjectShot[]) => void;
  /** Captions per locale, index-aligned with `value`; moved and removed with the pictures. */
  captions: CaptionTrack[];
  /** Opens the media picker and hands back the chosen URL. */
  onPick: (apply: (url: string) => void) => void;
  /** Screenshots also carry the frame a picture is shown in. */
  withDevice?: boolean;
  addLabel?: string;
  /** Caption placeholder, e.g. «Главная на телефоне». */
  hint?: string;
}

const DEVICES: { value: ScreenshotDevice; label: string }[] = [
  { value: 'desktop', label: 'Компьютер' },
  { value: 'mobile', label: 'Телефон' },
];

const fileName = (url: string) => url.split(/[?#]/)[0].split('/').pop() || url;

const srcOf = (entry: string | ProjectShot) => (typeof entry === 'string' ? entry : entry.src);

/**
 * Pictures and their captions as one list. The picture is language-neutral and the caption
 * is not, so they live in different places in the tree — editing them together is what keeps
 * row 3's caption on row 3's picture when a row is added, removed or moved.
 */
export function MediaRowsField({
  id,
  label,
  value,
  onChange,
  captions,
  onPick,
  withDevice = false,
  addLabel = 'Добавить фото',
  hint = 'Подпись под фото',
}: MediaRowsFieldProps) {
  const { rootRef, focusAfterChange } = useEntryFocus<HTMLDivElement>(value);
  const labelId = `${id}:label`;
  // A caption typed before its picture keeps its row, so the list is as long as the longer side.
  const rows = Math.max(value.length, ...captions.map((track) => track.value.length), 0);

  const blank = (): string | ProjectShot => (withDevice ? { src: '', device: 'desktop' } : '');

  /** Applies `edit` to the pictures and the same `edit` to every caption list. */
  const apply = (
    editPictures: (list: (string | ProjectShot)[]) => (string | ProjectShot)[],
    editCaptions: (list: string[]) => string[],
  ) => {
    const padded = Array.from({ length: rows }, (_, i) => value[i] ?? blank());
    onChange(editPictures(padded) as string[] | ProjectShot[]);
    for (const track of captions) {
      const paddedCaptions = Array.from({ length: rows }, (_, i) => track.value[i] ?? '');
      track.onChange(editCaptions(paddedCaptions));
    }
  };

  const insert = (index: number) => {
    focusAfterChange(entryControl(index, 'pick'));
    apply(
      (list) => [...list.slice(0, index), blank(), ...list.slice(index)],
      (list) => [...list.slice(0, index), '', ...list.slice(index)],
    );
  };

  const move = (from: number, to: number, control: 'up' | 'down') => {
    focusAfterChange(entryControl(to, control), entryControl(to, 'pick'));
    apply(
      (list) => moveEntry(list, from, to),
      (list) => moveEntry(list, from, to),
    );
  };

  const remove = (index: number) => {
    focusAfterChange(entryControl(Math.max(0, index - 1), 'pick'), '[data-control="add"]');
    apply(
      (list) => list.filter((_, i) => i !== index),
      (list) => list.filter((_, i) => i !== index),
    );
  };

  const setPicture = (index: number, src: string) =>
    apply(
      (list) => list.map((entry, i) => (i !== index ? entry : setSrc(entry, src))),
      (list) => list,
    );

  const setDevice = (index: number, device: ScreenshotDevice) =>
    apply(
      (list) =>
        list.map((entry, i) =>
          i !== index || typeof entry === 'string' ? entry : { ...entry, device },
        ),
      (list) => list,
    );

  const setCaption = (track: CaptionTrack, index: number, text: string) => {
    const padded = Array.from({ length: rows }, (_, i) => track.value[i] ?? '');
    track.onChange(padded.map((entry, i) => (i === index ? text : entry)));
  };

  return (
    <div ref={rootRef} id={id} role="group" aria-labelledby={labelId} className={styles.field}>
      <span id={labelId} className={styles.label}>
        {label}
      </span>
      {rows > 0 && (
        <ol className={styles.entries}>
          {Array.from({ length: rows }, (_, index) => {
            const entry = value[index] ?? blank();
            const src = srcOf(entry);
            return (
              <li key={index} id={`${id}.${index}`} className={styles.mediaRow}>
                <div className={styles.mediaRowTop}>
                  <span className={cx(styles.preview, styles.previewSmall)}>
                    {src ? (
                      <img src={src} alt="" />
                    ) : (
                      <span className={styles.previewEmpty}>—</span>
                    )}
                  </span>
                  <span title={src} className={styles.fileName}>
                    {src ? `${index + 1}. ${fileName(src)}` : `${index + 1}. нет фото`}
                  </span>
                  <Button
                    variant="ghost"
                    data-entry={index}
                    data-control="pick"
                    onClick={() => onPick((url) => setPicture(index, url))}
                  >
                    {src ? 'Заменить' : 'Выбрать'}
                  </Button>
                  <IconButton
                    aria-label={`Поднять фото ${index + 1}`}
                    data-entry={index}
                    data-control="up"
                    disabled={index === 0}
                    onClick={() => move(index, index - 1, 'up')}
                  >
                    ↑
                  </IconButton>
                  <IconButton
                    aria-label={`Опустить фото ${index + 1}`}
                    data-entry={index}
                    data-control="down"
                    disabled={index === rows - 1}
                    onClick={() => move(index, index + 1, 'down')}
                  >
                    ↓
                  </IconButton>
                  <IconButton
                    tone="danger"
                    aria-label={`Удалить фото ${index + 1}`}
                    data-entry={index}
                    data-control="remove"
                    onClick={() => remove(index)}
                  >
                    ✕
                  </IconButton>
                </div>

                {withDevice && typeof entry !== 'string' && (
                  <Segmented
                    aria-label={`Фото ${index + 1}, как показывать`}
                    value={entry.device}
                    options={DEVICES}
                    onChange={(device) => setDevice(index, device)}
                  />
                )}

                <div className={styles.mediaCaptions}>
                  {captions.map((track) => {
                    const captionId = `${id}.${index}.${track.locale}`;
                    return (
                      <div key={track.locale} className={styles.mediaCaption}>
                        <label htmlFor={captionId} className={styles.mediaCaptionBadge}>
                          <span className={srOnly}>{`Подпись к фото ${index + 1}, `}</span>
                          {LOCALE_LABELS[track.locale]}
                        </label>
                        <input
                          id={captionId}
                          type="text"
                          value={track.value[index] ?? ''}
                          placeholder={hint}
                          className={cx(styles.input, styles.entryInput)}
                          onChange={(event) => setCaption(track, index, event.target.value)}
                        />
                      </div>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <Button
        variant="ghost"
        data-control="add"
        className={styles.add}
        onClick={() => insert(rows)}
      >
        + {addLabel}
      </Button>
    </div>
  );
}

function setSrc(entry: string | ProjectShot, src: string): string | ProjectShot {
  return typeof entry === 'string' ? src : { ...entry, src };
}
