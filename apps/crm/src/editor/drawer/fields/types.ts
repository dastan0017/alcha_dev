import type { ReactNode } from 'react';

/** Props every drawer field control shares. */
export interface FieldProps<V> {
  /**
   * Id of the control, or of the group for compound fields, whose entry controls get
   * `${id}.${index}` (so an id built from a CMS path also matches its list-entry paths).
   */
  id: string;
  /** Visible label: the field caption, or an RU / EN badge under a shared caption. */
  label: ReactNode;
  value: V;
  onChange: (value: V) => void;
}
