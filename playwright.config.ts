import { defineConfig, devices } from "@playwright/test";

/**
 * Two servers:
 *  - :4180  the production build with NO database (vite preview + the real
 *           vercel.json headers, CSP included) — public smoke, CSP, empty states;
 *  - :4181  a dev server pointed at a fake Supabase URL — every *.supabase.co
 *           request is answered by tests/e2e/mock-supabase.ts (stock, forms, admin).
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  // Software WebGL (SwiftShader) is CPU-heavy: more workers just time each other out.
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:4180",
    // Reduced motion by default (globe still renders, no animation loop) to keep
    // the CPU free; the CSP test opts back into full motion.
    reducedMotion: "reduce",
    locale: "ro-RO",
    trace: "retain-on-failure",
    launchOptions: {
      args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    },
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testIgnore: /admin|csp/ },
  ],
  webServer: [
    {
      // No database, whatever is in .env: blank Supabase vars override the file,
      // and the build goes to its own folder so the real dist/ is left alone.
      command:
        "bunx vite build --outDir dist-e2e --emptyOutDir && bunx vite preview --outDir dist-e2e --port 4180 --strictPort",
      url: "http://localhost:4180",
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: { VITE_SUPABASE_URL: "", VITE_SUPABASE_ANON_KEY: "" },
    },
    {
      command: "bunx vite --port 4181 --strictPort",
      url: "http://localhost:4181",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        VITE_SUPABASE_URL: "https://e2emock.supabase.co",
        VITE_SUPABASE_ANON_KEY: "e2e-anon-key",
      },
    },
  ],
});
