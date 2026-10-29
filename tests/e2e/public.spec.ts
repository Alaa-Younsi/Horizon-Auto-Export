import { expect, type Page, test } from "@playwright/test";
import { mockSupabase } from "./mock-supabase";

const MOCK = "http://localhost:4181";

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    // SwiftShader/WebGL performance chatter is not an app error.
    if (m.type() === "error" && !/WebGL|GL_|GPU stall|swiftshader/i.test(m.text()))
      errors.push(m.text());
  });
  return errors;
}

test.describe("public site (production build, no database)", () => {
  test("root picks a language and the home page renders the mock-up's sections", async ({
    page,
  }) => {
    const errors = trackErrors(page);
    await page.goto("/");
    await expect(page).toHaveURL(/\/(ro|en|fr)$/);
    await page.goto("/ro");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Vehicule rulate");
    await expect(page.getByRole("link", { name: /Autoturisme/ }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Partenerul tău de încredere/ })).toBeAttached();
    await expect(page.getByRole("heading", { name: /De ce să ne alegi/ })).toBeAttached();
    await expect(page.getByRole("heading", { name: /Mărci disponibile/ })).toBeAttached();
    await expect(page.locator("footer")).toContainText("RO55177825");
    expect(errors).toEqual([]);
  });

  test("language switch keeps the page and translates it", async ({ page }) => {
    await page.goto("/ro/services");
    await page.getByRole("button", { name: /Limba/ }).click();
    await page.getByRole("button", { name: "English" }).click();
    await expect(page).toHaveURL(/\/en\/services$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Complete services");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await page.getByRole("button", { name: /Language/ }).click();
    await page.getByRole("button", { name: "Français" }).click();
    await expect(page).toHaveURL(/\/fr\/services$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  });

  test("a path without a language is redirected, unknown pages get a 404", async ({ page }) => {
    await page.goto("/vehicles");
    await expect(page).toHaveURL(/\/(ro|en|fr)\/vehicles$/);
    await page.goto("/en/no-such-page");
    await expect(page.getByRole("heading", { name: "Road closed" })).toBeVisible();
  });

  test("no stock is invented in production: the vehicles page offers sourcing instead", async ({
    page,
  }) => {
    await page.goto("/en/vehicles");
    await expect(page.getByText("Stock is being updated")).toBeVisible();
    await expect(page.getByText("Demo example")).toHaveCount(0);
    await page.getByRole("link", { name: "Send a request" }).click();
    await expect(page).toHaveURL(/\/en\/contact\?kind=sourcing$/);
    await expect(page.getByLabel(/Subject/)).toHaveValue("sourcing");
  });

  test("contact form validates in the visitor's language and explains a missing database", async ({
    page,
  }) => {
    await page.goto("/fr/contact");
    await page.getByRole("button", { name: "Envoyer la demande" }).click();
    await expect(
      page.getByText("Adresse e-mail invalide").or(page.getByText("Champ obligatoire")),
    ).toBeVisible();
    await expect(
      page.getByText("Votre accord est nécessaire pour pouvoir vous répondre"),
    ).toBeVisible();
    await page.getByLabel(/Nom et prénom/).fill("Jean Dupont");
    await page.getByLabel(/^E-mail/).fill("jean@example.fr");
    await page.getByLabel(/^Message/).fill("Je cherche trois utilitaires récents.");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Envoyer la demande" }).click();
    await expect(page.getByText(/pas encore actif/)).toBeVisible();
  });

  test("legal pages exist in every language", async ({ page }) => {
    for (const [lang, text] of [
      ["ro", "Politica de confidențialitate"],
      ["en", "Privacy policy"],
      ["fr", "Politique de confidentialité"],
    ] as const) {
      await page.goto(`/${lang}/privacy`);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(text);
      await expect(page.getByText(/RO55177825/).first()).toBeVisible();
    }
  });
});

test.describe("public site with stock (mocked database)", () => {
  test("filters the listing and keeps them in the URL", async ({ page }) => {
    await mockSupabase(page, {}, false);
    await page.goto(`${MOCK}/en/vehicles`);
    await expect(page.getByText("3 vehicles")).toBeVisible();
    await page.getByRole("tab", { name: "Commercial" }).click();
    await expect(page).toHaveURL(/category=commercial/);
    await expect(page.getByText("1 vehicle", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Volkswagen Crafter" })).toBeVisible();
    await page.getByRole("tab", { name: "All" }).click();
    await page.getByRole("searchbox", { name: /Search/ }).fill("audi");
    await expect(page.getByText("1 vehicle", { exact: true })).toBeVisible();
  });

  test("vehicle page shows specs and sends a vehicle inquiry through the RPC", async ({ page }) => {
    const mock = await mockSupabase(page, {}, false);
    await page.goto(`${MOCK}/ro/vehicles/audi-a6-avant-2021`);
    await expect(page.getByRole("heading", { level: 1, name: "Audi A6 Avant" })).toBeVisible();
    await expect(page.getByText("98.000 km").first()).toBeVisible();
    await expect(page.getByText("TVA deductibil").first()).toBeVisible();
    const form = page.locator("#inquiry");
    await form.getByLabel(/Nume și prenume/).fill("Andrei Popescu");
    await form.getByLabel(/^E-mail/).fill("andrei@example.ro");
    await form.getByLabel(/^Mesaj/).fill("Este disponibil pentru export în Germania?");
    await form.getByRole("checkbox").check();
    await page.waitForTimeout(2600); // a person takes a few seconds; the server checks it
    await form.getByRole("button", { name: "Trimite cererea" }).click();
    await expect(page.getByText("HAE-261029-0123456789")).toBeVisible();
    const sent = mock.writes.find((w) => w.table === "submit_inquiry")?.body as {
      p: Record<string, unknown>;
    };
    expect(sent.p.vehicle_id).toBe("v-a6");
    expect(sent.p.kind).toBe("vehicle");
    expect(sent.p.language).toBe("ro");
    expect(Number(sent.p.elapsed_ms)).toBeGreaterThan(2500);
    expect(sent.p).not.toHaveProperty("price");
  });

  test("an unknown or unpublished vehicle shows a helpful page, not an error", async ({ page }) => {
    await mockSupabase(page, {}, false);
    await page.goto(`${MOCK}/en/vehicles/nope`);
    await expect(
      page.getByRole("heading", { name: "This vehicle is no longer available" }),
    ).toBeVisible();
  });
});

test.describe("mobile navigation", () => {
  test("the menu opens, navigates and closes", async ({ page, isMobile }) => {
    test.skip(!isMobile, "phone layout only");
    await page.goto("/ro");
    await page.getByRole("button", { name: "Meniu" }).click();
    const menu = page.getByRole("navigation", { name: "Navigare principală" }).last();
    await menu.getByRole("link", { name: "Contact" }).click();
    await expect(page).toHaveURL(/\/ro\/contact$/);
    await expect(page.getByRole("button", { name: "Închide meniul" })).toHaveCount(0);
  });
});
