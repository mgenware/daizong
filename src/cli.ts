import { spawn } from 'child_process';

async function pipedSpawn(
  cmd: string,
  args: ReadonlyArray<string>,
): Promise<void> {
  if (!cmd || !cmd.length) {
    throw new Error('Argument "cmd" cannot be empty');
  }

  return new Promise((resolve, reject) => {
    const process = spawn(cmd, args, {
      stdio: 'inherit',
    });
    process.on('close', (code) => {
      if (code) {
        reject(new Error(`Command failed with code ${code} (${cmd})`));
      } else {
        resolve();
      }
    });
    process.on('error', (err) => {
      reject(err);
    });
  });
}

const args = process.argv.slice(2);

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  try {
    await pipedSpawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', [
      'daizong',
      ...args,
    ]);
  } catch (err) {
    console.error(err instanceof Error ? err.message : `${err}`);
  }
})();
