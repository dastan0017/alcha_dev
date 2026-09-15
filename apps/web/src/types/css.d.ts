// Global stylesheets are imported only for their side effects
// (`import '@/styles/globals.css'`). Next's types declare `*.module.css` but
// not plain `*.css`, so once `noUncheckedSideEffectImports` is on — the
// default from TypeScript 6 — those imports fail to resolve without this.
//
// Scoped to `@/styles/` on purpose: a bare `*.css` pattern ties with Next's
// `*.module.css`, and whichever declaration TypeScript loads first wins — so
// it could silently turn every CSS-module import into `any`.
declare module '@/styles/*.css';
