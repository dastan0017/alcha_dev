'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import type { Locale } from '@alcha/shared';
import styles from './ContactModal.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type Status = 'idle' | 'sending' | 'success' | 'error';

export function ContactModal({
  isOpen,
  onClose,
  locale,
  telegram,
}: {
  isOpen: boolean;
  onClose: () => void;
  locale: Locale;
  telegram: string;
}) {
  const t = useTranslations('contact');
  const [status, setStatus] = useState<Status>('idle');
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => firstFieldRef.current?.focus(), 50);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      window.clearTimeout(focusTimer);
    };
  }, [isOpen, onClose]);

  // Reset state shortly after closing so the next open starts fresh.
  useEffect(() => {
    if (isOpen) return;
    const timer = window.setTimeout(() => setStatus('idle'), 250);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    // Honeypot — bots fill `website`; drop silently client-side too.
    if ((data.get('website') as string)?.length > 0) {
      setStatus('success');
      return;
    }
    setStatus('sending');
    try {
      const res = await fetch(`${API_URL}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          contact: data.get('contact'),
          message: data.get('message'),
          sourcePath: typeof window !== 'undefined' ? window.location.pathname : '/',
          locale,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus('success');
      form.reset();
    } catch {
      setStatus('error');
    }
  }

  return (
    <div
      className={styles.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-title"
        ref={dialogRef}
      >
        <button type="button" className={styles.close} onClick={onClose} aria-label={t('title')}>
          ✕
        </button>
        <p className="eyebrow">{t('title')}</p>
        <h2 id="contact-title" className={styles.title}>
          {t('title')}
        </h2>
        <p className={styles.subtitle}>{t('subtitle')}</p>

        {status === 'success' ? (
          <div className={styles.success} role="status">
            {t('success')}
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <label className={styles.field}>
              <span>{t('name')}</span>
              <input
                ref={firstFieldRef}
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder={t('namePlaceholder')}
              />
            </label>
            <label className={styles.field}>
              <span>{t('contact')}</span>
              <input
                name="contact"
                type="text"
                required
                placeholder={t('contactPlaceholder')}
              />
            </label>
            <label className={styles.field}>
              <span>{t('message')}</span>
              <textarea name="message" rows={4} required placeholder={t('messagePlaceholder')} />
            </label>
            {/* Honeypot */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              className={styles.honeypot}
              aria-hidden="true"
            />
            {status === 'error' && (
              <p className={styles.error} role="alert">
                {t('error')}
              </p>
            )}
            <button type="submit" className="btn btn--primary" disabled={status === 'sending'}>
              {status === 'sending' ? t('sending') : t('submit')}
            </button>
            {telegram && (
              <a className={styles.telegram} href={telegram} target="_blank" rel="noreferrer noopener">
                {t('orTelegram')}
              </a>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
