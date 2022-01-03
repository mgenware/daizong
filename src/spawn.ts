import { spawn } from 'cross-spawn';

export default async function spawnMain(
  cmd: string,
  args: string[],
  env: Record<string, string | undefined> | undefined,
): Promise<void> {
  if (!cmd || !cmd.length) {
    throw new Error('Argument "cmd" cannot be empty');
  }

  const newEnv = {
    ...process.env,
    ...env,
  };
  return new Promise((resolve, reject) => {
    const process = spawn(cmd, args, {
      env: newEnv,
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
