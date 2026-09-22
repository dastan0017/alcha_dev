import {
  CMS_REQUIRED_FIELDS,
  COLLECTION_KEYS,
  DEFAULT_LOCALE,
  LOCALES,
  MAX_PROCESS_STEPS,
  PROJECT_SLUG_PATTERN,
  type CmsIssue,
  type CmsScope,
  type SiteTree,
} from '@alcha/shared';

export interface TreeIssues {
  errors: CmsIssue[];
  warnings: CmsIssue[];
}

const MESSAGES = {
  required: 'Обязательное поле не заполнено',
  requiredEn: 'Не заполнено на английском — на сайте будет показан русский текст',
  slugFormat: 'Адрес проекта: строчные латинские буквы и цифры, слова через дефис',
  slugTaken: (slug: string) => `Адрес «${slug}» уже занят другим проектом`,
  tooManySteps: `Шагов больше ${MAX_PROCESS_STEPS}: на компьютере они не помещаются в одну строку — удалите лишний`,
};

/** Empty or whitespace-only: what publish treats as a missing required value. */
export function isBlank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim() === '';
}

/**
 * Publish checks (docs/visual-editor.md §3): a blank required RU or neutral field, a
 * malformed or duplicate project slug and a process step past MAX_PROCESS_STEPS are errors;
 * a blank required EN field is a warning.
 */
export function validateTree(tree: SiteTree): TreeIssues {
  const issues: TreeIssues = { errors: [], warnings: [] };
  checkRequired(issues, 'home', 'home', tree.home);
  checkRequired(issues, 'chrome', 'chrome', tree.chrome);
  for (const collection of COLLECTION_KEYS) {
    for (const node of tree[collection]) {
      checkRequired(issues, collection, `${collection}.${node.id}`, node);
    }
  }
  checkSlugs(issues, tree.projects);
  // Only published steps render, so only they count.
  const shown = tree.steps.filter((step) => step.published);
  for (const { id } of shown.slice(MAX_PROCESS_STEPS)) {
    issues.errors.push({ path: `steps.${id}`, locale: null, message: MESSAGES.tooManySteps });
  }
  return issues;
}

function checkRequired(
  issues: TreeIssues,
  scope: CmsScope,
  path: string,
  owner: Record<string, unknown>,
): void {
  const required: { neutral: readonly string[]; localized: readonly string[] } =
    CMS_REQUIRED_FIELDS[scope];
  for (const field of required.neutral) {
    if (isBlank(owner[field])) {
      issues.errors.push({ path: `${path}.${field}`, locale: null, message: MESSAGES.required });
    }
  }
  for (const locale of LOCALES) {
    const copy = owner[locale] as Record<string, unknown>;
    const isDefault = locale === DEFAULT_LOCALE;
    for (const field of required.localized) {
      if (!isBlank(copy[field])) continue;
      (isDefault ? issues.errors : issues.warnings).push({
        path: `${path}.${locale}.${field}`,
        locale,
        message: isDefault ? MESSAGES.required : MESSAGES.requiredEn,
      });
    }
  }
}

function checkSlugs(issues: TreeIssues, projects: SiteTree['projects']): void {
  const counts = new Map<string, number>();
  for (const { slug } of projects) counts.set(slug, (counts.get(slug) ?? 0) + 1);

  for (const { id, slug } of projects) {
    // A blank slug is already reported as a required field.
    if (isBlank(slug)) continue;
    const path = `projects.${id}.slug`;
    if (!PROJECT_SLUG_PATTERN.test(slug)) {
      issues.errors.push({ path, locale: null, message: MESSAGES.slugFormat });
    } else if ((counts.get(slug) ?? 0) > 1) {
      issues.errors.push({ path, locale: null, message: MESSAGES.slugTaken(slug) });
    }
  }
}
