import type { Locale, StackCategory } from '@alcha/shared';
import { cmsAttrs } from '@/lib/cms';
import { CmsAddSlot } from '../preview/CmsAddSlot';
import { CmsHiddenSection } from '../preview/CmsHiddenSection';
import styles from './about.module.css';

export function StackTable({
  heading,
  stack,
  hidden,
  preview,
  locale,
}: {
  heading: string;
  stack: StackCategory[];
  hidden: boolean;
  preview: boolean;
  locale: Locale;
}) {
  const cms = cmsAttrs(preview, locale);
  if (hidden) return cms.enabled ? <CmsHiddenSection section="stack" variant="hidden" /> : null;
  if (stack.length === 0) {
    return cms.enabled ? (
      <CmsHiddenSection section="stack" variant="empty" collection="stack" />
    ) : null;
  }

  return (
    <section className="section" {...cms.section('stack', { hideable: true })}>
      <div className="container">
        <h2 className={styles.sectionH2} {...cms.field(cms.about('stackHeading'))}>
          {heading}
        </h2>
        <div className={styles.stackList} {...cms.list('stack', 'stack')}>
          {stack.map((category) => (
            <div key={category.id} className={styles.stackRow} {...cms.item('stack', category.id)}>
              <div
                className={styles.stackCat}
                {...cms.field(cms.itemLocale('stack', category.id, 'title'))}
              >
                {category.title}
              </div>
              <ul className={styles.stackItems}>
                {category.items.map((item, i) => (
                  <li
                    key={i}
                    className="chip"
                    {...cms.field(cms.itemField('stack', category.id, 'items', i))}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {cms.enabled && <CmsAddSlot collection="stack" className={styles.rowSlot} />}
        </div>
      </div>
    </section>
  );
}
