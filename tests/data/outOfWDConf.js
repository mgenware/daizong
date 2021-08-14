import * as os from 'os';
import * as path from 'path';

const tmpDir = path.join(os.tmpdir(), `daizong-${Date.now()}`);

export default {
  t: {
    before: {
      mkdir: tmpDir,
    },
    run: 'echo hi',
    after: {
      del: tmpDir,
    },
  },
};
