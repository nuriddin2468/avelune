// The real size checks (packages/ui/scripts/size-limit.mts) for the miniature library in ./library, built into
// ./fesm2022: `within` stays under its budget, `over` exceeds it.
import { join } from 'node:path';
import { sizeChecks } from '../../../../packages/ui/scripts/size-limit.mts';

export default sizeChecks(
  join(import.meta.dirname, 'library'),
  join(import.meta.dirname, 'fesm2022'),
  import.meta.dirname,
);
