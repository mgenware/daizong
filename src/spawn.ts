import { spawn, exec } from 'child_process';

export default function spawnMain(
  cmd: string[],
  // eslint-disable-next-line @typescript-eslint/ban-types
  env: object | undefined,
  useExec: boolean,
  stdoutCallback: (s: string) => void,
  stderrCallback: (s: string) => void,
): Promise<void> {
  if (!cmd || !cmd.length) {
    throw new Error('Argument "cmd" cannot be empty');
  }

  const name = cmd[0];
  const newEnv = {
    ...process.env,
    ...env,
  };
  if (useExec) {
    return new Promise((resolve, reject) => {
      exec(name, { env: newEnv }, (error, stdout, stderr) => {
        if (stdout) {
          stdoutCallback(stdout);
        }
        if (stderr) {
          stderrCallback(stderr);
        }
        if (error) {
          reject(stderr);
        } else {
          resolve();
        }
      });
    });
  }

  const args = cmd.length > 1 ? cmd.slice(1) : [];
  return new Promise((resolve, reject) => {
    const child = spawn(name, args, {
      shell: process.platform === 'win32',
      env: newEnv,
    });
    child.stdout.on('data', (data) => {
      stdoutCallback(data.toString());
    });
    child.stderr.on('data', (data) => {
      stderrCallback(data.toString());
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
