import { t } from './common.js';

const conf = 'chainConf';

it('Not found (root)', async () => {
  await t(
    conf,
    'xyz',
    `Loaded default environment variables: {
  a: 'AAA',
  b: 'BBB'
}
The task you specified does not exist
`,
    { hasError: true },
  );
});

it('Not found (with aliases)', async () => {
  await t(
    'notFoundWithAliasConf',
    'xyz',
    `The task you specified does not exist
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
Task "priB" is private, it can only be triggered by other tasks
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
Task "priA" is private, it can only be triggered by other tasks
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
No \`run\` field found in task "#a private"
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
No \`run\` field found in task "#priA b xyz"
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
