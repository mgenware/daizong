import { spawn } from 'child_process';

export default function spawnMain(
  cmd: string,
  args: string,
  env: Record<string, unknown> | undefined,
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
    const child = spawn(cmd, {
      shell: true,
      env: newEnv,
      stdio: 'inherit',
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
