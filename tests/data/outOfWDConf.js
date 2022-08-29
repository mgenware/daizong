import * as os from 'os';
import * as path from 'path';

const tmpDir = path.join(os.tmpdir(), `daizong-${Date.now()}`);

export default {
  t: {
    before: '#beforeT',
    run: 'echo hi',
    after: '#afterT',
  },
  beforeT: {
    run: {
      mkdir: tmpDir,
    },
  },
  afterT: {
    run: {
      del: tmpDir,
    },
  },
};
