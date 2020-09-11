import { t } from './common';

const conf = 'chainConf';

it('Not found (root)', async () => {
  await t(
    conf,
    'xyz',
    `Loaded default environment variables: {
  a: 'AAA',
  b: 'BBB'
}
Task "xyz" is not defined. Valid top-level tasks are ["a","zzz"]
`,
    { hasError: true },
  );
});

it('Not found (with aliases)', async () => {
  await t(
    'notFoundWithAliasConf',
    'xyz',
    `Task "xyz" is not defined. Valid top-level tasks are ["a","b(alias-of-b)"]
`,
    { hasError: true },
  );
});

it('Not found (in private)', async () => {
  await t(
    conf,
    'priB',
    `Loaded default environment variables: {
  a: 'AAA',
  b: 'BBB'
}
Task "priB" is private, you can only run it from other tasks
`,
    { hasError: true },
  );
});

it('--private', async () => {
  await t(
    conf,
    'priB',
    `Loaded default environment variables: {
  a: 'AAA',
  b: 'BBB'
}
>> #priB
>> echo priB
priB
`,
    { args: '--private' },
  );
});

it('Not found (in private, not a valid task)', async () => {
  await t(
    conf,
    'priA',
    `Loaded default environment variables: {
  a: 'AAA',
  b: 'BBB'
}
Task "priA" is private, you can only run it from other tasks
`,
    { hasError: true },
  );
});

it('Child not found (root)', async () => {
  await t(
    conf,
    'a private xyz',
    `Loaded default environment variables: {
  a: 'AAA',
  b: 'BBB'
}
Task "a private" does not contain a child task named "xyz"
`,
    { hasError: true },
  );
});

it('Child not found (in private)', async () => {
  await t(
    conf,
    'a trigger_err',
    `Loaded default environment variables: {
  a: 'AAA',
  b: 'BBB'
}
>> #a trigger_err
Error running command "#priA b xyz": Task "priA b" does not contain a child task named "xyz"
`,
    { hasError: true },
  );
});

it('Duplicate tasks', async () => {
  await t(
    'duplicateTaskNamesConf',
    'xyz',
    `Task "childTask" is already defined in public tasks
`,
    { hasError: true },
  );
});

it('Duplicate alias', async () => {
  await t(
    'duplicateAliasesConf',
    'xyz',
    `Duplicate name "p"
`,
    { hasError: true },
  );
});

it('No private aliases', async () => {
  await t(
    'noPrivateAliasConf',
    'xyz',
    `Private cannot have an alias. Task: "priTask", alias: "childTask"
`,
    { hasError: true },
  );
});
