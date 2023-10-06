import { platform } from 'os';
import * as np from 'path';
import { URL } from 'url';

let __dirname = new URL('.', import.meta.url).pathname;
// Fix windows path starting with `/`.
if (platform() === 'win32' && __dirname.startsWith('/')) {
  __dirname = __dirname.slice(1);
}

export default {
  log: {
    // This command will be executed with different working directories.
    // Use `__dirname` to find `curDirName.js` in different working directories.
    run: [`node ${np.resolve(__dirname, 'helper/curDirName.js')}`],
  },
  child: {
    run: '#log',
    workingDir: 'tests/data',
  },
};
