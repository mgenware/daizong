const nodeEnv = 'NODE_ENV';

export function envPreset(name: string): Record<string, string> | null {
  switch (name) {
    case 'node:dev':
      return { [nodeEnv]: 'development' };

    case 'node:prod':
      return { [nodeEnv]: 'production' };

    default:
      return null;
  }
}
