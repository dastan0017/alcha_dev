import { getTranslations } from 'next-intl/server';
import type { Project } from '@alcha/shared';
import { WorksCarousel } from './WorksCarousel';
import { WorkCard } from './WorkCard';
import styles from './home.module.css';

export async function Works({ heading, projects }: { heading: string; projects: Project[] }) {
  const t = await getTranslations('works');

  if (projects.length === 0) return null;

  return (
    <section className={`section ${styles.works}`} id="works">
      <div className="container section-head">
        <p className="eyebrow eyebrow--muted">{t('allWorks')}</p>
        <h2 className="section-title">{heading}</h2>
      </div>
      <WorksCarousel prevLabel={t('prev')} nextLabel={t('next')}>
        {projects.map((project) => (
          <WorkCard key={project.id} project={project} />
        ))}
      </WorksCarousel>
    </section>
  );
}
