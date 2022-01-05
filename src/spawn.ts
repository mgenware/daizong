import { spawn as nodeSpawn } from 'cross-spawn';

// Source: https://github.com/sindresorhus/execa/blob/main/lib/command.js
const SPACES_REGEXP = / +/g;
function parseCommand(command: string) {
  const tokens: string[] = [];
  for (const token of command.trim().split(SPACES_REGEXP)) {
    // Allow spaces to be escaped by a backslash if not meant as a delimiter
    const previousToken = tokens[tokens.length - 1];
    if (previousToken && previousToken.endsWith('\\')) {
      // Merge previous token with current one
      tokens[tokens.length - 1] = `${previousToken.slice(0, -1)} ${token}`;
    } else {
      tokens.push(token);
    }
  }

  return tokens;
}

export default async function spawn(
  inputCmd: string,
  inputArgs: string[],
  env: Record<string, string | undefined> | undefined,
  logger: ((s: unknown) => void) | null,
): Promise<void> {
  if (!inputCmd.length) {
    throw new Error('Argument "cmd" cannot be empty');
  }

  logger?.(`[spawn-input] ${inputCmd} | ${inputArgs}`);
  logger?.(`[spawn-input-env] ${env}`);
  const tokens = parseCommand(inputCmd);
  if (!tokens[0]) {
    throw new Error(`Unexpected empty command parsed from "${inputCmd}"`);
  }
  const cmd = tokens[0];
  const args = tokens.slice(1);
  args.push(...inputArgs);

  const mergedEnv = {
    ...process.env,
    ...env,
  };

  logger?.(`[spawn-run] ${cmd} | ${args}`);
  logger?.(`[spawn-run-env] ${mergedEnv}`);
  return new Promise((resolve, reject) => {
    const process = nodeSpawn(cmd, args, {
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
