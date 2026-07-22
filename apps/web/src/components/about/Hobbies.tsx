import Image from 'next/image';
import type { HobbyCard } from '@alcha/shared';
import styles from './about.module.css';

export function Hobbies({ heading, hobbies }: { heading: string; hobbies: HobbyCard[] }) {
  if (hobbies.length === 0) return null;

  return (
    <section className="section">
      <div className="container">
        <h2 className={styles.sectionH2}>{heading}</h2>
        <div className={styles.hobbyGrid}>
          {hobbies.map((hobby) => (
            <a
              key={hobby.id}
              className={styles.hobbyCard}
              href={hobby.url}
              target="_blank"
              rel="noreferrer noopener"
            >
              <div className={styles.hobbyMedia}>
                {hobby.imageUrl ? (
                  <Image
                    src={hobby.imageUrl}
                    alt={hobby.title}
                    fill
                    sizes="(max-width: 768px) 90vw, 560px"
                    className={styles.hobbyImg}
                  />
                ) : (
                  <div className={`screenshot-placeholder ${styles.hobbyPlaceholder}`}>
                    {hobby.handle}
                  </div>
                )}
              </div>
              <div className={styles.hobbyBody}>
                <h3 className={styles.hobbyTitle}>{hobby.title}</h3>
                <p className={styles.hobbyDesc}>{hobby.description}</p>
                <span className={`mono ${styles.hobbyHandle}`}>{hobby.handle}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
