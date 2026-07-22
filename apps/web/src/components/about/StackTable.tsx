import type { StackCategory } from '@alcha/shared';
import styles from './about.module.css';

export function StackTable({ heading, stack }: { heading: string; stack: StackCategory[] }) {
  if (stack.length === 0) return null;

  return (
    <section className="section">
      <div className="container">
        <h2 className={styles.sectionH2}>{heading}</h2>
        <div className={styles.stackList}>
          {stack.map((category) => (
            <div key={category.id} className={styles.stackRow}>
              <div className={styles.stackCat}>{category.title}</div>
              <ul className={styles.stackItems}>
                {category.items.map((item) => (
                  <li key={item} className="chip">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
