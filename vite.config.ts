import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// The production origin is substituted into index.html (%VITE_SITE_URL%).
// An obvious placeholder — never a real-looking domain — until it is set.
/** The official domain; VITE_SITE_URL overrides it (e.g. for a staging copy). */
const DEFAULT_SITE_URL = "https://horizonautoexport.com";

function vendorChunk(id: string): string | undefined {
  if (!id.includes("node_modules")) return undefined;
  if (/[\\/](gsap|lenis)[\\/]/.test(id)) return "scroll-fx";
  if (/[\\/]@supabase[\\/]/.test(id)) return "supabase";
  if (/[\\/](react|react-dom|scheduler|react-router)[\\/]/.test(id)) return "react";
  return undefined;
}

/** The production headers (CSP included) from vercel.json, so `vite preview` behaves like Vercel. */
function productionHeaders(): Record<string, string> {
  const vercel = JSON.parse(readFileSync("vercel.json", "utf8")) as {
    headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
  };
  const all = vercel.headers.find((h) => h.source === "/(.*)")?.headers ?? [];
  return Object.fromEntries(
    all.filter((h) => h.key !== "Strict-Transport-Security").map((h) => [h.key, h.value]),
  );
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  // a value still holding the .env.local "<...>" placeholder counts as unset
  const site = env.VITE_SITE_URL?.includes("<") ? "" : env.VITE_SITE_URL;
  process.env.VITE_SITE_URL = (site || DEFAULT_SITE_URL).replace(/\/+$/, "");

  return {
    plugins: [react(), tailwindcss()],
    preview: { headers: productionHeaders() },
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    build: {
      target: "es2022",
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: { manualChunks: vendorChunk },
      },
    },
  };
});
