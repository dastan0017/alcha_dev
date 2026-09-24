'use client';

import { Fragment } from 'react';
import { useContact } from '../contact/ContactContext';
import styles from './case.module.css';

/** `**bold**` and `[link]`; anything else is plain text. */
const TOKEN = /(\*\*[^*]+\*\*|\[[^[\]]+\])/g;

/**
 * The «Проверьте сами» line under the request flow. The copy is one editable string, so the
 * bold opening and the link are marked inside it: `**Проверьте сами:**` and `[Отправьте
 * заявку]`. Drop the markers and it still reads as a sentence — no marker means no styling,
 * never a broken line.
 */
export function ProofLine({ text }: { text: string }) {
  const { open } = useContact();

  return (
    <p className={styles.proof}>
      {text.split(TOKEN).map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <b key={i} className={styles.proofLead}>
              {part.slice(2, -2)}
            </b>
          );
        }
        if (part.startsWith('[') && part.endsWith(']')) {
          return (
            <button key={i} type="button" className={styles.proofLink} onClick={open}>
              {part.slice(1, -1)}
            </button>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </p>
  );
}
