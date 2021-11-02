// A helper to get `err.message` on TypeScript 4.4
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function errMsg(err: any): string {
  return err?.message ? `${err.message}` : `${err}`;
}
