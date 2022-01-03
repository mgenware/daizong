import { spawn } from 'cross-spawn';

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

export default async function exec(
  inputCmd: string,
  inputArgs: string[],
  env: Record<string, string | undefined> | undefined,
): Promise<void> {
  if (!inputCmd.length) {
    throw new Error('Argument "cmd" cannot be empty');
  }

  const tokens = parseCommand(inputCmd);
  if (!tokens[0]) {
    throw new Error(`Unexpected empty command parsed from "${inputCmd}"`);
  }
  const cmd = tokens[0];
  const args = tokens.slice(1);
  args.push(...inputArgs);

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
