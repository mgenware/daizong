import { spawn } from 'child_process';

export default async function spawnMain(
  cmd: string,
  args: string,
  env: Record<string, string | undefined> | undefined,
): Promise<void> {
  if (!cmd || !cmd.length) {
    throw new Error('Argument "cmd" cannot be empty');
  }
  if (args) {
    // eslint-disable-next-line no-param-reassign
    cmd = `${cmd} ${args}`;
  }

  const newEnv = {
    ...process.env,
    ...env,
  };

  return new Promise((resolve, reject) => {
    const process = spawn(cmd, {
      env: newEnv,
      shell: true,
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
