import Image from 'next/image';
import type { Project } from '@alcha/shared';
import { Link } from '@/i18n/navigation';
import styles from './case.module.css';

/**
 * The project `project` points at, or the next one by sort order. A deleted or unpublished
 * target simply falls through to the neighbour, so the card never leads nowhere.
 */
export function pickNextProject(project: Project, projects: readonly Project[]): Project | null {
  const chosen = projects.find((other) => other.id === project.nextProjectId);
  if (chosen && chosen.id !== project.id) return chosen;
  const position = projects.findIndex((other) => other.id === project.id);
  return position >= 0 ? (projects[position + 1] ?? null) : null;
}

export function NextProjectCard({
  project,
  label,
  action,
}: {
  project: Project;
  label: string;
  action: string;
}) {
  return (
    <div className={styles.next}>
      <Link
        href={`/works/${project.slug}`}
        className={`${styles.nextCard} ${project.coverImage ? '' : styles.nextCardFlat}`}
      >
        {/* No cover, no empty grey box: the card falls back to label and title. */}
        {project.coverImage && (
          <span className={styles.nextCover}>
            <Image
              src={project.coverImage}
              alt=""
              fill
              sizes="240px"
              className={styles.nextCoverImg}
            />
          </span>
        )}
        <span className={styles.nextCopy}>
          <span className={styles.nextLabel}>{label}</span>
          <span className={styles.nextTitle}>{project.title}</span>
        </span>
        <span className={styles.nextAction}>
          {action} <span aria-hidden="true">→</span>
        </span>
      </Link>
    </div>
  );
}
