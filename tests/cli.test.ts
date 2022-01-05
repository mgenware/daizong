import { readFile } from 'fs/promises';
import np from 'path';
import { fileURLToPath } from 'url';
import { t } from './common.js';

const dirname = np.dirname(fileURLToPath(import.meta.url));
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const pkg = JSON.parse(
  await readFile(np.join(dirname, '../package.json'), 'utf8'),
);

it('-v', async () => {
  await t(null, '-v', `${pkg.version}`);
});

it('No input', async () => {
  await t(null, '', 'Missing task path.\nTry `daizong --help` for help.', {
    hasError: true,
  });
});

it('Invalid name', async () => {
  await t(null, '__err__', 'Config file "daizong.config.js" does not exist.', {
    hasError: true,
  });
});
