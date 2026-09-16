import type { ReactNode } from 'react';

// [locale]/layout.tsx renders <html>/<body>. This pass-through exists because the root
// not-found.tsx needs a layout above it: without one, `next dev` can't compile /_not-found.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
