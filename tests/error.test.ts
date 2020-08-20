import { t } from './common';

const conf = 'chainConf';

it('Not found (root)', async () => {
  await t(
    conf,
    'xyz',
    `Loaded default environment variables: { a: 'AAA', b: 'BBB' }
Undefined task "xyz". Valid tasks: ["a","zzz"].
`,
    true,
  );
});

it('Not found (in private)', async () => {
  await t(
    conf,
    'priB',
    `Loaded default environment variables: { a: 'AAA', b: 'BBB' }
The task "priB" is in private tasks, you can only run it from other tasks.
`,
    true,
  );
});

it('Not found (in private, not a valid task)', async () => {
  await t(
    conf,
    'priA',
    `Loaded default environment variables: { a: 'AAA', b: 'BBB' }
The task "priA" is in private tasks, you can only run it from other tasks.
`,
    true,
  );
});
