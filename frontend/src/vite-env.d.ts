/// <reference types="vite/client" />

/**
 * Extend the ImportMetaEnv interface to type-check environment variables.
 * This adds type safety when using `import.meta.env.VITE_API_URL`.
 */
interface ImportMetaEnv {
  /**
   * The base URL of the backend API.
   * - In development: http://localhost:8081
   * - In production: https://your-backend-url.com
   */
  readonly VITE_API_URL: string;
  
  /**
   * Optional: Add other environment variables here as needed.
   * For example:
   * readonly VITE_APP_TITLE: string;
   * readonly VITE_APP_VERSION: string;
   */
}

/**
 * Extend the ImportMeta interface to include the `env` property with
 * the typed `ImportMetaEnv` interface.
 */
interface ImportMeta {
  readonly env: ImportMetaEnv;
}