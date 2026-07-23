/// <reference types="vite/client" />

/**
 * Typed environment variables. Extending Vite's ImportMetaEnv means
 * `import.meta.env.VITE_API_URL` autocompletes and typechecks — add every
 * new VITE_ variable here as well as in .env.example.
 */
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_DEMO_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
