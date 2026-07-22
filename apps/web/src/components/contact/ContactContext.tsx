'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { Locale } from '@alcha/shared';
import { ContactModal } from './ContactModal';

interface ContactContextValue {
  open: () => void;
}

const ContactContext = createContext<ContactContextValue | null>(null);

export function useContact(): ContactContextValue {
  const ctx = useContext(ContactContext);
  if (!ctx) {
    throw new Error('useContact must be used within <ContactProvider>');
  }
  return ctx;
}

export function ContactProvider({
  children,
  locale,
  telegram,
}: {
  children: ReactNode;
  locale: Locale;
  telegram: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <ContactContext.Provider value={{ open }}>
      {children}
      <ContactModal isOpen={isOpen} onClose={close} locale={locale} telegram={telegram} />
    </ContactContext.Provider>
  );
}
