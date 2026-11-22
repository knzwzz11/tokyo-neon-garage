import { Html } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { audio } from "../audio/audio";
import { activateHotspot } from "../actions";
import { HOTSPOT_COPY, useUI, type HotspotId } from "../store";
import { GARAGE, world } from "../world";
import { textTexture } from "./textures";
import { PROFILE } from "@/data/portfolio";

// ---- Purple aura ------------------------------------------------------------
const AURA_VERT = /* glsl */ `
varying vec3 vN; varying vec3 vV;
void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`;
const AURA_FRAG = /* glsl */ `
varying vec3 vN; varying vec3 vV; uniform float uStrength; uniform float uTime;
void main(){
  float f = 1.0 - abs(dot(vN, vV));
  f = f * f * f;
  float pulse = 0.75 + 0.25 * sin(uTime * 5.0);
  vec3 c = vec3(0.66, 0.22, 1.0) * 1.5;
  gl_FragColor = vec4(c * f * pulse * uStrength, f * uStrength * pulse);
}`;

function Aura({ id, size, position }: { id: HotspotId; size: [number, number, number]; position: [number, number, number] }) {
  const mat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: AURA_VERT, fragmentShader: AURA_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uStrength: { value: 0 }, uTime: { value: 0 } } }),
    [],
  );
  const light = useRef<THREE.PointLight>(null);
  const ring = useRef<THREE.MeshBasicMaterial>(null);
  useFrame((st, dt) => {
    const ui = useUI.getState();
    const hot = ui.hovered === id || ui.near === id;
    const idle = ui.mode === "orbit" && !ui.modal ? 0.22 : 0.08;
    const target = hot ? 1.0 : idle;
    const u = mat.uniforms["uStrength"]!;
    u.value += (target - u.value) * (1 - Math.exp(-8 * Math.min(dt, 0.05)));
    mat.uniforms["uTime"]!.value = st.clock.elapsedTime;
    const pulse = 0.75 + 0.25 * Math.sin(st.clock.elapsedTime * 5);
    if (light.current) light.current.intensity = u.value * 9 * pulse;
    if (ring.current) ring.current.opacity = Math.min(1, u.value) * 0.8 * pulse;
  });
  return (
    <group position={position}>
      <mesh material={mat} scale={size} renderOrder={8}>
        <sphereGeometry args={[0.5, 32, 20]} />
      </mesh>
      <pointLight ref={light} color="#a855f7" intensity={0} distance={6} decay={2} />
      <mesh rotation-x={-Math.PI / 2} position={[0, -position[1] + 0.02, 0]}>
        <ringGeometry args={[Math.max(size[0], size[2]) * 0.55, Math.max(size[0], size[2]) * 0.62, 48]} />
        <meshBasicMaterial ref={ring} color={new THREE.Color(1.6, 0.6, 3)} transparent opacity={0} toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Label({ id, position }: { id: HotspotId; position: [number, number, number] }) {
  const hovered = useUI((s) => s.hovered === id);
  const show = useUI((s) => s.mode === "orbit" && !s.modal && s.view === "3d");
  const helmet = useUI((s) => s.helmet);
  const copy = HOTSPOT_COPY[id];
  const visible = show && !(id === "portrait" && helmet === "falling");
  return (
    <Html position={position} center zIndexRange={[20, 0]} style={{ pointerEvents: "none", display: visible ? "block" : "none" }}>
      <div
        className={`whitespace-nowrap rounded-md border px-3 py-2 font-hud backdrop-blur-sm transition-all duration-200 ${
          hovered ? "scale-105 border-aura bg-ink/90 animate-aura" : "border-hi/15 bg-ink/70"
        }`}
      >
        <div className="font-display text-[11px] tracking-[0.25em] text-aura">{copy.tag}</div>
        <div className="text-[13px] font-semibold text-hi">{copy.title}</div>
        {copy.chips && hovered && (
          <div className="mt-1.5 flex gap-1.5">
            {copy.chips.map((c) => (
              <span key={c} className="rounded border border-hi/15 bg-panel px-2 py-0.5 text-[10px] font-bold tracking-wider text-chrome">
                {c}
              </span>
            ))}
          </div>
        )}
      </div>
    </Html>
  );
}

function useHotspotHandlers(id: HotspotId) {
  const setHovered = useUI((s) => s.setHovered);
  return useMemo(
    () => ({
      onPointerOver: (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        if (useUI.getState().modal) return;
        if (useUI.getState().hovered !== id) audio.hover();
        setHovered(id);
        document.body.style.cursor = "pointer";
      },
      onPointerOut: () => {
        if (useUI.getState().hovered === id) setHovered(null);
        document.body.style.cursor = "";
      },
      onClick: (e: ThreeEvent<MouseEvent>) => {
        if (e.delta > 6) return;
        e.stopPropagation();
        if (useUI.getState().modal) return;
        activateHotspot(id);
      },
    }),
    [id, setHovered],
  );
}

// ---- Tool chest (left wall) ---------------------------------------------------
const DRAWERS = [0.12, 0.12, 0.12, 0.16, 0.16, 0.22, 0.22];

function ToolChest() {
  const h = useHotspotHandlers("chest");
  const drawers = useRef<(THREE.Group | null)[]>([]);
  const label = useMemo(
    () =>
      textTexture("kr-tools", 512, 96, (ctx, w, hh) => {
        ctx.fillStyle = "#0c0c0e";
        ctx.fillRect(0, 0, w, hh);
        ctx.fillStyle = "#d8dde4";
        ctx.font = "bold 58px 'Russo One', sans-serif";
        ctx.fillText("KR TOOLS", 24, 70);
        ctx.fillStyle = "#f2c200";
        ctx.fillRect(330, 28, 150, 44);
        ctx.fillStyle = "#111";
        ctx.font = "bold 26px 'Chakra Petch', sans-serif";
        ctx.fillText("7 GAVETAS", 340, 60);
      }),
    [],
  );
  useFrame((_, dt) => {
    const m = useUI.getState().modal;
    const open = m?.kind === "drawers" || m?.kind === "case";
    drawers.current.forEach((d, i) => {
      if (!d) return;
      const target = open ? 0.18 + (i % 3) * 0.12 + (i > 4 ? 0.1 : 0) : 0;
      d.position.z += (target - d.position.z) * (1 - Math.exp(-(6 - i * 0.4) * Math.min(dt, 0.05)));
    });
  });
  const black = <meshStandardMaterial color="#17181c" metalness={0.55} roughness={0.42} />;
  let y = 0.22;
  const rows = DRAWERS.map((dh) => {
    const cy = y + dh / 2;
    y += dh + 0.015;
    return { cy, dh };
  });
  const topY = y;
  return (
    <group position={[-GARAGE.halfX + 0.42, 0, -4]} rotation-y={Math.PI / 2} {...h}>
      {/* cabinet */}
      <mesh position={[0, (topY + 0.2) / 2, -0.02]}>
        <boxGeometry args={[1.4, topY - 0.2, 0.6]} />
        {black}
      </mesh>
      {/* top tray with compartments */}
      <mesh position={[0, topY + 0.08, -0.02]}>
        <boxGeometry args={[1.44, 0.16, 0.62]} />
        {black}
      </mesh>
      <mesh position={[0, topY + 0.165, -0.02]}>
        <boxGeometry args={[1.34, 0.01, 0.52]} />
        <meshStandardMaterial color="#060607" roughness={0.9} />
      </mesh>
      {[-0.4, -0.1, 0.25].map((x) => (
        <mesh key={x} position={[x, topY + 0.19, 0.05]}>
          <cylinderGeometry args={[0.06, 0.06, 0.04, 16]} />
          <meshStandardMaterial color="#c9ced6" metalness={1} roughness={0.25} />
        </mesh>
      ))}
      <mesh position={[0.15, topY + 0.18, -0.12]} rotation={[0, 0.3, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.5, 8]} />
        <meshStandardMaterial color="#c9ced6" metalness={1} roughness={0.25} />
      </mesh>
      <mesh position={[-0.35, topY - 0.05, 0.285]}>
        <planeGeometry args={[0.5, 0.09]} />
        <meshBasicMaterial map={label} />
      </mesh>
      {/* drawers */}
      {rows.map(({ cy, dh }, i) => (
        <group key={i} ref={(el) => { drawers.current[i] = el; }} position={[0, cy, 0]}>
          <mesh position={[0, 0, 0.29]}>
            <boxGeometry args={[1.3, dh - 0.01, 0.03]} />
            {black}
          </mesh>
          <mesh position={[0, dh / 2 - 0.035, 0.32]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.012, 0.012, 1.1, 8]} />
            <meshStandardMaterial color="#d8dde4" metalness={1} roughness={0.2} />
          </mesh>
          {/* tray inside */}
          <mesh position={[0, -dh / 2 + 0.03, 0]}>
            <boxGeometry args={[1.26, 0.03, 0.56]} />
            <meshStandardMaterial color="#232428" roughness={0.95} />
          </mesh>
          {Array.from({ length: 6 }, (_, k) => (
            <mesh key={k} position={[-0.5 + k * 0.2, -dh / 2 + 0.055, 0.1]} rotation={[0, 0.1 * k, 0]}>
              <boxGeometry args={[0.04, 0.015, 0.32 - k * 0.02]} />
              <meshStandardMaterial color="#c9ced6" metalness={1} roughness={0.25} />
            </mesh>
          ))}
        </group>
      ))}
      {/* side handle, lock, casters */}
      <mesh position={[0.76, topY - 0.25, -0.02]}>
        <boxGeometry args={[0.04, 0.04, 0.45]} />
        <meshStandardMaterial color="#d8dde4" metalness={1} roughness={0.2} />
      </mesh>
      <mesh position={[0.6, topY - 0.06, 0.29]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.025, 0.025, 0.02, 12]} />
        <meshStandardMaterial color="#c9a13a" metalness={1} roughness={0.3} />
      </mesh>
      {[-0.6, 0.6].map((x) =>
        [-0.22, 0.2].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.08, z]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.07, 0.07, 0.05, 16]} />
            <meshStandardMaterial color="#0b0b0c" roughness={0.8} />
          </mesh>
        )),
      )}
      <Aura id="chest" size={[1.9, topY + 0.6, 1.1]} position={[0, (topY + 0.3) / 2, 0]} />
      <Label id="chest" position={[0, topY + 0.75, 0]} />
    </group>
  );
}

// ---- Workbench + vintage phone (right wall) ------------------------------------
function Phone() {
  const handset = useRef<THREE.Group>(null);
  const cord = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const turns = 18;
    const start = new THREE.Vector3(-0.16, 0.05, 0.02);
    const end = new THREE.Vector3(-0.42, 0.03, 0.18);
    for (let i = 0; i <= 260; i++) {
      const t = i / 260;
      const p = start.clone().lerp(end, t);
      p.y -= Math.sin(t * Math.PI) * 0.05;
      const a = t * turns * Math.PI * 2;
      p.x += Math.cos(a) * 0.018;
      p.y += Math.sin(a) * 0.018;
      pts.push(p);
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 600, 0.005, 5, false);
  }, []);
  useFrame((st) => {
    const ringing = useUI.getState().modal?.kind === "phone";
    if (!handset.current) return;
    const t = st.clock.elapsedTime;
    const shake = ringing && t % 1.6 < 1 ? Math.sin(t * 70) * 0.04 : 0;
    handset.current.rotation.z = shake;
    handset.current.position.y = 0.17 + (ringing && t % 1.6 < 1 ? Math.abs(Math.sin(t * 35)) * 0.012 : 0);
  });
  const red = <meshPhysicalMaterial color="#9b1420" roughness={0.18} metalness={0.1} clearcoat={1} />;
  return (
    <group>
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[0.32, 0.12, 0.26]} />
        {red}
      </mesh>
      <mesh position={[0, 0.12, 0.02]} rotation-x={-0.35}>
        <boxGeometry args={[0.28, 0.06, 0.2]} />
        {red}
      </mesh>
      {/* rotary dial */}
      <group position={[0, 0.16, 0.08]} rotation-x={-0.35 - Math.PI / 2 + Math.PI / 2}>
        <mesh rotation-x={Math.PI / 2 - 0.35}>
          <cylinderGeometry args={[0.085, 0.085, 0.012, 32]} />
          <meshStandardMaterial color="#f1ece2" roughness={0.3} />
        </mesh>
      </group>
      <mesh position={[0, 0.17, 0.08]} rotation-x={-0.35}>
        <torusGeometry args={[0.06, 0.008, 6, 24]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.4} />
      </mesh>
      {/* handset */}
      <group ref={handset} position={[0, 0.17, -0.04]}>
        <mesh rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.022, 0.022, 0.3, 12]} />
          {red}
        </mesh>
        {[-0.15, 0.15].map((x) => (
          <mesh key={x} position={[x, -0.015, 0]}>
            <cylinderGeometry args={[0.045, 0.035, 0.05, 16]} />
            {red}
          </mesh>
        ))}
      </group>
      <mesh geometry={cord}>
        <meshStandardMaterial color="#7a1018" roughness={0.5} />
      </mesh>
    </group>
  );
}

function Workbench() {
  const h = useHotspotHandlers("phone");
  const wood = useMemo(
    () =>
      textTexture("wood", 512, 128, (ctx, w, hh) => {
        ctx.fillStyle = "#6b4528";
        ctx.fillRect(0, 0, w, hh);
        for (let i = 0; i < 60; i++) {
          ctx.strokeStyle = `rgba(30,15,5,${0.1 + (i % 5) * 0.05})`;
          ctx.beginPath();
          ctx.moveTo(0, (i * 7) % hh);
          ctx.bezierCurveTo(w / 3, ((i * 11) % hh) + 4, (2 * w) / 3, ((i * 5) % hh) - 4, w, (i * 7) % hh);
          ctx.stroke();
        }
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.beginPath(); ctx.ellipse(380, 60, 50, 20, 0.2, 0, Math.PI * 2); ctx.fill();
      }),
    [],
  );
  const steel = <meshStandardMaterial color="#3a3e46" metalness={0.8} roughness={0.4} />;
  return (
    <group position={[GARAGE.halfX - 0.6, 0, -4]} rotation-y={-Math.PI / 2}>
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[2.8, 0.08, 0.95]} />
        <meshStandardMaterial map={wood} roughness={0.7} />
      </mesh>
      {[-1.3, 1.3].map((x) =>
        [-0.4, 0.4].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.5, z]}>
            <boxGeometry args={[0.07, 1, 0.07]} />
            {steel}
          </mesh>
        )),
      )}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[2.7, 0.04, 0.85]} />
        {steel}
      </mesh>
      {/* pegboard with tool silhouettes */}
      <mesh position={[0, 2.2, -0.5]}>
        <boxGeometry args={[2.8, 1.6, 0.03]} />
        <meshStandardMaterial color="#1c1e22" roughness={0.8} />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[-1.15 + i * 0.29, 2.2 + ((i % 3) - 1) * 0.25, -0.47]} rotation-z={(i % 4) * 0.4}>
          <boxGeometry args={[0.05, 0.4 + (i % 3) * 0.1, 0.02]} />
          <meshStandardMaterial color={i % 3 === 0 ? "#c43b2e" : "#c9ced6"} metalness={0.9} roughness={0.3} />
        </mesh>
      ))}
      {/* vise */}
      <group position={[1.05, 1.1, 0.25]}>
        <mesh>
          <boxGeometry args={[0.25, 0.14, 0.18]} />
          <meshStandardMaterial color="#2f5fb0" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.16]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.012, 0.012, 0.25, 8]} />
          {steel}
        </mesh>
      </group>
      {/* lamp */}
      <group position={[-1.0, 1.04, -0.25]}>
        <mesh position={[0, 0.35, 0]} rotation-z={0.3}>
          <cylinderGeometry args={[0.012, 0.012, 0.7, 8]} />
          {steel}
        </mesh>
        <mesh position={[0.18, 0.66, 0.05]} rotation={[0, 0, -2.3]}>
          <coneGeometry args={[0.1, 0.16, 16, 1, true]} />
          <meshStandardMaterial color="#1fb6ff" metalness={0.5} roughness={0.4} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0.2, 0.62, 0.05]}>
          <sphereGeometry args={[0.03, 12, 8]} />
          <meshBasicMaterial color={new THREE.Color(3, 2.6, 1.8)} toneMapped={false} />
        </mesh>
        <pointLight position={[0.3, 0.5, 0.15]} color="#ffd9a8" intensity={6} distance={3.5} decay={2} />
      </group>
      {/* phone sits here */}
      <group position={[0.05, 1.04, 0.1]} rotation-y={0.25} {...h}>
        <Phone />
        <Aura id="phone" size={[0.9, 0.7, 0.8]} position={[0, 0.15, 0]} />
        <Label id="phone" position={[0, 0.75, 0]} />
      </group>
      {/* clutter */}
      <mesh position={[-0.5, 1.1, 0.2]}>
        <cylinderGeometry args={[0.06, 0.06, 0.12, 14]} />
        <meshStandardMaterial color="#e6e6e6" roughness={0.5} />
      </mesh>
      <mesh position={[0.6, 1.07, -0.1]} rotation-y={0.4}>
        <boxGeometry args={[0.3, 0.05, 0.2]} />
        <meshStandardMaterial color="#1a8a8a" roughness={0.5} />
      </mesh>
    </group>
  );
}

// ---- Portrait + helmet easter egg (back wall) ---------------------------------
const PHOTO_W = 1.6;
const PHOTO_H = 1.98;
const FRAME_Y = 3.6;

function Helmet() {
  const group = useRef<THREE.Group>(null);
  const sim = useRef({ t: 0, pos: new THREE.Vector3(), vel: new THREE.Vector3(), rot: new THREE.Euler(), spin: new THREE.Vector3(), bounces: 0, dissolve: -1, started: false });
  const helmet = useUI((s) => s.helmet);
  const rest = useMemo(() => new THREE.Vector3(-0.05, 0.3, 0.12), []);
  const shellMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#f4f5f8", roughness: 0.18, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.03 }), []);
  const visorMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#14081f", roughness: 0.05, metalness: 1, iridescence: 1, iridescenceIOR: 1.6, envMapIntensity: 2.5 }), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    if (helmet === "falling" && group.current && !sim.current.started) {
      const g = group.current;
      const s = sim.current;
      s.started = true;
      s.t = 0;
      s.bounces = 0;
      s.dissolve = -1;
      g.updateWorldMatrix(true, false);
      g.getWorldPosition(s.pos);
      s.vel.set(0.5, 2.6, 2.8);
      s.rot.set(0, 0, 0);
      s.spin.set(4.2, 1.6, 0.9);
      // reparent to the scene root so it falls in world space
      const parent = g.parent;
      const root = (() => { let p: THREE.Object3D | null = g; while (p?.parent) p = p.parent; return p; })();
      if (parent && root) { root.attach(g); g.position.copy(s.pos); }
    }
  }, [helmet]);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const s = sim.current;
    const phase = useUI.getState().helmet;
    if (phase === "on") {
      g.visible = true;
      g.scale.set(1, 1, 0.55);
      return;
    }
    if (phase === "gone") { g.visible = false; return; }
    const dt = Math.min(delta, 0.04);
    s.t += dt;
    const r0 = 0.6;
    if (s.dissolve < 0) {
      s.vel.y -= 9.8 * dt;
      s.pos.addScaledVector(s.vel, dt);
      s.rot.x += s.spin.x * dt; s.rot.y += s.spin.y * dt; s.rot.z += s.spin.z * dt;
      const k = Math.max(0.32, 1 - s.t * 0.62);
      const zs = Math.min(1, 0.55 + s.t * 4);
      g.scale.set(k, k, k * zs);
      const r = r0 * k;
      if (s.pos.y - r < 0 && s.vel.y < 0) {
        s.pos.y = r;
        s.vel.y = -s.vel.y * 0.38;
        s.vel.x *= 0.6; s.vel.z *= 0.6;
        s.spin.multiplyScalar(0.5);
        s.bounces++;
        audio.thud(s.bounces === 1 ? 1 : 0.55);
        for (let i = 0; i < 10; i++) {
          tmp.set((Math.random() - 0.5) * 2, Math.random() * 0.6, (Math.random() - 0.5) * 2);
          world.fx.smoke(new THREE.Vector3(s.pos.x, 0.1, s.pos.z), tmp, 0.4, 1.2, 0.5, 0.5, [0.55, 0.25, 0.85]);
        }
        if (s.bounces >= 2) s.dissolve = 0;
      }
      if (s.t > 2.2 && s.dissolve < 0) s.dissolve = 0;
    } else {
      if (s.dissolve === 0) {
        audio.poof();
        for (let i = 0; i < 34; i++) {
          tmp.set((Math.random() - 0.5) * 2.4, Math.random() * 1.6, (Math.random() - 0.5) * 2.4);
          world.fx.smoke(s.pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.6, Math.random() * 0.4, (Math.random() - 0.5) * 0.6)), tmp, 0.35 + Math.random() * 0.45, 1.4 + Math.random(), 0.6, 0.42, [0.62, 0.22, 1.0]);
        }
      }
      s.dissolve += dt;
      const k = Math.max(0, g.scale.x * Math.exp(-9 * dt) - dt * 0.3);
      g.scale.setScalar(k);
      if (s.dissolve > 0.45) {
        useUI.getState().setHelmet("gone");
        window.setTimeout(() => useUI.getState().open({ kind: "bio" }), 350);
      }
    }
    g.position.copy(s.pos);
    g.rotation.copy(s.rot);
  });

  return (
    <group ref={group} position={rest}>
      <mesh material={shellMat} scale={[1, 1.06, 1.1]}>
        <sphereGeometry args={[0.6, 40, 28, 0, Math.PI * 2, 0, Math.PI * 0.74]} />
      </mesh>
      <mesh material={visorMat} scale={[1, 1.06, 1.1]}>
        <sphereGeometry args={[0.615, 40, 16, Math.PI / 2 - 0.85, 1.7, Math.PI * 0.36, Math.PI * 0.22]} />
      </mesh>
      {/* stripes */}
      {[
        { z: 0.09, c: new THREE.Color(2.2, 0.25, 0.9) },
        { z: -0.09, c: new THREE.Color(0.25, 1.2, 2.6) },
      ].map(({ z, c }) => (
        <mesh key={z} position={[z, 0, 0]} rotation={[0, Math.PI / 2, 0]} scale={[1.1, 1.06, 1]}>
          <torusGeometry args={[0.606, 0.022, 6, 48, Math.PI * 0.62]} />
          <meshBasicMaterial color={c} toneMapped={false} />
        </mesh>
      ))}
      {/* neck roll */}
      <mesh position={[0, -0.45, 0]} rotation-x={Math.PI / 2} scale={[1, 1.1, 1]}>
        <torusGeometry args={[0.41, 0.06, 10, 32]} />
        <meshStandardMaterial color="#111114" roughness={0.8} />
      </mesh>
      {/* rear spoiler */}
      <mesh position={[0, 0.25, -0.6]} rotation-x={-0.5}>
        <boxGeometry args={[0.42, 0.04, 0.16]} />
        <meshStandardMaterial color="#111114" roughness={0.4} metalness={0.5} />
      </mesh>
    </group>
  );
}

function Portrait() {
  const h = useHotspotHandlers("portrait");
  const photo = useMemo(() => {
    const t = new THREE.TextureLoader().load(PROFILE.portraitUrl);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  const plate = useMemo(
    () =>
      textTexture("portrait-plate", 512, 96, (ctx, w, hh) => {
        ctx.fillStyle = "#b8923a";
        ctx.fillRect(0, 0, w, hh);
        ctx.fillStyle = "#1b1306";
        ctx.font = "bold 40px 'Russo One', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("K. RIBEIRO ROJAS // ETEC", w / 2, 62);
      }),
    [],
  );
  return (
    <group position={[0, FRAME_Y, -GARAGE.halfZ + 0.08]}>
      <group {...h}>
        <mesh position={[0, 0, 0.04]}>
          <boxGeometry args={[2.25, 2.7, 0.1]} />
          <meshStandardMaterial color="#14100c" roughness={0.35} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.095]}>
          <boxGeometry args={[2.02, 2.46, 0.02]} />
          <meshStandardMaterial color="#b8923a" metalness={1} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.11]}>
          <planeGeometry args={[1.94, 2.36]} />
          <meshStandardMaterial color="#e9e3d6" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.02, 0.115]}>
          <planeGeometry args={[PHOTO_W, PHOTO_H]} />
          <meshStandardMaterial map={photo} roughness={0.55} />
        </mesh>
        <mesh position={[0, 0.02, 0.12]}>
          <planeGeometry args={[PHOTO_W, PHOTO_H]} />
          <meshPhysicalMaterial transparent opacity={0.08} roughness={0.02} metalness={0} clearcoat={1} />
        </mesh>
        <Aura id="portrait" size={[2.8, 3.2, 1.2]} position={[0, 0, 0.1]} />
        <group position={[0, 0.02, 0.12]}>
          <Helmet />
        </group>
      </group>
      <mesh position={[0, -1.6, 0.06]}>
        <planeGeometry args={[1.2, 0.22]} />
        <meshStandardMaterial map={plate} metalness={0.8} roughness={0.35} />
      </mesh>
      {/* picture light */}
      <mesh position={[0, 1.5, 0.25]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.05, 0.05, 1.1, 16]} />
        <meshStandardMaterial color="#b8923a" metalness={1} roughness={0.25} />
      </mesh>
      <mesh position={[0, 1.44, 0.28]}>
        <boxGeometry args={[1.0, 0.02, 0.04]} />
        <meshBasicMaterial color={new THREE.Color(3, 2.6, 2)} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 1.3, 0.8]} intensity={5} distance={4} decay={2} color="#ffe2b8" />
      <pointLight position={[0, 0.4, 1.6]} intensity={2.5} distance={4} decay={2} color="#ffe6c8" />
      <Label id="portrait" position={[0, 1.95, 0.3]} />
    </group>
  );
}

export function Hotspots() {
  return (
    <>
      <ToolChest />
      <Workbench />
      <Portrait />
    </>
  );
}
