A miniature `@avelune/ui` for the `avelune/entry-point-layers` tests: `icon` (foundations), `button` (components,
with a `testing` entry point), `form-field` (composites), `list-page` (patterns), `no-manifest` (no entry.json) and
`bad-layer` (an unknown layer). The tests lint virtual files inside these folders; only the manifests need to exist.
The Stylelint rules that read an entry point's layer (`avelune/component-layer`, `avelune/pattern-layout-only`) lint
virtual stylesheets in `button` and `list-page`.
