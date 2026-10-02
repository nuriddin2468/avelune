/** Options of `ng add @avelune/ui`. Mirrors `schema.json`. */
export interface Schema {
  /** Name of the application to set up. */
  project?: string;
  /** Also preload the Cyrillic face of Avelune Sans, for screens in Russian or Uzbek Cyrillic. */
  preloadCyrillic?: boolean;
  /** Install @avelune/eslint-config and @avelune/stylelint-config, and write their configs where the workspace has none. */
  lint?: boolean;
  /** Put the kit's rules for coding agents into AGENTS.md. */
  agents?: boolean;
}
