import { t } from './common.js';

const conf = 'argsConf';

const isNotWindows = process.platform !== 'win32';

if (isNotWindows) {
  it('No args', async () => {
    await t(
      conf,
      'print',
      `>> #print
>> node ./tests/data/args.js
"[]"`,
      { dz: true },
    );
  });

  it('Args', async () => {
    await t(
      conf,
      'print -a "  a cc " --e',
      `>> #print
>> node ./tests/data/args.js -a "  a cc " --e
"["-a","  a cc ","--e"]"`,
      { dz: true },
    );
  });
}