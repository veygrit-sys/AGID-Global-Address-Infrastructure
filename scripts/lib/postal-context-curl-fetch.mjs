import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

// Opt-in local transport for hosts whose certificate chain works with native TLS.
// Never read curlrc, disable verification, authenticate, or follow a redirect here.
export function createPostalCurlFetcher(executable, allowedHosts, runner = promisify(execFile)) {
  return async (url, options = {}) => {
    const target = new URL(url);
    if (target.protocol !== 'https:' || !allowedHosts.has(target.hostname) || target.username || target.password || target.port) throw new Error('unapproved-reference-host');
    if ((options.method && options.method !== 'GET') || options.body || options.headers || options.redirect !== 'manual') throw new Error('unsupported-curl-request');
    let stdout;
    try {
      ({ stdout } = await runner(executable, ['--disable', '--silent', '--show-error', '--include', '--suppress-connect-headers',
        '--proto', '=https', '--max-time', '25', '--max-filesize', '4194304', '--url', url],
      { encoding: 'buffer', maxBuffer: 4194304 + 65536, timeout: 25000, signal: options.signal, windowsHide: true }));
    } catch (error) {
      if (error.code === 60) throw new Error('curl-tls-verification-failed');
      if (error.code === 28 || error.name === 'AbortError' || error.killed) throw new Error('curl-timeout');
      if (error.code === 63 || error.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') throw new Error('reference-byte-limit');
      throw new Error('curl-network-error');
    }
    const bytes = Buffer.from(stdout), end = bytes.indexOf('\r\n\r\n');
    if (end < 0 || end > 65536) throw new Error('curl-invalid-response');
    const lines = bytes.subarray(0, end).toString('latin1').split('\r\n');
    const status = Number(lines.shift()?.match(/^HTTP\/(?:1\.[01]|2|3) (\d{3})(?: |$)/)?.[1]);
    if (!Number.isInteger(status) || status < 200 || status > 599) throw new Error('curl-invalid-response');
    const headers = new Headers();
    for (const line of lines) {
      const colon = line.indexOf(':'); if (colon < 1) throw new Error('curl-invalid-response');
      const key = line.slice(0, colon).toLowerCase();
      if (['content-type', 'content-length', 'last-modified', 'location'].includes(key)) {
        if (headers.has(key)) throw new Error('curl-invalid-response');
        headers.set(key, line.slice(colon + 1).trim());
      }
    }
    const body = bytes.subarray(end + 4);
    if (body.length > 4194304) throw new Error('reference-byte-limit');
    return new Response([204, 205, 304].includes(status) ? null : body, { status, headers });
  };
}
