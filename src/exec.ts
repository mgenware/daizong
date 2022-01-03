import { spawn } from 'child_process';
import { quote } from 'shell-quote';

export default async function exec(
  cmd: string,
  args: string[],
  env: Record<string, string | undefined> | undefined,
): Promise<void> {
  if (!cmd.length) {
    throw new Error('Argument "cmd" cannot be empty');
  }
  if (args.length) {
    cmd += ` ${quote(args)}`;
  }

  const newEnv = {
    ...process.env,
    ...env,
  };
  return new Promise((resolve, reject) => {
    const process = spawn(cmd, {
      shell: true,
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
