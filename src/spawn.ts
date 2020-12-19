import execa from 'execa';

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

  const subprocess = execa.command(cmd, { env: newEnv, shell: true });
  subprocess.stdout?.pipe(process.stdout);
  await subprocess;
}
