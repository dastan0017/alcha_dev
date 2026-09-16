import { LOCALES, LOCALE_LABELS, type CmsEditorMode, type Locale } from '@alcha/shared';
import { Segmented, cx, type SegmentedOption } from '../ui';
import type { PageKind } from '../pages';
import styles from './TopBar.module.css';

export type Device = 'desktop' | 'phone';

const LOCALE_OPTIONS = LOCALES.map((locale) => ({ value: locale, label: LOCALE_LABELS[locale] }));

const MODE_OPTIONS: SegmentedOption<CmsEditorMode>[] = [
  { value: 'edit', label: 'Редактирование' },
  { value: 'view', label: 'Просмотр' },
];

const DEVICE_OPTIONS: SegmentedOption<Device>[] = [
  { value: 'desktop', label: 'Десктоп', title: 'Ширина 1240 px' },
  { value: 'phone', label: 'Телефон', title: 'Ширина 390 px' },
];

export interface TopBarProps {
  pageTitle: string;
  pageKind: PageKind;
  onPageKindChange: (kind: PageKind) => void;
  /** Projects with a case page, for «Кейс проекта». */
  projects: readonly { id: string; title: string }[];
  projectId: string | null;
  onProjectChange: (id: string) => void;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  mode: CmsEditorMode;
  onModeChange: (mode: CmsEditorMode) => void;
  device: Device;
  onDeviceChange: (device: Device) => void;
  /** Label of the change «Отменить» reverts; null when there is nothing to undo. */
  undoLabel: string | null;
  onUndo: () => void;
  changes: number;
}

/** The editor's dark top bar: breadcrumb, page switcher, locale / mode / device, undo and status. */
export function TopBar(props: TopBarProps) {
  const pageOptions: SegmentedOption<PageKind>[] = [
    { value: 'home', label: 'Главная' },
    { value: 'about', label: 'Обо мне' },
    {
      value: 'case',
      label: 'Кейс проекта',
      disabled: props.projects.length === 0,
      title: props.projects.length === 0 ? 'Нет опубликованных проектов' : undefined,
    },
  ];
  const drafted = props.changes > 0;

  return (
    <header className={styles.bar}>
      <div className={styles.crumbs}>
        <span className={styles.root}>Сайт alcha.dev</span>
        <span aria-hidden="true" className={styles.slash}>
          /
        </span>
        <h1 className={styles.page}>{props.pageTitle}</h1>
      </div>

      <div className={styles.group}>
        <Segmented
          variant="dark"
          aria-label="Страница"
          value={props.pageKind}
          options={pageOptions}
          onChange={props.onPageKindChange}
        />
        {props.pageKind === 'case' && props.projectId && (
          <select
            aria-label="Проект"
            className={styles.select}
            value={props.projectId}
            onChange={(event) => props.onProjectChange(event.target.value)}
          >
            {props.projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className={cx(styles.group, styles.controls)}>
        <Segmented
          variant="dark"
          aria-label="Язык"
          value={props.locale}
          options={LOCALE_OPTIONS}
          onChange={props.onLocaleChange}
        />
        <Segmented
          variant="dark"
          aria-label="Режим"
          value={props.mode}
          options={MODE_OPTIONS}
          onChange={props.onModeChange}
        />
        <Segmented
          variant="dark"
          aria-label="Устройство"
          value={props.device}
          options={DEVICE_OPTIONS}
          onChange={props.onDeviceChange}
        />
        <button
          type="button"
          className={styles.undo}
          disabled={props.undoLabel === null}
          title={props.undoLabel === null ? 'Нечего отменять' : `Отменить: ${props.undoLabel}`}
          aria-keyshortcuts="Meta+Z Control+Z"
          onClick={props.onUndo}
        >
          <span aria-hidden="true">↶</span> Отменить
        </button>
        <span
          role="status"
          className={cx(styles.status, drafted ? styles.statusDraft : styles.statusLive)}
        >
          {drafted ? `Черновик · ${props.changes}` : 'Опубликовано'}
        </span>
      </div>
    </header>
  );
}
