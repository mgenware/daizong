import * as mkdir from 'make-dir';
import { promises as fs } from 'fs';
import * as assert from 'assert';
import * as nodepath from 'path';
import * as del from 'del';
import { t } from './common';

const conf = 'fsConf';
const rootTmpDir = './tests/data/tmp';

async function newTmpDir(name: string): Promise<string> {
  const path = nodepath.join(rootTmpDir, name);
  await mkdir(path);
  return path;
}

async function clean() {
  await del(rootTmpDir);
}

export async function isFile(path: string): Promise<boolean | null> {
  try {
    const st = await fs.stat(path);
    return st.isFile();
  } catch {
    return null;
  }
}

it('Actions(before), del with glob, mkdir', async () => {
  const path = await newTmpDir('before1');
  await fs.writeFile(nodepath.join(path, 'a.txt'), 'haha');
  await fs.writeFile(nodepath.join(path, 'a.json'), 'haha');

  await t(
    conf,
    'before',
    `>> #before
>> mkdir "tests/data/tmp/before1-new"
>> del "tests/data/tmp/before1/*.txt"
>> echo hi
hi
`,
  );
  assert.equal(await isFile('tests/data/tmp/before1-new'), false);
  assert.equal(await isFile('tests/data/tmp/before1/a.txt'), null);
  assert.equal(await isFile('tests/data/tmp/before1/a.json'), true);

  await clean();
});

it('Actions(after), del with multiple args', async () => {
  const path = await newTmpDir('after1');
  await fs.writeFile(nodepath.join(path, 'a.txt'), 'haha');
  await fs.writeFile(nodepath.join(path, 'a.json'), 'haha');

  await t(
    conf,
    'after',
    `>> #after
>> echo hi
hi
>> del ["tests/data/tmp/after1/*.*","!tests/data/tmp/after1/a.txt"]
`,
  );
  assert.equal(await isFile('tests/data/tmp/after1/a.txt'), true);
  assert.equal(await isFile('tests/data/tmp/after1/a.json'), null);

  await clean();
});
