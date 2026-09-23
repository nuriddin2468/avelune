# 0005. Motion: `animate.enter`/`leave` + CSS; browser floor

- Status: Accepted (2026-09-23, product-owner go-ahead)
- Date: 2026-09-23
- Related: 0004, brief §6

## Context

- `animate.enter` / `animate.leave` shipped as public API in Angular 20.2. v22 changed leave behaviour and the `animationComplete` signature.
- `@angular/animations` was deprecated in 20.2.0; its JSDoc states intent to remove it in v23.
- Browser floor chosen by the product owner: modern browsers only. Feature support below is from MDN browser-compat-data 8.1.2 (2026-09-17).

| Feature | Chrome/Edge | Firefox | Safari / iOS | Role in Avelune |
|---|---|---|---|---|
| `@starting-style` | 117 | 129 | 17.5 | required |
| `transition-behavior: allow-discrete` | 117 | 129 | 17.4 | required |
| Popover API | 114 | 125 | 17 | required |
| `linear()` easing | 113 | 112 | 17.2 | required (spring) |
| Cascade layers / container queries / `oklch()` | ≤111 | ≤113 | ≤16 | required |
| CSS nesting (relaxed) | 120 | 117 | 17.2 | lowered by the build for Chrome 117–119 |
| `overlay` property | 117 | no | no | progressive: top-layer exit animations |
| `interpolate-size` | 129 | no | no | progressive: accordion |
| View Transitions (same-document) | 111 | 144 | 18 | progressive: route changes |

## Decision

1. **Browser floor:** `Chrome >= 117, Edge >= 117, Firefox >= 129, Safari >= 17.5, iOS >= 17.5` in the root `.browserslistrc`.
2. **Enter/leave motion** uses `animate.enter` / `animate.leave` with the `ave-motion-*` classes from `packages/ui/styles/motion.css`. All `@keyframes` live in that one file.
3. **`@angular/animations` is banned** via ESLint `no-restricted-imports`. It exists in the repo only as a Storybook peer devDependency (ADR 0008).
4. **State toggles** (hover, checked, expanded) use CSS transitions, not keyframes, so they are interruptible.
5. **Only `transform` and `opacity` animate.** The accordion uses `grid-template-rows: 0fr → 1fr`, with `interpolate-size: allow-keywords` as an enhancement.
6. **Top-layer elements** (`<dialog>`, `[popover]`) use `@starting-style` + `transition-behavior: allow-discrete` on `display` and `overlay`. Where `overlay` is unsupported, the exit fade may be cut short. That is accepted and not polyfilled.
7. **Router** uses `withViewTransitions()`. Where unsupported, navigation happens instantly without a transition.
8. **Motion tokens are exactly brief §6.2**, tuned once at the Foundations milestone and frozen afterwards (changing them needs a new ADR). Reduced motion is achieved by token overrides only (brief §6.5).

## Alternatives considered

- **`@angular/animations`:** deprecated and slated for removal. Rejected.
- **A JS animation library** (Motion One, GSAP): bypasses tokens, and invariants would have to read JS timing. Rejected.
- **A floor that includes Chrome 109 / Windows 7:** would lose `@starting-style`, `transition-behavior` and the Popover API. The product owner confirmed only modern browsers are in use.

## Consequences

- `tools/invariants` asserts that every running animation's duration and easing equals a token (brief §8.2). That check is only meaningful because motion is pure CSS.
- CSS nesting inside component styles must survive Angular's emulated-encapsulation shim. A fixture in Phase 3 proves it; if it fails, nesting is banned by Stylelint instead.
