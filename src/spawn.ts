import { spawn as nodeSpawn } from 'child_process';

function escape(cmd: string) {
  return `"${cmd.replace(/(["'$`\\])/g, '\\$1')}"`;
}

export default async function spawn(
  inputCmd: string,
  inputArgs: string[],
  env: Record<string, string | undefined> | undefined,
  logger: ((s: unknown) => void) | null,
): Promise<void> {
  if (!inputCmd.length) {
    throw new Error('The argument "inputCmd" cannot be empty');
  }

  logger?.(`[spawn-input] ${inputCmd} | ${inputArgs}`);
  logger?.(`[spawn-input-env] ${env}`);
  let cmd = inputCmd;
  if (inputArgs.length) {
    cmd += inputArgs.map((s) => ` ${escape(s)}`).join(' ');
  }

  const mergedEnv = {
    ...process.env,
    ...env,
  };

  logger?.(`[spawn-run] ${cmd}`);
  logger?.(`[spawn-run-env] ${mergedEnv}`);
  return new Promise((resolve, reject) => {
    const process = nodeSpawn(cmd, {
      shell: true,
      env: mergedEnv,
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
