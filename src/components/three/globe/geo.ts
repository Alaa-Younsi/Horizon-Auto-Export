import { Vector3 } from "three";

const DEG = Math.PI / 180;

/** Lat/lon (degrees) -> point on a sphere of radius r (three-globe convention). */
export function latLonToVector3(lat: number, lon: number, r = 1, target = new Vector3()): Vector3 {
  const phi = (90 - lat) * DEG;
  const theta = (lon + 180) * DEG;
  return target.set(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

export const BUCHAREST = { lat: 44.4268, lon: 26.1025 } as const;

export interface Destination {
  city: string;
  /** ISO country code shown on the tag. */
  country: string;
  lat: number;
  lon: number;
  /** Only the logo's inks (+ white) — arcs alternate gold and pale navy. */
  color: string;
  /** Label offset from the city, in px (keeps the dense Western-Europe cluster readable). */
  dx: number;
  dy: number;
  labelled: boolean;
}

/**
 * Export lanes out of Bucharest, west to east-north. The order is also the
 * order in which scrolling the story "unlocks" each lane.
 */
export const DESTINATIONS: Destination[] = [
  {
    city: "Wien",
    country: "AT",
    lat: 48.2082,
    lon: 16.3738,
    color: "#d5b67f",
    dx: 0,
    dy: -30,
    labelled: true,
  },
  {
    city: "München",
    country: "DE",
    lat: 48.1351,
    lon: 11.582,
    color: "#c3cbe0",
    dx: -40,
    dy: 26,
    labelled: true,
  },
  {
    city: "Milano",
    country: "IT",
    lat: 45.4642,
    lon: 9.19,
    color: "#bf9653",
    dx: -10,
    dy: 30,
    labelled: true,
  },
  {
    city: "Warszawa",
    country: "PL",
    lat: 52.2297,
    lon: 21.0122,
    color: "#c3cbe0",
    dx: 30,
    dy: -28,
    labelled: true,
  },
  {
    city: "Berlin",
    country: "DE",
    lat: 52.52,
    lon: 13.405,
    color: "#d5b67f",
    dx: -6,
    dy: -32,
    labelled: true,
  },
  {
    city: "Amsterdam",
    country: "NL",
    lat: 52.3676,
    lon: 4.9041,
    color: "#bf9653",
    dx: -54,
    dy: -18,
    labelled: true,
  },
  {
    city: "Bruxelles",
    country: "BE",
    lat: 50.8503,
    lon: 4.3517,
    color: "#c3cbe0",
    dx: -58,
    dy: 12,
    labelled: false,
  },
  {
    city: "Paris",
    country: "FR",
    lat: 48.8566,
    lon: 2.3522,
    color: "#d5b67f",
    dx: -52,
    dy: 22,
    labelled: true,
  },
  {
    city: "Lyon",
    country: "FR",
    lat: 45.764,
    lon: 4.8357,
    color: "#c3cbe0",
    dx: -40,
    dy: 26,
    labelled: false,
  },
  {
    city: "Madrid",
    country: "ES",
    lat: 40.4168,
    lon: -3.7038,
    color: "#bf9653",
    dx: -50,
    dy: 18,
    labelled: true,
  },
  {
    city: "Lisboa",
    country: "PT",
    lat: 38.7223,
    lon: -9.1393,
    color: "#d5b67f",
    dx: -50,
    dy: 10,
    labelled: false,
  },
  {
    city: "Athína",
    country: "GR",
    lat: 37.9838,
    lon: 23.7275,
    color: "#c3cbe0",
    dx: 20,
    dy: 26,
    labelled: true,
  },
];

/** Decode the committed Int16 [lat*100, lon*100] pairs into sphere positions. */
export function decodeDots(buffer: ArrayBuffer, radius: number): Float32Array {
  const pairs = new Int16Array(buffer);
  const out = new Float32Array((pairs.length / 2) * 3);
  const v = new Vector3();
  for (let i = 0, j = 0; i < pairs.length; i += 2, j += 3) {
    latLonToVector3((pairs[i] ?? 0) / 100, (pairs[i + 1] ?? 0) / 100, radius, v);
    out[j] = v.x;
    out[j + 1] = v.y;
    out[j + 2] = v.z;
  }
  return out;
}
