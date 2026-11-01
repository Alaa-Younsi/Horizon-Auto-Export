/**
 * Keeps visitors on the latest deploy. index.html is never cached (vercel.json),
 * but a phone browser happily restores a tab it kept in memory for days, still
 * running the old bundle. Two guards:
 *
 * 1. A lazy chunk of the old bundle no longer exists after a deploy: Vite fires
 *    `vite:preloadError`; reload once to pick up the new index.html.
 * 2. When the tab comes back to the foreground (or is restored from the
 *    back/forward cache), compare our entry script with the one the server
 *    serves now; if it changed, reload. Public pages only — never the admin,
 *    where a reload could throw away a half-filled vehicle form.
 */
const RELOADED_AT = "hae-reloaded-at";
const MIN_CHECK_GAP_MS = 60_000;

function currentEntry(): string | null {
  const el = document.querySelector<HTMLScriptElement>(
    'script[type="module"][src*="/assets/index-"]',
  );
  return el ? new URL(el.src, location.href).pathname : null;
}

function reloadOnce() {
  try {
    const last = Number(sessionStorage.getItem(RELOADED_AT) ?? 0);
    if (Date.now() - last < 10_000) return; // never loop
    sessionStorage.setItem(RELOADED_AT, String(Date.now()));
  } catch {
    // storage blocked: still reload, the 60 s check gap limits repeats
  }
  location.reload();
}

let lastCheck = 0;
async function checkForNewDeploy() {
  if (location.pathname.startsWith("/admin")) return;
  if (Date.now() - lastCheck < MIN_CHECK_GAP_MS) return;
  lastCheck = Date.now();
  const mine = currentEntry();
  if (!mine) return; // dev server: no hashed entry
  try {
    const res = await fetch("/", { cache: "no-store" });
    if (!res.ok) return;
    const html = await res.text();
    const live = html.match(/\/assets\/index-[\w-]+\.js/)?.[0];
    if (live && live !== mine) reloadOnce();
  } catch {
    // offline: keep the page as it is
  }
}

export function keepFresh() {
  window.addEventListener("vite:preloadError", (e) => {
    e.preventDefault();
    reloadOnce();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void checkForNewDeploy();
  });
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) void checkForNewDeploy();
  });
}
