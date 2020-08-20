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

it('Child not found (root)', async () => {
  await t(
    conf,
    'a private xyz',
    `Loaded default environment variables: { a: 'AAA', b: 'BBB' }
The task "a private" does not contain a child task named "xyz".
`,
    true,
  );
});

it('Child not found (in private)', async () => {
  await t(
    conf,
    'a trigger_err',
    `Loaded default environment variables: { a: 'AAA', b: 'BBB' }
>> #a trigger_err
Error running command "#priA b xyz": The task "priA b" does not contain a child task named "xyz".
`,
    true,
  );
});
