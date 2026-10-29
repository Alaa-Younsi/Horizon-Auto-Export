import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { Price } from "@/components/ui/Price";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { DEMO_VEHICLES } from "@/data/demo";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import type { Lang } from "@/i18n/languages";

function wrap(lang: Lang, ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/${lang}`]}>
        <LanguageProvider lang={lang}>{ui}</LanguageProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("<Price>", () => {
  it("renders 'price on request' for a NULL price, per language", () => {
    wrap("ro", <Price value={null} currency="EUR" />);
    expect(screen.getByText("Preț la cerere")).toBeInTheDocument();
  });
  it("formats a real price", () => {
    wrap("en", <Price value={18900} currency="EUR" />);
    expect(screen.getByText(/18,900/)).toBeInTheDocument();
  });
});

describe("<VehicleCard>", () => {
  const v = DEMO_VEHICLES[0];
  if (!v) throw new Error("demo data missing");

  it("links to the localized detail page and shows the key facts", () => {
    wrap("fr", <VehicleCard vehicle={v} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", `/fr/vehicles/${v.slug}`);
    expect(screen.getByText(v.title.fr ?? "")).toBeInTheDocument();
    expect(screen.getByText("TVA récupérable")).toBeInTheDocument();
    expect(screen.getByText("Diesel")).toBeInTheDocument();
  });

  it("flags demo vehicles and photo-less placeholders", () => {
    wrap("en", <VehicleCard vehicle={v} />);
    expect(screen.getByText("Demo example")).toBeInTheDocument();
    expect(screen.getByText("Photos coming soon")).toBeInTheDocument();
  });
});
