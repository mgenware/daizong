import { spawn } from 'child_process';

export default function spawnMain(
  cmd: string[],
  // eslint-disable-next-line @typescript-eslint/ban-types
  env: object | undefined,
  stdout: (data: Buffer) => void,
  stderr: (data: Buffer) => void,
): Promise<void> {
  if (!cmd || !cmd.length) {
    throw new Error('Argument "cmd" cannot be empty');
  }

  const name = cmd[0];
  const args = cmd.length > 1 ? cmd.slice(1) : [];
  return new Promise((resolve, reject) => {
    const child = spawn(name, args, {
      shell: process.platform === 'win32',
      env: {
        ...process.env,
        ...env,
      },
    });
    child.stdout.on('data', (data) => {
      stdout(data);
    });
    child.stderr.on('data', (data) => {
      stderr(data);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        const error = new Error(`Process exited with code ${code}`);
        reject(error);
      }
    });
  });
}
