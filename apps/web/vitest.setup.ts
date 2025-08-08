// Minimal import.meta.env polyfill for tests
;(globalThis as any).import = { meta: { env: { VITE_API_URL: 'http://localhost:5000' } } }
