export function credentialBytesEndingWith(last4: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]{4}$/.test(last4)) {
    throw new TypeError('Credential fixture suffix must be four safe display characters.');
  }
  return Uint8Array.from([0, 1, 2, 3, ...Buffer.from(last4, 'utf8')]);
}
