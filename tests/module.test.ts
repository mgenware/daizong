import { promises as fsPromises } from 'fs';
import * as assert from 'assert';

it('Verify type definition files', async () => {
  assert.ok((await fsPromises.stat('./dist/main.d.ts')).isFile());
});

it('Verify package.json bin field', async () => {
  const binObj: unknown = JSON.parse(
    await fsPromises.readFile('./package.json', 'utf8'),
  ).bin;
  assert.deepStrictEqual(binObj, {
    daizong: './dist/main.js',
    dz: './dist/dz.js',
  });
});
