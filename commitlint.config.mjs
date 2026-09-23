// Conventional commits (brief §3). Scopes are Nx project names plus a few repository-wide scopes.
import nxScopes from '@commitlint/config-nx-scopes';

const {
  utils: { getProjects },
} = nxScopes;

/** Scopes for changes that belong to no single project. */
const repositoryScopes = ['repo', 'deps', 'docs', 'ci', 'release'];

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': async (context) => [2, 'always', [...(await getProjects(context)), ...repositoryScopes]],
  },
};
