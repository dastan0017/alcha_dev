'use client';

import { useRef, type ReactNode } from 'react';
import styles from './home.module.css';

export function WorksCarousel({
  children,
  prevLabel,
  nextLabel,
}: {
  children: ReactNode;
  prevLabel: string;
  nextLabel: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const amount = Math.min(el.clientWidth * 0.85, 820);
    el.scrollBy({ left: direction * amount, behavior: 'smooth' });
  };

  return (
    <div className={styles.carousel}>
      <div className={styles.track} ref={trackRef}>
        {children}
      </div>
      <div className={`container ${styles.carouselNav}`}>
        <button
          type="button"
          className={styles.arrow}
          aria-label={prevLabel}
          onClick={() => scroll(-1)}
        >
          ←
        </button>
        <button
          type="button"
          className={styles.arrow}
          aria-label={nextLabel}
          onClick={() => scroll(1)}
        >
          →
        </button>
      </div>
    </div>
  );
}
