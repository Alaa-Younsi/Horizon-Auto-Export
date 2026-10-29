import { expect, test } from "@playwright/test";
import { mockSupabase } from "./mock-supabase";

const MOCK = "http://localhost:4181";

test.describe("admin dashboard (mocked database)", () => {
  test("signed out: /admin goes to the login form", async ({ page }) => {
    await mockSupabase(page, {}, false);
    await page.goto(`${MOCK}/admin`);
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.getByRole("heading", { name: "Autentificare" })).toBeVisible();
  });

  test("owner sees every section and the KPIs", async ({ page }) => {
    await mockSupabase(page);
    await page.goto(`${MOCK}/admin`);
    await expect(page.getByRole("heading", { name: "Panou" })).toBeVisible();
    for (const label of ["Cereri", "Vehicule", "Mărci", "Setări site", "Echipă", "Contul meu"]) {
      await expect(page.getByRole("link", { name: label }).first()).toBeVisible();
    }
    await expect(page.getByText("Cereri noi")).toBeVisible();
    await expect(page.getByText("Andrei Popescu")).toBeVisible();
  });

  test("editing a vehicle writes ONLY editable columns (no relation keys -> no PGRST204)", async ({
    page,
  }) => {
    const mock = await mockSupabase(page);
    await page.goto(`${MOCK}/admin/vehicles/v-a6`);
    await expect(page.getByRole("heading", { name: "Editează vehiculul" })).toBeVisible();
    await page.getByLabel("Kilometraj (km)").fill("101000");
    await page.getByRole("button", { name: "Salvează" }).first().click();
    await expect(page.getByText("Salvat").first()).toBeVisible();
    const patch = mock.writes.find((w) => w.method === "PATCH" && w.table === "vehicles")
      ?.body as Record<string, unknown>;
    expect(patch.mileage_km).toBe(101000);
    for (const forbidden of [
      "id",
      "brand",
      "images",
      "created_at",
      "updated_at",
      "vin",
      "purchase_price",
    ]) {
      expect(patch, forbidden).not.toHaveProperty(forbidden);
    }
    const priv = mock.writes.find((w) => w.table === "vehicle_private")?.body as Record<
      string,
      unknown
    >;
    expect(priv.vehicle_id).toBe("v-a6");
    expect(priv.vin).toBe("WAUZZZ");
  });

  test("inquiry status changes from the pipeline list", async ({ page }) => {
    const mock = await mockSupabase(page);
    await page.goto(`${MOCK}/admin/inquiries`);
    await page.getByRole("combobox", { name: "Stare" }).first().selectOption("contacted");
    await expect
      .poll(() => mock.writes.some((w) => w.method === "PATCH" && w.table === "inquiries"))
      .toBe(true);
    const patch = mock.writes.find((w) => w.table === "inquiries")?.body as Record<string, unknown>;
    expect(patch).toEqual({ status: "contacted" });
  });

  test("a worker granted only inquiries never reaches vehicles", async ({ page }) => {
    await mockSupabase(page, {
      profile: { is_owner: false, sections: ["inquiries"], active: true },
    });
    await page.goto(`${MOCK}/admin/vehicles`);
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("link", { name: "Cereri" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Vehicule" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Echipă" })).toHaveCount(0);
  });

  test("a deactivated account sees 'no access' with a way out", async ({ page }) => {
    await mockSupabase(page, { profile: { is_owner: false, sections: [], active: false } });
    await page.goto(`${MOCK}/admin`);
    await expect(page.getByRole("heading", { name: "Fără acces" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Deconectare" })).toBeVisible();
  });
});
