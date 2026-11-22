import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { ThreeEvent } from "@react-three/fiber";
import { SPECS, type VehicleId } from "../sim/specs";
import { world } from "../world";
import { useUI } from "../store";
import { blobShadow, softDot } from "./textures";
import { eclipseSide, plateTexture, r34Side, supraSide, topStripes } from "./liveries";

type P2 = [number, number];

type CarLook = {
  id: Exclude<VehicleId, "bike">;
  body: string;
  metal: number;
  top: P2[];
  rearX: number;
  frontX: number;
  cabin: P2[];
  side: () => THREE.Texture;
  stripe: string | null;
  rim: string;
  caliper: string;
  wing: "gt" | "hoop" | "duck";
  head: "square" | "round" | "slim";
  tail: "quad" | "round" | "strip";
  plate: string;
  intercooler: boolean;
  headPos: P2;
};

const WHEEL_R = 0.34;
const WHEEL_X = 1.36;
const TRACK = 0.77;
const WIDTH = 1.8;
const BEVEL = 0.07;
const BOTTOM = 0.2;

const LOOKS: Record<CarLook["id"], CarLook> = {
  r34: {
    id: "r34", body: "#c3c7cc", metal: 0.75, rearX: -2.3, frontX: 2.34,
    top: [[-2.32, 0.74], [-2.22, 0.86], [-1.7, 0.92], [-1.25, 0.93], [0.95, 0.9], [1.7, 0.84], [2.2, 0.74], [2.34, 0.58]],
    cabin: [[-1.3, 0.9], [-0.72, 1.32], [0.25, 1.35], [1.0, 0.88]],
    side: r34Side, stripe: "#1557ff", rim: "#202227", caliper: "#d21f2b", wing: "gt", head: "square", tail: "quad",
    plate: "KR·0877", intercooler: true, headPos: [2.36, 0.62],
  },
  supra: {
    id: "supra", body: "#ff7410", metal: 0.35, rearX: -2.26, frontX: 2.3,
    top: [[-2.26, 0.7], [-2.12, 0.86], [-1.5, 0.91], [-1.05, 0.92], [0.8, 0.86], [1.6, 0.74], [2.15, 0.6], [2.3, 0.44]],
    cabin: [[-1.25, 0.9], [-0.55, 1.26], [0.15, 1.28], [0.9, 0.85]],
    side: supraSide, stripe: null, rim: "#c79a2e", caliper: "#1d1d1d", wing: "hoop", head: "round", tail: "round",
    plate: "2JZ·GTE", intercooler: true, headPos: [2.27, 0.53],
  },
  eclipse: {
    id: "eclipse", body: "#86f20f", metal: 0.3, rearX: -2.2, frontX: 2.3,
    top: [[-2.2, 0.76], [-2.06, 0.87], [-1.45, 0.9], [0.7, 0.86], [1.6, 0.7], [2.2, 0.55], [2.3, 0.42]],
    cabin: [[-1.55, 0.89], [-0.6, 1.25], [0.1, 1.26], [0.78, 0.85]],
    side: eclipseSide, stripe: null, rim: "#d9dde3", caliper: "#1f5bff", wing: "duck", head: "slim", tail: "strip",
    plate: "GSX·420", intercooler: false, headPos: [2.27, 0.52],
  },
};

function bodyGeometry(look: CarLook) {
  const s = new THREE.Shape();
  const first = look.top[0]!;
  const last = look.top[look.top.length - 1]!;
  s.moveTo(look.rearX, BOTTOM + 0.04);
  s.lineTo(first[0], first[1]);
  s.splineThru(look.top.slice(1).map(([x, y]) => new THREE.Vector2(x, y)));
  s.lineTo(look.frontX + 0.02, BOTTOM + 0.04);
  // bottom edge, front -> rear, with wheel arches
  const archR = 0.44;
  for (const ax of [WHEEL_X, -WHEEL_X]) {
    s.lineTo(ax + archR, BOTTOM);
    s.lineTo(ax + archR, WHEEL_R);
    s.absarc(ax, WHEEL_R, archR, 0, Math.PI, false);
    s.lineTo(ax - archR, BOTTOM);
  }
  s.lineTo(look.rearX, BOTTOM + 0.04);
  const depth = WIDTH - BEVEL * 2;
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: BEVEL, bevelSize: 0.06, bevelSegments: 4, curveSegments: 28 });
  g.translate(0, 0, -depth / 2);
  g.computeVertexNormals();
  return { g, depth };
}

function cabinGeometry(look: CarLook) {
  const s = new THREE.Shape(look.cabin.map(([x, y]) => new THREE.Vector2(x, y)));
  const depth = WIDTH * 0.8;
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 3 });
  g.translate(0, 0, -depth / 2);
  return g;
}

const lit = (r: number, g: number, b: number) => new THREE.Color(r, g, b);

function Wheel({ x, z, front, rim, caliper, onRig, r = WHEEL_R, width = 0.27, bike = false }: {
  x: number; z: number; front: boolean; rim: string; caliper: string;
  onRig: (spin: THREE.Object3D, steer: THREE.Object3D | null) => void; r?: number; width?: number; bike?: boolean;
}) {
  const steer = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    if (spin.current) onRig(spin.current, front ? steer.current : null);
  }, [front, onRig]);
  const spokes = bike ? 5 : 6;
  const side = z >= 0 ? 1 : -1;
  return (
    <group position={[x, r, z]}>
      <group ref={steer}>
        {/* brake caliper (does not spin) */}
        <mesh position={[0.12, 0.1, -side * (bike ? 0.02 : 0.05)]} rotation={[0, 0, 0.6]}>
          <boxGeometry args={[0.16, 0.1, 0.06]} />
          <meshStandardMaterial color={caliper} roughness={0.4} metalness={0.3} />
        </mesh>
        <group ref={spin}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[r, r, width, 32, 1]} />
            <meshStandardMaterial color="#121214" roughness={0.85} />
          </mesh>
          <mesh position={[0, 0, side * (width / 2 - 0.01)]}>
            <torusGeometry args={[r - 0.03, 0.028, 8, 32]} />
            <meshStandardMaterial color="#1b1b1e" roughness={0.6} />
          </mesh>
          {/* brake disc */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -side * 0.02]}>
            <cylinderGeometry args={[r * 0.62, r * 0.62, 0.025, 24]} />
            <meshStandardMaterial color="#8d9098" metalness={0.9} roughness={0.35} />
          </mesh>
          {/* rim */}
          <group position={[0, 0, side * (width / 2 - 0.03)]}>
            <mesh>
              <torusGeometry args={[r * 0.7, 0.025, 8, 32]} />
              <meshStandardMaterial color={rim} metalness={0.9} roughness={0.2} />
            </mesh>
            {Array.from({ length: spokes }, (_, i) => (
              <mesh key={i} rotation={[0, 0, (i / spokes) * Math.PI * 2]} position={[0, 0, 0]}>
                <boxGeometry args={[0.04, r * 1.38, 0.03]} />
                <meshStandardMaterial color={rim} metalness={0.9} roughness={0.22} />
              </mesh>
            ))}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.05, 12]} />
              <meshStandardMaterial color="#e6e8ec" metalness={1} roughness={0.15} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

function useRig(id: VehicleId) {
  const rig = world.vehicles[id];
  return useMemo(() => {
    rig.wheels = [];
    rig.steerers = [];
    return (spin: THREE.Object3D, steer: THREE.Object3D | null) => {
      if (!rig.wheels.includes(spin)) rig.wheels.push(spin);
      if (steer && !rig.steerers.includes(steer)) rig.steerers.push(steer);
    };
  }, [rig]);
}

function Underglow({ color, length, width }: { color: string; length: number; width: number }) {
  const dot = useMemo(() => softDot(), []);
  const c = useMemo(() => new THREE.Color(color), [color]);
  const hot = useMemo(() => new THREE.Color(color).multiplyScalar(4), [color]);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.025, 0]} renderOrder={2}>
        <planeGeometry args={[length * 1.45, width * 2.4]} />
        <meshBasicMaterial map={dot} color={c} transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.012, 0]}>
        <planeGeometry args={[length * 1.05, width * 1.4]} />
        <meshBasicMaterial map={blobShadow()} transparent opacity={0.9} depthWrite={false} color="#000000" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, 0.16, s * (width / 2 - 0.05)]}>
          <boxGeometry args={[length * 0.62, 0.025, 0.025]} />
          <meshBasicMaterial color={hot} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function CarModel({ look }: { look: CarLook }) {
  const onRig = useRig(look.id);
  const { g: bodyG, depth } = useMemo(() => bodyGeometry(look), [look]);
  const cabinG = useMemo(() => cabinGeometry(look), [look]);
  const mats = useMemo(() => {
    const side = look.side();
    const top = topStripes(`top-${look.id}`, look.body, look.stripe, depth, BEVEL);
    const common = { metalness: look.metal, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.4 };
    return [
      new THREE.MeshPhysicalMaterial({ ...common, map: side }),
      new THREE.MeshPhysicalMaterial({ ...common, map: top }),
    ];
  }, [look, depth]);
  const plate = useMemo(() => plateTexture(look.plate), [look.plate]);
  const bodyColor = look.body;
  const head = lit(3, 2.9, 2.6);
  const tail = lit(3.2, 0.12, 0.15);
  const roofTop = look.cabin.reduce((m, p) => Math.max(m, p[1]), 0);
  const roofX = (look.cabin[1]![0] + look.cabin[2]![0]) / 2;
  const roofLen = look.cabin[2]![0] - look.cabin[1]![0];
  const rearDeck = look.top[1]![1];
  const exhaustX = look.rearX - 0.1;

  return (
    <group rotation-y={-Math.PI / 2}>
      <mesh geometry={bodyG} material={mats} />
      <mesh geometry={cabinG}>
        <meshPhysicalMaterial color="#070a12" metalness={0.3} roughness={0.04} transparent opacity={0.82} envMapIntensity={2.2} clearcoat={1} />
      </mesh>
      {/* roof skin */}
      <mesh position={[roofX, roofTop + 0.035, 0]}>
        <boxGeometry args={[roofLen + 0.1, 0.05, WIDTH * 0.8]} />
        <meshPhysicalMaterial color={bodyColor} metalness={look.metal} roughness={0.28} clearcoat={1} />
      </mesh>
      {look.stripe && (
        <>
          {[-0.17, 0.17].map((z) => (
            <mesh key={z} position={[roofX, roofTop + 0.062, z]}>
              <boxGeometry args={[roofLen + 0.1, 0.005, 0.17]} />
              <meshStandardMaterial color={look.stripe!} metalness={0.4} roughness={0.3} />
            </mesh>
          ))}
        </>
      )}
      {/* interior: seats + glow */}
      {[-0.38, 0.38].map((z) => (
        <mesh key={z} position={[-0.25, 0.95, z]}>
          <boxGeometry args={[0.5, 0.5, 0.45]} />
          <meshStandardMaterial color={look.id === "r34" ? "#1d3fbf" : "#1a1a1d"} roughness={0.8} />
        </mesh>
      ))}
      {look.id === "r34" && (
        <mesh position={[0.55, 0.9, 0]}>
          <boxGeometry args={[0.12, 0.02, 1.2]} />
          <meshBasicMaterial color={lit(0.3, 0.8, 3)} toneMapped={false} />
        </mesh>
      )}
      {/* mirrors */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0.78, 1.02, s * 0.98]}>
          <boxGeometry args={[0.16, 0.09, 0.12]} />
          <meshPhysicalMaterial color={bodyColor} metalness={look.metal} roughness={0.3} clearcoat={1} />
        </mesh>
      ))}
      {/* front lip + side skirts + diffuser */}
      <mesh position={[look.frontX - 0.1, 0.17, 0]}>
        <boxGeometry args={[0.35, 0.05, WIDTH + 0.04]} />
        <meshStandardMaterial color="#0d0e11" roughness={0.5} metalness={0.5} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, 0.2, s * (WIDTH / 2 + 0.02)]}>
          <boxGeometry args={[2.0, 0.09, 0.06]} />
          <meshStandardMaterial color="#121317" roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[look.rearX + 0.1, 0.2, 0]}>
        <boxGeometry args={[0.3, 0.06, WIDTH - 0.2]} />
        <meshStandardMaterial color="#0d0e11" roughness={0.5} />
      </mesh>
      {/* intercooler / grille */}
      {look.intercooler && (
        <group position={[look.frontX + 0.07, 0.36, 0]}>
          <mesh>
            <boxGeometry args={[0.04, 0.2, 1.05]} />
            <meshStandardMaterial color="#9aa1ab" metalness={0.95} roughness={0.25} />
          </mesh>
          {Array.from({ length: 7 }, (_, i) => (
            <mesh key={i} position={[0.022, -0.085 + i * 0.028, 0]}>
              <boxGeometry args={[0.005, 0.008, 1.03]} />
              <meshStandardMaterial color="#3b3f46" metalness={0.8} roughness={0.4} />
            </mesh>
          ))}
        </group>
      )}
      {/* headlights */}
      {[-1, 1].map((s) =>
        look.head === "round" ? (
          <group key={s} position={[look.headPos[0], look.headPos[1], s * 0.62]}>
            {[0, 0.17].map((dz) => (
              <mesh key={dz} rotation={[0, 0, Math.PI / 2]} position={[0, 0, s * -dz]}>
                <cylinderGeometry args={[0.07, 0.07, 0.1, 20]} />
                <meshBasicMaterial color={head} toneMapped={false} />
              </mesh>
            ))}
          </group>
        ) : (
          <mesh key={s} position={[look.headPos[0], look.headPos[1], s * 0.6]} rotation={[0, 0, look.head === "slim" ? -0.5 : -0.2]}>
            <boxGeometry args={[0.14, look.head === "slim" ? 0.06 : 0.11, 0.42]} />
            <meshBasicMaterial color={head} toneMapped={false} />
          </mesh>
        ),
      )}
      {/* tail lights */}
      {[-1, 1].map((s) =>
        look.tail === "quad" ? (
          <group key={s}>
            {[0.42, 0.7].map((z) => (
              <mesh key={z} position={[look.rearX - 0.07, 0.66, s * z]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.085, 0.085, 0.05, 24]} />
                <meshBasicMaterial color={tail} toneMapped={false} />
              </mesh>
            ))}
          </group>
        ) : look.tail === "round" ? (
          <mesh key={s} position={[look.rearX - 0.07, 0.66, s * 0.58]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.11, 0.11, 0.05, 24]} />
            <meshBasicMaterial color={tail} toneMapped={false} />
          </mesh>
        ) : (
          <mesh key={s} position={[look.rearX - 0.07, 0.68, s * 0.45]}>
            <boxGeometry args={[0.05, 0.07, 0.75]} />
            <meshBasicMaterial color={tail} toneMapped={false} />
          </mesh>
        ),
      )}
      {/* plates */}
      {[look.rearX - 0.075, look.frontX + 0.075].map((x, i) => (
        <mesh key={i} position={[x, i ? 0.3 : 0.46, 0]} rotation={[0, i ? Math.PI / 2 : -Math.PI / 2, 0]}>
          <planeGeometry args={[0.52, 0.19]} />
          <meshStandardMaterial map={plate} roughness={0.5} />
        </mesh>
      ))}
      {/* rear wing */}
      <Wing kind={look.wing} x={look.rearX + 0.28} deck={rearDeck} color={bodyColor} metal={look.metal} />
      {/* exhaust */}
      <group position={[exhaustX, 0.3, 0.5]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.075, 0.068, 0.32, 20, 1, true]} />
          <meshStandardMaterial color="#7f8fb8" metalness={1} roughness={0.18} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.155, 0, 0]}>
          <circleGeometry args={[0.062, 20]} />
          <meshBasicMaterial color="#020203" side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* wheels */}
      <Wheel x={WHEEL_X} z={-TRACK} front rim={look.rim} caliper={look.caliper} onRig={onRig} />
      <Wheel x={WHEEL_X} z={TRACK} front rim={look.rim} caliper={look.caliper} onRig={onRig} />
      <Wheel x={-WHEEL_X} z={-TRACK} front={false} rim={look.rim} caliper={look.caliper} onRig={onRig} />
      <Wheel x={-WHEEL_X} z={TRACK} front={false} rim={look.rim} caliper={look.caliper} onRig={onRig} />
    </group>
  );
}

function Wing({ kind, x, deck, color, metal }: { kind: CarLook["wing"]; x: number; deck: number; color: string; metal: number }) {
  if (kind === "duck") {
    return (
      <mesh position={[x - 0.1, deck + 0.1, 0]} rotation={[0, 0, 0.18]}>
        <boxGeometry args={[0.32, 0.04, 1.6]} />
        <meshPhysicalMaterial color={color} metalness={metal} roughness={0.3} clearcoat={1} />
      </mesh>
    );
  }
  const h = kind === "hoop" ? 0.38 : 0.3;
  return (
    <group position={[x, deck, 0]}>
      {[-0.55, 0.55].map((z) => (
        <mesh key={z} position={[0, h / 2, z]} rotation={[0, 0, kind === "hoop" ? -0.25 : 0]}>
          <boxGeometry args={[0.1, h, 0.035]} />
          <meshStandardMaterial color="#111216" metalness={0.6} roughness={0.35} />
        </mesh>
      ))}
      <mesh position={[kind === "hoop" ? -0.05 : 0, h + 0.02, 0]} rotation={[0, 0, 0.12]}>
        <boxGeometry args={[0.42, 0.05, kind === "hoop" ? 1.75 : 1.62]} />
        <meshPhysicalMaterial color={kind === "gt" ? "#15171c" : color} metalness={kind === "gt" ? 0.6 : metal} roughness={0.3} clearcoat={1} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, h + 0.06, s * (kind === "hoop" ? 0.88 : 0.82)]}>
          <boxGeometry args={[0.46, 0.18, 0.02]} />
          <meshStandardMaterial color="#15171c" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function BikeModel() {
  const onRig = useRig("bike");
  const fairing = useMemo(() => {
    const s = new THREE.Shape();
    const pts: P2[] = [[-0.1, 0.5], [-0.2, 0.78], [-0.05, 0.92], [0.22, 1.06], [0.46, 1.04], [0.64, 1.12], [0.84, 1.0], [0.93, 0.8], [0.68, 0.46], [0.25, 0.36]];
    s.moveTo(pts[0]![0], pts[0]![1]);
    s.splineThru(pts.slice(1, 7).map(([x, y]) => new THREE.Vector2(x, y)));
    pts.slice(7).forEach(([x, y]) => s.lineTo(x, y));
    s.closePath();
    const depth = 0.2;
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 4 });
    g.translate(0, 0, -depth / 2);
    return g;
  }, []);
  const tail = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.2, 0.72);
    s.lineTo(-0.98, 0.98);
    s.lineTo(-0.92, 1.04);
    s.lineTo(-0.45, 0.94);
    s.lineTo(-0.15, 0.9);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 3 });
    g.translate(0, 0, -0.06);
    return g;
  }, []);
  const belly = useMemo(() => {
    const s = new THREE.Shape([new THREE.Vector2(-0.2, 0.3), new THREE.Vector2(0.55, 0.3), new THREE.Vector2(0.7, 0.5), new THREE.Vector2(0.2, 0.62), new THREE.Vector2(-0.3, 0.55)]);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.26, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 });
    g.translate(0, 0, -0.13);
    return g;
  }, []);
  const purple = useMemo(() => lit(2.6, 0.4, 4), []);
  return (
    <group rotation-y={-Math.PI / 2}>
      <mesh geometry={fairing}>
        <meshPhysicalMaterial color="#f2f3f5" metalness={0.15} roughness={0.25} clearcoat={1} clearcoatRoughness={0.03} />
      </mesh>
      <mesh geometry={tail}>
        <meshPhysicalMaterial color="#f2f3f5" metalness={0.15} roughness={0.25} clearcoat={1} clearcoatRoughness={0.03} />
      </mesh>
      {/* tank */}
      <mesh position={[0.12, 0.98, 0]} scale={[1.4, 0.7, 0.9]}>
        <sphereGeometry args={[0.2, 24, 16]} />
        <meshPhysicalMaterial color="#16171b" metalness={0.5} roughness={0.25} clearcoat={1} />
      </mesh>
      <mesh geometry={belly}>
        <meshStandardMaterial color="#141519" metalness={0.4} roughness={0.45} />
      </mesh>
      {/* engine block + headers */}
      <mesh position={[0.15, 0.48, 0]}>
        <boxGeometry args={[0.42, 0.3, 0.34]} />
        <meshStandardMaterial color="#2b2d33" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* seat */}
      <mesh position={[-0.38, 0.95, 0]} rotation={[0, 0, 0.14]}>
        <boxGeometry args={[0.42, 0.07, 0.2]} />
        <meshStandardMaterial color="#0e0f12" roughness={0.9} />
      </mesh>
      {/* windscreen */}
      <mesh position={[0.62, 1.16, 0]} rotation={[0, 0, -0.6]}>
        <boxGeometry args={[0.26, 0.015, 0.26]} />
        <meshPhysicalMaterial color="#1a2030" transparent opacity={0.65} roughness={0.05} />
      </mesh>
      {/* headlights */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0.9, 0.86, s * 0.08]} rotation={[0, 0, -0.4]}>
          <boxGeometry args={[0.05, 0.04, 0.1]} />
          <meshBasicMaterial color={lit(3, 3, 2.8)} toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[-1.0, 1.0, 0]}>
        <boxGeometry args={[0.03, 0.04, 0.16]} />
        <meshBasicMaterial color={lit(3.2, 0.1, 0.2)} toneMapped={false} />
      </mesh>
      {/* fork */}
      {[-0.09, 0.09].map((z) => (
        <mesh key={z} position={[0.66, 0.66, z]} rotation={[0, 0, 0.42]}>
          <cylinderGeometry args={[0.025, 0.025, 0.78, 10]} />
          <meshStandardMaterial color="#d4a63a" metalness={1} roughness={0.2} />
        </mesh>
      ))}
      {/* clip-ons */}
      <mesh position={[0.5, 1.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.6, 8]} />
        <meshStandardMaterial color="#111" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* mirrors */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0.66, 1.08, s * 0.22]}>
          <boxGeometry args={[0.05, 0.04, 0.09]} />
          <meshStandardMaterial color="#f2f3f5" metalness={0.2} roughness={0.3} />
        </mesh>
      ))}
      {/* swingarm */}
      <mesh position={[-0.42, 0.36, 0.06]} rotation={[0, 0, 0.08]}>
        <boxGeometry args={[0.62, 0.07, 0.05]} />
        <meshStandardMaterial color="#1a1b1f" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* exhaust can */}
      <group position={[-0.5, 0.56, 0.18]} rotation={[0, 0, -0.32]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.06, 0.46, 18]} />
          <meshStandardMaterial color="#3a3f52" metalness={1} roughness={0.2} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.235, 0, 0]}>
          <circleGeometry args={[0.05, 16]} />
          <meshBasicMaterial color="#020203" side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* purple underglow strips on the fairing */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[0.2, 0.4, s * 0.2]} rotation={[0, 0, 0.15]}>
            <boxGeometry args={[0.6, 0.02, 0.02]} />
            <meshBasicMaterial color={purple} toneMapped={false} />
          </mesh>
          <mesh position={[0.45, 0.78, s * 0.2]} rotation={[0, 0, 0.9]}>
            <boxGeometry args={[0.22, 0.02, 0.02]} />
            <meshBasicMaterial color={purple} toneMapped={false} />
          </mesh>
          <mesh position={[-0.7, 0.86, s * 0.17]} rotation={[0, 0, 0.55]}>
            <boxGeometry args={[0.3, 0.02, 0.02]} />
            <meshBasicMaterial color={purple} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <Wheel x={0.75} z={0} front r={0.31} width={0.12} rim="#121316" caliper="#d4a63a" onRig={onRig} bike />
      <Wheel x={-0.74} z={0} front={false} r={0.31} width={0.19} rim="#121316" caliper="#d4a63a" onRig={onRig} bike />
    </group>
  );
}

function VehicleShell({ id, children }: { id: VehicleId; children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  const spec = SPECS[id];
  const select = useUI((s) => s.select);
  useLayoutEffect(() => {
    const rig = world.vehicles[id];
    rig.group = group.current;
    rig.body = body.current;
    rig.light = light.current;
    const s = rig.state;
    group.current?.position.set(s.x, 0, s.z);
    if (group.current) group.current.rotation.y = s.yaw;
    if (spec.kind === "car") {
      rig.exhausts = [[-0.5, 0.3, -2.45]];
      rig.rearContacts = [[TRACK, 0.02, -WHEEL_X], [-TRACK, 0.02, -WHEEL_X]];
    } else {
      rig.exhausts = [[-0.18, 0.63, -0.74]];
      rig.rearContacts = [[0, 0.02, -0.74]];
    }
  }, [id, spec.kind]);
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return;
    e.stopPropagation();
    if (useUI.getState().mode === "orbit") select(id);
  };
  const isBike = spec.kind === "bike";
  return (
    <group ref={group} onClick={onClick} onPointerOver={() => (document.body.style.cursor = "pointer")} onPointerOut={() => (document.body.style.cursor = "")}>
      <Underglow color={spec.underglow} length={isBike ? 2 : 4.4} width={isBike ? 0.5 : WIDTH} />
      <pointLight ref={light} color={spec.underglow} intensity={isBike ? 6 : 9} distance={isBike ? 4 : 6} decay={2} position={[0, 0.25, 0]} />
      <group ref={body}>{children}</group>
    </group>
  );
}

export function Vehicles() {
  return (
    <>
      <VehicleShell id="r34"><CarModel look={LOOKS.r34} /></VehicleShell>
      <VehicleShell id="supra"><CarModel look={LOOKS.supra} /></VehicleShell>
      <VehicleShell id="eclipse"><CarModel look={LOOKS.eclipse} /></VehicleShell>
      <VehicleShell id="bike"><BikeModel /></VehicleShell>
    </>
  );
}
