import * as np from 'path';
import { URL } from 'url';

const __dirname = new URL('.', import.meta.url).pathname;

export default {
  log: {
    // This command will be executed with different working directories.
    // Use `__dirname` to find `curDirName.js` in different working directories.
    run: [`node ${np.join(__dirname, 'helper/curDirName.js')}`],
  },
  child: {
    run: '#log',
    workingDir: 'tests/data',
  },
};
