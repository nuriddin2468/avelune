// The real size checks for ./unbudgeted, whose entry point declares no budget: the config itself must fail.
import { join } from 'node:path';
import { sizeChecks } from '../../../../packages/ui/scripts/size-limit.mts';

export default sizeChecks(
  join(import.meta.dirname, 'unbudgeted'),
  join(import.meta.dirname, 'fesm2022'),
  import.meta.dirname,
);
