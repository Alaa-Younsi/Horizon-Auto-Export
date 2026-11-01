/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SITE_URL?: string;
  /** "true" only on a Supabase plan with Image Transformations (resized srcsets). */
  readonly VITE_SUPABASE_IMAGE_TRANSFORMS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
