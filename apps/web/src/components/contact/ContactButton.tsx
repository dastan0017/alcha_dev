'use client';

import { useContact } from './ContactContext';

export function ContactButton({
  label,
  className = 'btn btn--primary',
}: {
  label: string;
  className?: string;
}) {
  const { open } = useContact();
  return (
    <button type="button" className={className} onClick={open}>
      {label}
    </button>
  );
}
