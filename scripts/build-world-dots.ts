/**
 * Pre-computes the flat dotted world map used as a faint decorative texture.
 *
 * Output (committed, regenerate only if the look changes):
 *   public/images/world-dots.svg   equirectangular dot map, Romania in gold (CSS mask)
 *
 * Land is rasterised once into an equirectangular bitmap (even-odd scanline fill of
 * every Natural Earth 1:50m ring) so each sample is a lookup, not a point-in-polygon
 * test. Run: bun run build:map
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { geoContains } from "d3-geo";
import type { Feature, FeatureCollection, Geometry, Position } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import countriesTopo from "world-atlas/countries-110m.json" with { type: "json" };
import landTopo from "world-atlas/land-50m.json" with { type: "json" };

const ROMANIA_ID = "642";
const W = 4096;
const H = 2048;

const topo = countriesTopo as unknown as Topology<{ countries: GeometryCollection }>;
const countries = feature(topo, topo.objects.countries) as FeatureCollection<Geometry>;
const romania = countries.features.find((f) => String(f.id) === ROMANIA_ID) as Feature<Geometry>;
if (!romania) throw new Error("Romania not found in world-atlas");

const landT = landTopo as unknown as Topology<{ land: GeometryCollection }>;
const land = feature(landT, landT.objects.land) as FeatureCollection<Geometry>;

function rings(): Position[][] {
  const out: Position[][] = [];
  for (const f of land.features) {
    const g = f.geometry;
    if (g.type === "Polygon") out.push(...g.coordinates);
    else if (g.type === "MultiPolygon") for (const p of g.coordinates) out.push(...p);
  }
  return out;
}

// Even-odd scanline fill: per row, collect every edge crossing, sort, fill spans.
const mask = new Uint8Array(W * H);
const crossings: number[][] = Array.from({ length: H }, () => []);
for (const ring of rings()) {
  for (let i = 0; i < ring.length - 1; i++) {
    const [lon1 = 0, lat1 = 0] = ring[i] ?? [];
    const [lon2 = 0, lat2 = 0] = ring[i + 1] ?? [];
    const x1 = ((lon1 + 180) / 360) * W;
    const y1 = ((90 - lat1) / 180) * H;
    const x2 = ((lon2 + 180) / 360) * W;
    const y2 = ((90 - lat2) / 180) * H;
    if (y1 === y2 || Math.abs(x2 - x1) > W / 2) continue;
    const yMin = Math.ceil(Math.min(y1, y2) - 0.5);
    const yMax = Math.floor(Math.max(y1, y2) - 0.5);
    for (let y = Math.max(0, yMin); y <= Math.min(H - 1, yMax); y++) {
      const t = (y + 0.5 - y1) / (y2 - y1);
      crossings[y]?.push(x1 + t * (x2 - x1));
    }
  }
}
for (let y = 0; y < H; y++) {
  const xs = (crossings[y] ?? []).sort((a, b) => a - b);
  for (let k = 0; k + 1 < xs.length; k += 2) {
    const from = Math.max(0, Math.round(xs[k] ?? 0));
    const to = Math.min(W, Math.round(xs[k + 1] ?? 0));
    mask.fill(1, y * W + from, y * W + to);
  }
}
const onLand = (lon: number, lat: number) => {
  const x = Math.min(W - 1, Math.floor(((lon + 180) / 360) * W));
  const y = Math.min(H - 1, Math.floor(((90 - lat) / 180) * H));
  return mask[y * W + x] === 1;
};
const inRomania = (lon: number, lat: number) =>
  lat > 43.5 && lat < 48.4 && lon > 20 && lon < 30 && geoContains(romania, [lon, lat]);

// ---- flat dotted map (SVG) --------------------------------------------------
// 2° grid, latitude -56..76 (no Antarctica, no empty Arctic band).
const CELL = 2;
const LAT_TOP = 76;
const LAT_BOTTOM = -56;
const cols = 360 / CELL;
const rows = (LAT_TOP - LAT_BOTTOM) / CELL;
const circles: string[] = [];
for (let r = 0; r < rows; r++) {
  const lat = LAT_TOP - (r + 0.5) * CELL;
  for (let c = 0; c < cols; c++) {
    const lon = -180 + (c + 0.5) * CELL;
    if (!onLand(lon, lat)) continue;
    const ro = inRomania(lon, lat) || (lat > 43.5 && lat < 48.5 && lon > 21 && lon < 29.5);
    circles.push(
      `<circle cx="${c * 10 + 5}" cy="${r * 10 + 5}" r="${ro ? 3.4 : 2.6}"${ro ? ' class="ro"' : ""}/>`,
    );
  }
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cols * 10} ${rows * 10}" fill="currentColor"><style>.ro{fill:#a77c38}</style>${circles.join("")}</svg>\n`;
mkdirSync("public/images", { recursive: true });
writeFileSync("public/images/world-dots.svg", svg);

process.stdout.write(`map dots: ${circles.length}, svg ${(svg.length / 1024).toFixed(0)} KB
`);
