import { t } from './common';

const conf = 'chainConf';

it('Chain', async () => {
  await t(
    conf,
    'a b start',
    `Loaded default environment variables: {
  a: 'AAA',
  b: 'BBB'
}
>> #a b start
>> echo a b started
a b started
`,
  );
});

it('Chain 2', async () => {
  await t(
    conf,
    'a stop',
    `Loaded default environment variables: {
  a: 'AAA',
  b: 'BBB'
}
>> #a stop
>> echo a stopped
a stopped
`,
  );
});

it('Chain (private)', async () => {
  await t(
    conf,
    'a private start',
    `Loaded default environment variables: {
  a: 'AAA',
  b: 'BBB'
}
>> #a private start
>> #priA b start
>> echo priA b started
priA b started
`,
  );
});

it('Chain 2 (private)', async () => {
  await t(
    conf,
    'a private stop',
    `Loaded default environment variables: {
  a: 'AAA',
  b: 'BBB'
}
>> #a private stop
>> #priA stop
>> echo priA stopped
priA stopped
`,
  );
});
