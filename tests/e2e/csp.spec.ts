import { expect, test } from "@playwright/test";

/**
 * The production build behind the real vercel.json headers (vite preview reads
 * them): nothing the site does may be refused by its own Content-Security-Policy.
 * Full motion on purpose, so GSAP, Lenis and Motion all run.
 */
test.use({ reducedMotion: "no-preference" });

test("no CSP violations across the main pages", async ({ page }) => {
  const violations: string[] = [];
  page.on("console", (m) => {
    if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text());
  });
  const response = await page.goto("/ro");
  expect(response?.headers()["content-security-policy"]).toContain("default-src 'self'");
  for (const path of ["/ro", "/en/vehicles", "/fr/services", "/ro/contact", "/en/about"]) {
    await page.goto(path);
    await page.mouse.wheel(0, 2400);
    await page.waitForTimeout(1200);
  }
  expect(violations).toEqual([]);
});
