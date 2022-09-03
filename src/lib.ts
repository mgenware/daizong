export function getArgsDisplayString(args: string[]) {
  return args
    .map((s) => {
      // If current argument has spaces, surround it with quotes.
      if (s.includes(' ')) {
        return `"${s}"`;
      }
      return s;
    })
    .join(' ');
}
