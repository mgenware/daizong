import { promises as fs } from 'fs';
import * as assert from 'assert';
import * as np from 'path';
import { t } from './common.js';

const conf = 'fsConf';
const rootTmpDir = './tests/data/tmp';

function mkdir(path: string) {
  return fs.mkdir(path, { recursive: true });
}

async function newTmpDir(name: string): Promise<string> {
  const path = np.join(rootTmpDir, name);
  await mkdir(path);
  return path;
}

export async function isFile(path: string): Promise<boolean | null> {
  try {
    const st = await fs.stat(path);
    return st.isFile();
  } catch {
    return null;
  }
}

it('BTCommands (before), del with glob, mkdir', async () => {
  const path = await newTmpDir('before1');
  await fs.writeFile(np.join(path, 'a.txt'), 'haha');
  await fs.writeFile(np.join(path, 'a.json'), 'haha');

  await t(
    conf,
    'before',
    `>> #before
>> #before (before)
>> mkdir "tests/data/tmp/before1-new"
>> del "tests/data/tmp/before1/*.txt"
>> echo hi
hi`,
  );
  assert.strictEqual(await isFile('tests/data/tmp/before1-new'), false);
  assert.strictEqual(await isFile('tests/data/tmp/before1/a.txt'), null);
  assert.strictEqual(await isFile('tests/data/tmp/before1/a.json'), true);
});

it('Multiple inputs', async () => {
  const path = await newTmpDir('del-multiple');
  await fs.writeFile(np.join(path, 'a.txt'), 'haha');
  await fs.writeFile(np.join(path, 'b.txt'), 'haha');
  await fs.writeFile(np.join(path, 'c.txt'), 'haha');

  await t(
    conf,
    'delMultiple',
    `>> #delMultiple
>> del ["tests/data/tmp/del-multiple/a.txt","tests/data/tmp/del-multiple/b.txt"]`,
  );
  assert.strictEqual(await isFile('tests/data/tmp/del-multiple/a.txt'), null);
  assert.strictEqual(await isFile('tests/data/tmp/del-multiple/b.txt'), null);
  assert.strictEqual(await isFile('tests/data/tmp/del-multiple/c.txt'), true);
});

it('Actions(after), del with multiple args', async () => {
  const path = await newTmpDir('after1');
  await fs.writeFile(np.join(path, 'a.txt'), 'haha');
  await fs.writeFile(np.join(path, 'a.json'), 'haha');

  await t(
    conf,
    'after',
    `>> #after
>> echo hi
hi
>> #after (after)
>> del ["tests/data/tmp/after1/*.*","!tests/data/tmp/after1/a.txt"]`,
  );
  assert.strictEqual(await isFile('tests/data/tmp/after1/a.txt'), true);
  assert.strictEqual(await isFile('tests/data/tmp/after1/a.json'), null);
});

it('Run BT commands', async () => {
  const path = await newTmpDir('run-bt-cmds');
  await fs.writeFile(np.join(path, 'a.txt'), 'haha');
  await fs.writeFile(np.join(path, 'a.json'), 'haha');

  await t(
    conf,
    'runActions',
    `>> #runActions
>> mkdir "tests/data/tmp/run-bt-cmds-new"
>> del "tests/data/tmp/run-bt-cmds/*.txt"`,
  );
  assert.strictEqual(await isFile('tests/data/tmp/run-bt-cmds-new'), false);
  assert.strictEqual(await isFile('tests/data/tmp/run-bt-cmds/a.txt'), null);
  assert.strictEqual(await isFile('tests/data/tmp/run-bt-cmds/a.json'), true);
});

it('BT command order 1', async () => {
  const path = await newTmpDir('order1');
  // Create a file inside `order1`.
  await fs.writeFile(np.join(path, 'a.txt'), 'haha');

  await t(
    conf,
    'order1',
    `>> #order1
>> del "tests/data/tmp/order1"
>> mkdir "tests/data/tmp/order1"`,
  );

  // `order1` should be cleaned.
  assert.strictEqual(await isFile('tests/data/tmp/order1'), false);
  assert.strictEqual(await isFile('tests/data/tmp/order1/a.txt'), null);
});

it('BT command order 2', async () => {
  await t(
    conf,
    'order2',
    `>> #order2
>> del "tests/data/tmp/order2"
>> mkdir "tests/data/tmp/order2"`,
  );

  // `order2` should be created.
  assert.strictEqual(await isFile('tests/data/tmp/order2'), false);
});

it('mkdirDel 1', async () => {
  const path = await newTmpDir('mkdirDel1');
  // Create a file inside `mkdirDel1`.
  await fs.writeFile(np.join(path, 'a.txt'), 'haha');

  await t(
    conf,
    'mkdirDel1',
    `>> #mkdirDel1
>> mkdirDel "tests/data/tmp/mkdirDel1"`,
  );

  // `mkdirDel1` should be cleaned.
  assert.strictEqual(await isFile('tests/data/tmp/mkdirDel1'), false);
  assert.strictEqual(await isFile('tests/data/tmp/mkdirDel1/a.txt'), null);
});

it('mkdirDel 2', async () => {
  await t(
    conf,
    'mkdirDel2',
    `>> #mkdirDel2
>> mkdirDel "tests/data/tmp/mkdirDel2"`,
  );

  // `mkdirDel2` should be created.
  assert.strictEqual(await isFile('tests/data/tmp/mkdirDel2'), false);
});

it('Run BT commands (mixed with string commands)', async () => {
  const path = await newTmpDir('run-bt-cmds-mix');
  await fs.writeFile(np.join(path, 'a.txt'), 'haha');
  await fs.writeFile(np.join(path, 'a.json'), 'haha');

  await t(
    conf,
    'runActionsMixed',
    `>> #runActionsMixed
>> echo 1
1
>> mkdir "tests/data/tmp/run-bt-cmds-mix-new"
>> del "tests/data/tmp/run-bt-cmds-mix/*.txt"
>> echo 2
2`,
  );
  assert.strictEqual(await isFile('tests/data/tmp/run-bt-cmds-mix-new'), false);
  assert.strictEqual(
    await isFile('tests/data/tmp/run-bt-cmds-mix/a.txt'),
    null,
  );
  assert.strictEqual(
    await isFile('tests/data/tmp/run-bt-cmds-mix/a.json'),
    true,
  );
});

it('Command strings in before or after', async () => {
  await t(
    conf,
    'beforeAfterCmds',
    `>> #beforeAfterCmds
>> echo 1
1
>> echo 2
2
>> echo 3
3`,
  );
});
