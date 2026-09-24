// ADR 0005 asked whether CSS nesting survives Angular's emulated encapsulation. This pins the answer for the installed
// compiler: the shim scopes the outer selector of a nested rule and nothing inside it. A nested rule that refines the
// same element therefore stays scoped through `&`; one that reaches another element is left unscoped and leaks into
// child components. avelune/nesting-same-element allows only the first kind (ADR 0024). If an Angular upgrade starts
// scoping nested selectors, the second test fails, and the rule can be revisited.
import { encapsulateStyle } from '@angular/compiler';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const shim = (css: string) => encapsulateStyle(css, 'c').replace(/\s+/g, ' ').trim();

describe("Angular's emulated shim and CSS nesting", () => {
  it('scopes the outer selector, so &-refinements of the same element stay scoped', () => {
    assert.equal(
      shim('.card { &:hover { color: red; } &[aria-disabled="true"] { color: gray; } }'),
      '.card[_ngcontent-c] { &:hover { color: red; } &[aria-disabled="true"] { color: gray; } }',
    );
    assert.equal(
      shim(':host { &:focus-visible { outline: none; } }'),
      '[_nghost-c] { &:focus-visible { outline: none; } }',
    );
  });

  it('leaves a nested selector for another element unscoped', () => {
    assert.equal(shim('.card { .title { margin: 0; } }'), '.card[_ngcontent-c] { .title { margin: 0; } }');
    assert.equal(
      shim('.card { @media (min-width: 600px) { .title { margin: 0; } } }'),
      '.card[_ngcontent-c] { @media (min-width: 600px) { .title { margin: 0; } } }',
    );
  });

  it('scopes every selector of flat CSS, which is what the rule requires', () => {
    assert.equal(
      shim('.card .title { margin: 0; } :host([data-size="sm"]) .icon { inline-size: 0; }'),
      '.card[_ngcontent-c] .title[_ngcontent-c] { margin: 0; } [data-size="sm"][_nghost-c] .icon[_ngcontent-c] { inline-size: 0; }',
    );
  });
});
