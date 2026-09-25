// ADR 0005 asked whether CSS nesting survives Angular's emulated encapsulation. This pins the answer for the installed
// compiler. Up to Angular 22.1 the shim scoped the outer selector of a nested rule and nothing inside it. Since 22.2
// (angular/angular d0d7f57, "scope nested CSS rules") it adds the content attribute to every nested selector, `&`
// included: a nested selector for another element is scoped, and a refinement of the same element stays scoped, but a
// refinement of the host (`:host { &:hover {} }`) asks the host for the content attribute, which it does not carry,
// and never matches. avelune/nesting-same-element allows only refinements, and none under :host (ADR 0024, addendum).
// If an upgrade changes any of this, a test here fails, and the rule can be revisited.
import { encapsulateStyle } from '@angular/compiler';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const shim = (css: string) => encapsulateStyle(css, 'c').replace(/\s+/g, ' ').trim();

describe("Angular's emulated shim and CSS nesting", () => {
  it('scopes &-refinements of an element of the template, which it already scoped through the parent', () => {
    assert.equal(
      shim('.card { &:hover { color: red; } &[aria-disabled="true"] { color: gray; } }'),
      '.card[_ngcontent-c] { &[_ngcontent-c]:hover { color: red; } &[aria-disabled="true"][_ngcontent-c] { color: gray; } }',
    );
  });

  it('scopes a nested selector for another element, also inside an at-rule', () => {
    assert.equal(
      shim('.card { .title { margin: 0; } }'),
      '.card[_ngcontent-c] { .title[_ngcontent-c] { margin: 0; } }',
    );
    assert.equal(
      shim('.card { @media (min-width: 600px) { .title { margin: 0; } } }'),
      '.card[_ngcontent-c] { @media (min-width: 600px) { .title[_ngcontent-c] { margin: 0; } } }',
    );
  });

  it('scopes an &-refinement of :host to the content attribute, so it never matches the host', () => {
    assert.equal(
      shim(':host { &:focus-visible { outline: none; } }'),
      '[_nghost-c] { &[_ngcontent-c]:focus-visible { outline: none; } }',
    );
    assert.equal(
      shim(':host([data-size="sm"]) { &:hover { color: red; } }'),
      '[data-size="sm"][_nghost-c] { &[_ngcontent-c]:hover { color: red; } }',
    );
  });

  it('scopes every selector of flat CSS, which is what the rule requires', () => {
    assert.equal(
      shim(
        '.card .title { margin: 0; } :host([data-size="sm"]) .icon { inline-size: 0; } :host(:hover) { color: red; }',
      ),
      '.card[_ngcontent-c] .title[_ngcontent-c] { margin: 0; } [data-size="sm"][_nghost-c] .icon[_ngcontent-c] { inline-size: 0; } [_nghost-c]:hover { color: red; }',
    );
  });
});
