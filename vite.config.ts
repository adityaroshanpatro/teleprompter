import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * In production builds, lock the page down with a Content-Security-Policy that
 * forbids every kind of network request (connect-src 'none'). This makes the
 * "nothing leaves this machine" guarantee enforceable by the browser itself.
 * (Skipped in dev because Vite's HMR needs a websocket.)
 */
const lockdownCsp = (): Plugin => ({
  name: 'lockdown-csp',
  apply: 'build',
  transformIndexHtml: () => [
    {
      tag: 'meta',
      attrs: {
        'http-equiv': 'Content-Security-Policy',
        content: [
          "default-src 'self'",
          "script-src 'self'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob:",
          "media-src 'self' blob: mediastream:",
          "connect-src 'none'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'none'",
        ].join('; '),
      },
      injectTo: 'head-prepend',
    },
  ],
});

export default defineConfig({
  base: './',
  plugins: [react(), lockdownCsp()],
  server: { host: 'localhost', port: 5173 },
});
