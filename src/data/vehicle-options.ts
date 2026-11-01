import type { Lang } from "@/i18n/languages";

/**
 * The options staff tick on a vehicle (stored as these keys in
 * `vehicles.options`, labels here in the three site languages). Keys are
 * permanent: rename a label freely, never a key, or listings lose the option.
 * Keys must match ^[a-z0-9_]+$ (checked by migration 0011).
 */
export type OptionLabel = Record<Lang, string>;

export interface OptionGroup {
  id: "comfort" | "multimedia" | "safety" | "exterior";
  label: OptionLabel;
  options: Array<{ key: string; label: OptionLabel }>;
}

const o = (key: string, fr: string, ro: string, en: string) => ({ key, label: { fr, ro, en } });

export const OPTION_GROUPS: OptionGroup[] = [
  {
    id: "comfort",
    label: { fr: "Confort", ro: "Confort", en: "Comfort" },
    options: [
      o("ac", "Climatisation", "Aer condiționat", "Air conditioning"),
      o("climate_auto", "Climatisation automatique", "Climatronic", "Automatic climate control"),
      o("armrest", "Accoudoir", "Cotieră", "Armrest"),
      o("cruise", "Régulateur de vitesse", "Pilot automat", "Cruise control"),
      o(
        "acc",
        "Régulateur de vitesse adaptatif",
        "Pilot automat adaptiv",
        "Adaptive cruise control",
      ),
      o("heated_seats", "Sièges chauffants", "Scaune încălzite", "Heated seats"),
      o("power_seats", "Réglage électrique des sièges", "Scaune reglabile electric", "Power seats"),
      o(
        "power_seats_memory",
        "Réglage électrique des sièges avec fonction mémoire",
        "Scaune electrice cu memorie",
        "Power seats with memory",
      ),
      o("leather", "Sièges en cuir", "Scaune din piele", "Leather seats"),
      o("keyless", "Démarrage sans clé", "Pornire fără cheie", "Keyless start"),
      o("power_tailgate", "Hayon électrique", "Hayon electric", "Power tailgate"),
      o("electric_windows", "Vitres électriques", "Geamuri electrice", "Electric windows"),
      o("heated_wheel", "Volant chauffant", "Volan încălzit", "Heated steering wheel"),
      o("trip_computer", "Ordinateur de bord", "Computer de bord", "Trip computer"),
    ],
  },
  {
    id: "multimedia",
    label: { fr: "Multimédia", ro: "Multimedia", en: "Multimedia" },
    options: [
      o("navigation", "Système de navigation", "Sistem de navigație", "Navigation system"),
      o("bluetooth", "Bluetooth", "Bluetooth", "Bluetooth"),
      o(
        "carplay",
        "Apple CarPlay / Android Auto",
        "Apple CarPlay / Android Auto",
        "Apple CarPlay / Android Auto",
      ),
      o("hands_free", "Kit mains libres", "Sistem hands-free", "Hands-free kit"),
      o("usb", "Port USB", "Port USB", "USB port"),
      o("dab", "Radio DAB", "Radio DAB", "DAB radio"),
      o("cd", "Lecteur CD", "CD player", "CD player"),
      o(
        "wireless_charging",
        "Chargement par induction pour smartphones",
        "Încărcare wireless pentru telefon",
        "Wireless phone charging",
      ),
      o("voice_control", "Commande vocale", "Comandă vocală", "Voice control"),
      o("hud", "Affichage tête haute", "Head-up display", "Head-up display"),
      o("digital_cockpit", "Cockpit numérique", "Cockpit digital", "Digital cockpit"),
    ],
  },
  {
    id: "safety",
    label: {
      fr: "Sécurité et aides à la conduite",
      ro: "Siguranță și asistență",
      en: "Safety and assistance",
    },
    options: [
      o("abs", "ABS", "ABS", "ABS"),
      o("esp", "ESP", "ESP", "ESP"),
      o("immobilizer", "Antidémarrage", "Imobilizator", "Immobilizer"),
      o("isofix", "Isofix", "Isofix", "Isofix"),
      o(
        "emergency_brake",
        "Assistance au freinage d'urgence",
        "Asistență la frânare de urgență",
        "Emergency brake assist",
      ),
      o(
        "hill_start",
        "Assistance de démarrage en côte",
        "Asistență la pornirea în rampă",
        "Hill start assist",
      ),
      o("blind_spot", "Assistant d'angle mort", "Asistent unghi mort", "Blind spot assist"),
      o(
        "lane_assist",
        "Assistant de maintien de voie",
        "Asistent de menținere a benzii",
        "Lane keeping assist",
      ),
      o("parking_sensors", "Capteurs de stationnement", "Senzori de parcare", "Parking sensors"),
      o("rear_camera", "Caméra de recul", "Cameră marșarier", "Rear-view camera"),
      o("camera_360", "Caméra 360°", "Cameră 360°", "360° camera"),
      o("light_sensor", "Capteur de lumière", "Senzor de lumină", "Light sensor"),
      o("rain_sensor", "Capteur de pluie", "Senzor de ploaie", "Rain sensor"),
      o("service_book", "Carnet d'entretien", "Carte de service", "Service book"),
    ],
  },
  {
    id: "exterior",
    label: { fr: "Extérieur", ro: "Exterior", en: "Exterior" },
    options: [
      o("alloy_wheels", "Jantes alliage", "Jante din aliaj", "Alloy wheels"),
      o("led_headlights", "Phares LED", "Faruri LED", "LED headlights"),
      o("fog_lights", "Phare antibrouillard", "Proiectoare ceață", "Fog lights"),
      o("sunroof", "Toit ouvrant", "Trapă", "Sunroof"),
      o("panoramic_roof", "Toit panoramique", "Plafon panoramic", "Panoramic roof"),
      o("tow_bar", "Attelage", "Cârlig de remorcare", "Tow bar"),
      o(
        "tow_bar_detachable",
        "Attache remorque détachable",
        "Cârlig de remorcare detașabil",
        "Detachable tow bar",
      ),
      o("roof_rails", "Barres de toit", "Bare longitudinale", "Roof rails"),
      o("tinted_windows", "Vitres teintées", "Geamuri fumurii", "Tinted windows"),
      o("sport_pack", "Pack sport", "Pachet sport", "Sport package"),
      o("summer_tyres", "Pneus été", "Anvelope de vară", "Summer tyres"),
      o("winter_tyres", "Pneus hiver", "Anvelope de iarnă", "Winter tyres"),
    ],
  },
];

const BY_KEY = new Map(
  OPTION_GROUPS.flatMap((g) => g.options.map((x) => [x.key, x.label] as const)),
);

/** Label of an option key in a language; unknown (retired) keys are skipped by callers. */
export function optionLabel(key: string, lang: Lang): string | null {
  return BY_KEY.get(key)?.[lang] ?? null;
}

/** Keys in catalogue order (so the site lists them consistently), unknown keys dropped. */
export function sortOptions(keys: readonly string[]): string[] {
  const set = new Set(keys);
  return OPTION_GROUPS.flatMap((g) => g.options.map((x) => x.key)).filter((k) => set.has(k));
}
