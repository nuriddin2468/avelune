import type { Rule } from '@angular-devkit/schematics';
import type { Schema } from './schema';

/**
 * `ng add @avelune/ui`.
 *
 * The collection is wired from day one (ADR 0007). The setup steps (peer dependencies, global styles, fonts,
 * `provideAvelune()`, lint configs, the agent snippet) arrive in Phase 6.
 */
export function ngAdd(options: Schema): Rule {
  return (_tree, context) => {
    const project = options.project ?? 'the default project';
    context.logger.info(`@avelune/ui: ng add ran for ${project}. No setup steps ship in this version yet.`);
  };
}
