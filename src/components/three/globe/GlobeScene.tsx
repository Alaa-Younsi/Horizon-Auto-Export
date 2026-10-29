import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  ConeGeometry,
  CubicBezierCurve3,
  type Group,
  MathUtils,
  type Mesh,
  type PerspectiveCamera,
  Quaternion,
  TubeGeometry,
  Vector3,
} from "three";
import { BUCHAREST, DESTINATIONS, type Destination, decodeDots, latLonToVector3 } from "./geo";

/* ------------------------------------------------------------------ shaders */

const DOT_VERT = /* glsl */ `
  uniform float uSize;
  uniform float uScale;
  uniform float uProj;
  attribute float aRand;
  varying float vFacing;
  varying float vRand;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(mat3(modelViewMatrix) * position);
    vFacing = dot(n, normalize(-mv.xyz));
    vRand = aRand;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = max(1.0, uSize * uScale * uProj / -mv.z);
  }
`;

const DOT_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uPulse;
  varying float vFacing;
  varying float vRand;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float edge = smoothstep(0.5, 0.25, d);
    float face = smoothstep(-0.02, 0.45, vFacing);
    float wave = 1.0 - uPulse + uPulse * (0.6 + 0.4 * sin(uTime * 2.2 + vRand * 6.2831));
    gl_FragColor = vec4(uColor, edge * face * uOpacity * wave);
  }
`;

const SPHERE_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const SPHERE_FRAG = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uRim;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float f = pow(1.0 - max(dot(vNormal, vView), 0.0), 3.0);
    gl_FragColor = vec4(mix(uBase, uRim, f), 1.0);
  }
`;

const ATMO_FRAG = /* glsl */ `
  uniform vec3 uColor;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float d = abs(dot(vNormal, vView));
    float intensity = pow(smoothstep(0.0, 0.42, d), 3.0) * 1.05;
    gl_FragColor = vec4(uColor * intensity, intensity);
  }
`;

const ARC_VERT = /* glsl */ `
  varying float vT;
  void main() {
    vT = uv.x;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ARC_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uHead;
  uniform float uDrawn;
  uniform float uTail;
  varying float vT;
  void main() {
    float behind = uHead - vT;
    float trail = (behind >= 0.0 && behind <= uTail) ? pow(1.0 - behind / uTail, 1.8) : 0.0;
    float base = 0.32 * step(vT, uDrawn);
    float a = max(base, trail);
    vec3 col = mix(uColor, vec3(1.0), pow(trail, 6.0));
    gl_FragColor = vec4(col, a);
  }
`;

const STAR_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uDpr;
  attribute float aSize;
  attribute float aRand;
  varying float vTw;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vTw = 0.5 + 0.5 * sin(uTime * (0.5 + aRand * 1.2) + aRand * 40.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uDpr;
  }
`;

const STAR_FRAG = /* glsl */ `
  varying float vTw;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vec3(0.9, 0.86, 0.78), a * vTw * 0.75);
  }
`;

/* ------------------------------------------------------------------ pieces */

const RADIUS = 1;
// Brand inks only.
const NAVY_DEEP = "#040e24";
const NAVY_RIM = "#24447d";
const NAVY_GLOW = "#3d5a92";
const LAND = "#8e9cbd";
const GOLD = "#d5b67f";

function useDots(url: string, radius: number, stride: number) {
  const [positions, setPositions] = useState<Float32Array | null>(null);
  useEffect(() => {
    const ctrl = new AbortController();
    fetch(url, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then((buf) => {
        const all = decodeDots(buf, radius);
        if (stride <= 1) {
          setPositions(all);
          return;
        }
        // Phones: keep every Nth dot — same look, a fraction of the fill-rate.
        const n = Math.floor(all.length / 3 / stride);
        const out = new Float32Array(n * 3);
        for (let i = 0; i < n; i++)
          out.set(all.subarray(i * stride * 3, i * stride * 3 + 3), i * 3);
        setPositions(out);
      })
      .catch(() => {
        // Offline or blocked: the planet still renders with its arcs.
      });
    return () => ctrl.abort();
  }, [url, radius, stride]);
  return positions;
}

/** Drawing-buffer pixels per world unit at distance 1 (for world-sized points). */
function useProjScale() {
  const height = useThree((s) => s.size.height);
  const dpr = useThree((s) => s.viewport.dpr);
  const fov = useThree((s) => (s.camera as PerspectiveCamera).fov);
  return (height * dpr) / (2 * Math.tan(MathUtils.degToRad(fov) / 2));
}

interface DotsProps {
  url: string;
  color: string;
  size: number;
  opacity: number;
  pulse: number;
  radius: number;
  stride: number;
  scale: RefObject<number>;
}

function Dots({ url, color, size, opacity, pulse, radius, stride, scale }: DotsProps) {
  const positions = useDots(url, radius, stride);
  const proj = useProjScale();

  const geometry = useMemo(() => {
    if (!positions) return null;
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(positions, 3));
    const rand = new Float32Array(positions.length / 3);
    for (let i = 0; i < rand.length; i++) rand[i] = Math.random();
    g.setAttribute("aRand", new BufferAttribute(rand, 1));
    return g;
  }, [positions]);

  useEffect(() => () => geometry?.dispose(), [geometry]);

  const uniforms = useMemo(
    () => ({
      uColor: { value: new Color(color) },
      uSize: { value: size },
      uScale: { value: 1 },
      uProj: { value: 1 },
      uOpacity: { value: opacity },
      uTime: { value: 0 },
      uPulse: { value: pulse },
    }),
    [color, size, opacity, pulse],
  );

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uProj.value = proj;
    uniforms.uScale.value = scale.current ?? 1;
  });

  if (!geometry) return null;
  return (
    <points geometry={geometry}>
      <shaderMaterial
        vertexShader={DOT_VERT}
        fragmentShader={DOT_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={pulse > 0 ? AdditiveBlending : undefined}
      />
    </points>
  );
}

function Stars({ count }: { count: number }) {
  const dpr = useThree((s) => s.viewport.dpr);
  const geometry = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const rand = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 24;
      pos[i * 3 + 2] = -6 - Math.random() * 24;
      const r = Math.random();
      size[i] = r > 0.985 ? 2.4 : r > 0.9 ? 1.6 : 1;
      rand[i] = Math.random();
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(pos, 3));
    g.setAttribute("aSize", new BufferAttribute(size, 1));
    g.setAttribute("aRand", new BufferAttribute(rand, 1));
    return g;
  }, [count]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uDpr: { value: 1 } }), []);
  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uDpr.value = dpr;
  });
  return (
    <points geometry={geometry}>
      <shaderMaterial
        vertexShader={STAR_VERT}
        fragmentShader={STAR_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}

function Planet() {
  const sphereUniforms = useMemo(
    () => ({ uBase: { value: new Color(NAVY_DEEP) }, uRim: { value: new Color(NAVY_RIM) } }),
    [],
  );
  const atmoUniforms = useMemo(() => ({ uColor: { value: new Color(NAVY_GLOW) } }), []);
  return (
    <>
      <mesh>
        <sphereGeometry args={[RADIUS * 0.995, 128, 128]} />
        <shaderMaterial
          vertexShader={SPHERE_VERT}
          fragmentShader={SPHERE_FRAG}
          uniforms={sphereUniforms}
        />
      </mesh>
      <mesh scale={1.06}>
        <sphereGeometry args={[RADIUS, 96, 96]} />
        <shaderMaterial
          vertexShader={SPHERE_VERT}
          fragmentShader={ATMO_FRAG}
          uniforms={atmoUniforms}
          side={BackSide}
          blending={AdditiveBlending}
          transparent
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

const FLIGHT = 2.4; // seconds per flight
const REST = 3.2; // seconds between flights
const TAIL = 0.32;
const ARROW_GEOMETRY = new ConeGeometry(0.0065, 0.022, 12);

/** One export lane. It stays dark until the story's scroll progress unlocks it. */
function Arc({
  dest,
  index,
  animate,
  progress,
}: {
  dest: Destination;
  index: number;
  animate: boolean;
  progress: RefObject<number>;
}) {
  const arrow = useRef<Mesh>(null);
  const marker = useRef<Mesh>(null);
  const drawn = useRef(0);
  const startedAt = useRef<number | null>(null);

  const { curve, geometry } = useMemo(() => {
    const start = latLonToVector3(BUCHAREST.lat, BUCHAREST.lon, RADIUS);
    const end = latLonToVector3(dest.lat, dest.lon, RADIUS);
    const angle = start.angleTo(end);
    const lift = 1.03 + angle * 0.55;
    const c1 = start.clone().lerp(end, 0.25).normalize().multiplyScalar(lift);
    const c2 = start.clone().lerp(end, 0.75).normalize().multiplyScalar(lift);
    const c = new CubicBezierCurve3(start, c1, c2, end);
    return { curve: c, geometry: new TubeGeometry(c, 140, 0.0022, 6, false) };
  }, [dest]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const uniforms = useMemo(
    () => ({
      uColor: { value: new Color(dest.color) },
      uHead: { value: -1 },
      uDrawn: { value: 0 },
      uTail: { value: TAIL },
    }),
    [dest.color],
  );

  const markerPose = useMemo(() => {
    const p = latLonToVector3(dest.lat, dest.lon, RADIUS * 1.002);
    const q = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), p.clone().normalize());
    return { position: p, quaternion: q };
  }, [dest]);

  const tmpPos = useMemo(() => new Vector3(), []);
  const tmpTan = useMemo(() => new Vector3(), []);
  const up = useMemo(() => new Vector3(0, 1, 0), []);
  const quat = useMemo(() => new Quaternion(), []);

  useFrame((state) => {
    const unlocked = (progress.current ?? 0) * DESTINATIONS.length * 1.15 > index;
    if (marker.current) marker.current.visible = unlocked;
    const a = arrow.current;
    if (!unlocked) {
      startedAt.current = null;
      drawn.current = 0;
      uniforms.uHead.value = -1;
      uniforms.uDrawn.value = 0;
      if (a) a.visible = false;
      return;
    }
    if (!animate) {
      uniforms.uHead.value = 2;
      uniforms.uDrawn.value = 1;
      if (a) a.visible = false;
      return;
    }
    if (startedAt.current === null) startedAt.current = state.clock.elapsedTime;
    const t = state.clock.elapsedTime - startedAt.current;
    const local = (t % (FLIGHT + REST)) / FLIGHT;
    const head = Math.min(local, 1 + TAIL);
    drawn.current = Math.max(drawn.current, Math.min(head, 1));
    uniforms.uHead.value = head;
    uniforms.uDrawn.value = drawn.current;
    if (!a) return;
    const visible = head >= 0 && head <= 1;
    a.visible = visible;
    if (!visible) return;
    const p = Math.min(Math.max(head, 0.001), 0.999);
    curve.getPointAt(p, tmpPos);
    curve.getTangentAt(p, tmpTan);
    a.position.copy(tmpPos);
    a.quaternion.copy(quat.setFromUnitVectors(up, tmpTan.normalize()));
  });

  return (
    <group>
      <mesh geometry={geometry}>
        <shaderMaterial
          vertexShader={ARC_VERT}
          fragmentShader={ARC_FRAG}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
      <mesh ref={arrow} visible={false} geometry={ARROW_GEOMETRY}>
        <meshBasicMaterial color={dest.color} toneMapped={false} />
      </mesh>
      <mesh ref={marker} visible={false} {...markerPose}>
        <circleGeometry args={[0.0055, 24]} />
        <meshBasicMaterial color={dest.color} toneMapped={false} />
      </mesh>
    </group>
  );
}

function OriginBeacon({ animate }: { animate: boolean }) {
  const rings = useRef<Array<Mesh | null>>([]);
  const { position, quaternion } = useMemo(() => {
    const p = latLonToVector3(BUCHAREST.lat, BUCHAREST.lon, RADIUS * 1.003);
    const q = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), p.clone().normalize());
    return { position: p, quaternion: q };
  }, []);

  useFrame((state) => {
    rings.current.forEach((ring, i) => {
      if (!ring) return;
      const t = animate ? (state.clock.elapsedTime * 0.5 + i / 3) % 1 : 0.35 + i * 0.2;
      ring.scale.setScalar(0.4 + t * 3.2);
      const mat = ring.material;
      if (!Array.isArray(mat)) mat.opacity = (1 - t) * 0.85;
    });
  });

  return (
    <group position={position} quaternion={quaternion}>
      <mesh>
        <circleGeometry args={[0.009, 32]} />
        <meshBasicMaterial color="#f3eadb" toneMapped={false} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          ref={(el) => {
            rings.current[i] = el;
          }}
        >
          <ringGeometry args={[0.013, 0.0155, 64]} />
          <meshBasicMaterial color={GOLD} transparent depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ rig */

const DEG = Math.PI / 180;
/** Yaw that puts central Europe (~16°E) in front of the camera. */
const FACE_EUROPE_Y = -Math.PI / 2 - 16 * DEG;
/** Pitch that brings ~46°N to the centre of the disc. */
const FACE_EUROPE_X = 46 * DEG;
const CAMERA_Z = 7;

interface DragState {
  active: boolean;
  lastX: number;
  offset: number;
}

interface LabelSlot {
  el: HTMLDivElement | null;
  local: Vector3;
  dx: number;
  dy: number;
  /** Index in DESTINATIONS (unlock order); -1 = the origin, always shown. */
  index: number;
  alpha: number;
}

interface RigProps {
  animate: boolean;
  progress: RefObject<number>;
  drag: RefObject<DragState>;
  labels: RefObject<LabelSlot[]>;
  mobile: boolean;
}

function Rig({ animate, progress, drag, labels, mobile }: RigProps) {
  const outer = useRef<Group>(null);
  const spin = useRef<Group>(null);
  const scale = useRef(1);
  const smoothedP = useRef(0);
  const smoothedDrag = useRef(0);
  const placed = useRef(false);
  const camera = useThree((s) => s.camera as PerspectiveCamera);
  const size = useThree((s) => s.size);
  const tmp = useMemo(
    () => ({ w: new Vector3(), c: new Vector3(), n: new Vector3(), v: new Vector3() }),
    [],
  );

  useFrame((state, delta) => {
    const o = outer.current;
    const g = spin.current;
    if (!o || !g) return;
    const dt = Math.min(delta, 0.05);
    smoothedP.current = MathUtils.damp(smoothedP.current, progress.current ?? 0, 4, dt);
    const p = smoothedP.current;

    const vh = 2 * Math.tan(MathUtils.degToRad(camera.fov) / 2) * CAMERA_Z;
    const vw = vh * (size.width / size.height);
    const radius = Math.min(vh, vw) * 0.43;
    const k = placed.current ? 1 : 1e3;
    placed.current = true;
    scale.current = MathUtils.damp(scale.current, radius * (1 + p * 0.06), 6 * k, dt);
    o.scale.setScalar(scale.current);
    o.rotation.x = FACE_EUROPE_X - 0.08 + p * 0.06;

    const d = drag.current;
    if (d && !d.active) d.offset *= 1 - Math.min(dt * 0.5, 1); // drift back towards Europe
    smoothedDrag.current = MathUtils.damp(smoothedDrag.current, d?.offset ?? 0, 8, dt);
    const sway = animate ? Math.sin(state.clock.elapsedTime * 0.12) * 0.08 : 0;
    // The story sweeps the view from the Black Sea side towards the Atlantic as lanes unlock.
    g.rotation.y = FACE_EUROPE_Y + 0.32 - p * 0.5 + sway + smoothedDrag.current;

    // Project tags onto the DOM overlay: only cities facing the camera, inside the
    // frame, and already unlocked by the story.
    o.updateMatrixWorld();
    o.getWorldPosition(tmp.c);
    const unlockedCount = (progress.current ?? 0) * DESTINATIONS.length * 1.15;
    for (const slot of labels.current ?? []) {
      const el = slot.el;
      if (!el) continue;
      tmp.w.copy(slot.local).applyMatrix4(g.matrixWorld);
      tmp.n.copy(tmp.w).sub(tmp.c).normalize();
      tmp.v.copy(camera.position).sub(tmp.w).normalize();
      const facing = tmp.n.dot(tmp.v);
      tmp.w.project(camera);
      const x = (tmp.w.x * 0.5 + 0.5) * size.width + slot.dx;
      const y = (-tmp.w.y * 0.5 + 0.5) * size.height + slot.dy;
      const inFrame = x > 40 && x < size.width - 40 && y > 24 && y < size.height - 24;
      const unlocked = slot.index < 0 || unlockedCount > slot.index;
      const want = inFrame && unlocked && !mobile ? MathUtils.smoothstep(facing, 0.15, 0.4) : 0;
      const wantOrigin = slot.index < 0 && inFrame ? MathUtils.smoothstep(facing, 0.1, 0.3) : 0;
      slot.alpha = MathUtils.damp(slot.alpha, Math.max(want, wantOrigin), 8, dt);
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      el.style.opacity = slot.alpha.toFixed(3);
      el.style.visibility = slot.alpha < 0.02 ? "hidden" : "visible";
    }
  });

  return (
    <>
      <Stars count={mobile ? 300 : 700} />
      <group ref={outer}>
        <group ref={spin}>
          <Planet />
          <Dots
            url="/data/globe-land.bin"
            color={LAND}
            size={0.0044}
            opacity={0.85}
            pulse={0}
            radius={RADIUS}
            stride={mobile ? 2 : 1}
            scale={scale}
          />
          <Dots
            url="/data/globe-romania.bin"
            color={GOLD}
            size={0.0048}
            opacity={1}
            pulse={1}
            radius={RADIUS * 1.001}
            stride={1}
            scale={scale}
          />
          {DESTINATIONS.map((d, i) => (
            <Arc key={d.city} dest={d} index={i} animate={animate} progress={progress} />
          ))}
          <OriginBeacon animate={animate} />
        </group>
      </group>
    </>
  );
}

/* ------------------------------------------------------------------ canvas + labels */

export interface GlobeSceneProps {
  /** Render loop runs only while the globe is on screen. */
  active: boolean;
  animate: boolean;
  /** 0..1 — the scroll story's progress; unlocks the export lanes one by one. */
  progress: RefObject<number>;
  className?: string;
  label: string;
  /** "București" / "Bucharest" / "Bucarest". */
  origin: string;
}

const LABELLED = DESTINATIONS.map((d, index) => ({ ...d, index })).filter((d) => d.labelled);

export function GlobeScene({
  active,
  animate,
  progress,
  className,
  label,
  origin,
}: GlobeSceneProps) {
  const drag = useRef<DragState>({ active: false, lastX: 0, offset: 0 });
  const [mobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  const slots = useRef<LabelSlot[]>([
    ...LABELLED.map((d) => ({
      el: null,
      local: latLonToVector3(d.lat, d.lon, RADIUS),
      dx: d.dx,
      dy: d.dy,
      index: d.index,
      alpha: 0,
    })),
    {
      el: null,
      local: latLonToVector3(BUCHAREST.lat, BUCHAREST.lon, RADIUS),
      dx: 54,
      dy: 30,
      index: -1,
      alpha: 0,
    },
  ]);

  // Horizontal drags spin the planet; touch-action: pan-y keeps vertical swipes
  // scrolling the page (the browser cancels our pointer then).
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    drag.current = { ...drag.current, active: true, lastX: e.clientX };
    if (e.pointerType === "mouse") e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.active) return;
    d.offset += (e.clientX - d.lastX) * (e.pointerType === "mouse" ? 0.0045 : 0.007);
    d.lastX = e.clientX;
  };
  const onPointerUp = () => {
    drag.current.active = false;
  };

  return (
    <div
      className={className}
      role="img"
      aria-label={label}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <Canvas
        dpr={mobile ? [1, 1.5] : [1, 2]}
        camera={{ position: [0, 0, CAMERA_Z], fov: 34, near: 0.1, far: 60 }}
        gl={{ antialias: !mobile, alpha: true, powerPreference: "high-performance" }}
        // Off-screen: no frames. Reduced motion: render only on change.
        frameloop={active ? (animate ? "always" : "demand") : "never"}
      >
        <Rig animate={animate} progress={progress} drag={drag} labels={slots} mobile={mobile} />
      </Canvas>

      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {LABELLED.map((d, i) => (
          <div
            key={d.city}
            ref={(el) => {
              const slot = slots.current[i];
              if (slot) slot.el = el;
            }}
            className="invisible absolute top-0 left-0 opacity-0 will-change-transform"
          >
            <div className="flex items-center gap-1.5 rounded-full bg-navy-950/70 py-1 ps-2 pe-2.5 ring-1 ring-white/10 backdrop-blur-md">
              <span className="size-1.5 rounded-full bg-gold-300" />
              <span className="text-[11px] font-semibold whitespace-nowrap text-white">
                {d.city}
              </span>
              <span className="text-[9px] font-bold tracking-widest text-white/45">
                {d.country}
              </span>
            </div>
          </div>
        ))}
        <div
          ref={(el) => {
            const slot = slots.current[LABELLED.length];
            if (slot) slot.el = el;
          }}
          className="invisible absolute top-0 left-0 opacity-0 will-change-transform"
        >
          <div className="rounded-full bg-gold-500/20 px-3 py-1 ring-1 ring-gold-300/60 backdrop-blur-md">
            <p className="font-wide text-[11px] font-bold tracking-[0.22em] text-gold-200 uppercase">
              {origin}
            </p>
          </div>
          <p className="mt-1 text-center font-mono text-[9px] tracking-widest text-white/45">
            44°25′N · 26°06′E
          </p>
        </div>
      </div>
    </div>
  );
}
