import {
  CMS_ATTR,
  CMS_SECTION_LABELS,
  cmsItemRef,
  cmsPath,
  type CmsListLayout,
  type CmsLocalizedField,
  type CmsNeutralField,
  type CmsSectionKey,
  type CollectionKey,
  type Locale,
} from '@alcha/shared';

/**
 * Target href on controls that switch the locale client-side (LocaleSwitch, EnLocaleHint),
 * which the preview bridge blocks like cross-page links. Rendered for visitors too, so it
 * is not a `data-cms-*` attribute.
 */
export const LOCALE_NAV_ATTR = 'data-locale-nav';

/** Preview-only `data-cms-*` attributes, spread onto the annotated element. */
export type CmsAttrs = { [attr: `data-cms-${string}`]: string };

export interface CmsFieldOptions {
  /** Enter inserts a newline; the element renders with `white-space: pre-line`. */
  multiline?: boolean;
  /** The stored value, when the rendered text differs from it. */
  value?: string;
  /** Not editable inline: a click opens the field's section drawer in the CRM. */
  rich?: boolean;
}

export interface CmsSectionOptions {
  hideable?: boolean;
  /** `<collection>:<id>` of the item the section renders (cmsItemRef). */
  item?: string;
}

type AttrEntry = readonly [
  attr: (typeof CMS_ATTR)[keyof typeof CMS_ATTR],
  value: string | undefined,
];

const flag = (on?: boolean) => (on ? '' : undefined);

/**
 * Visual-editor annotations (docs/visual-editor.md §4). Attribute helpers return `{}`
 * unless preview is enabled, so public HTML is unchanged; path helpers bind the page
 * locale. Plain functions — usable from server and client components.
 */
export function cmsAttrs(enabled: boolean, locale: Locale) {
  const attrs = (...entries: AttrEntry[]): CmsAttrs => {
    const result: CmsAttrs = {};
    if (!enabled) return result;
    for (const [attr, value] of entries) {
      if (value !== undefined) result[attr] = value;
    }
    return result;
  };

  return {
    enabled,
    field: (path: string, { multiline, value, rich }: CmsFieldOptions = {}) =>
      attrs(
        [CMS_ATTR.field, path],
        [CMS_ATTR.multiline, flag(multiline)],
        [CMS_ATTR.value, value],
        [CMS_ATTR.rich, flag(rich)],
      ),
    image: (path: string) => attrs([CMS_ATTR.image, path]),
    item: (collection: CollectionKey, id: string) =>
      attrs([CMS_ATTR.item, cmsItemRef(collection, id)]),
    list: (collection: CollectionKey, layout: CmsListLayout) =>
      attrs([CMS_ATTR.list, collection], [CMS_ATTR.listLayout, layout]),
    section: (key: CmsSectionKey, { hideable, item }: CmsSectionOptions = {}) =>
      attrs(
        [CMS_ATTR.section, key],
        [CMS_ATTR.sectionLabel, CMS_SECTION_LABELS[key]],
        [CMS_ATTR.sectionHideable, flag(hideable)],
        [CMS_ATTR.sectionItem, item],
      ),

    home: (field: CmsLocalizedField<'home'>, index?: number) => cmsPath.home(locale, field, index),
    about: (field: CmsLocalizedField<'about'>) => cmsPath.about(locale, field),
    aboutNeutral: (field: CmsNeutralField<'about'>) => cmsPath.aboutNeutral(field),
    chrome: (field: CmsLocalizedField<'chrome'>) => cmsPath.chrome(locale, field),
    itemLocale: <C extends CollectionKey>(
      collection: C,
      id: string,
      field: CmsLocalizedField<C>,
      index?: number,
    ) => cmsPath.itemLocale(collection, id, locale, field, index),
    itemField: <C extends CollectionKey>(
      collection: C,
      id: string,
      field: CmsNeutralField<C>,
      index?: number,
    ) => cmsPath.itemField(collection, id, field, index),
  };
}

export type Cms = ReturnType<typeof cmsAttrs>;
