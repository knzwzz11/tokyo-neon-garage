import { MeshReflectorMaterial } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { GARAGE, PILLARS } from "../world";
import { brickTexture, concreteTexture, neonSign, textTexture, wetRoughness } from "./textures";

const { halfX: HX, halfZ: HZ, height: H } = GARAGE;

function Floor({ reflect }: { reflect: boolean }) {
  const map = useMemo(() => {
    const t = concreteTexture().clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(3, 2.2);
    t.needsUpdate = true;
    return t;
  }, []);
  const rough = useMemo(() => {
    const t = wetRoughness().clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 1.5);
    t.needsUpdate = true;
    return t;
  }, []);
  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[HX * 2, HZ * 2]} />
      {reflect ? (
        <MeshReflectorMaterial
          map={map}
          color="#7a7e88"
          roughness={0.82}
          metalness={0.2}
          blur={[400, 120]}
          resolution={512}
          mixBlur={1.2}
          mixStrength={2.2}
          mixContrast={1}
          depthScale={0.8}
          minDepthThreshold={0.3}
          maxDepthThreshold={1.4}
          mirror={0.5}
        />
      ) : (
        <meshStandardMaterial map={map} roughnessMap={rough} color="#6a6e78" roughness={0.6} metalness={0.3} />
      )}
    </mesh>
  );
}

const OIL_FRAG = /* glsl */ `
varying vec2 vUv;
varying vec3 vView;
varying vec3 vNormal;
uniform float uTime;
uniform float uSeed;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)) + uSeed) * 43758.5453); }
float noise(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
void main(){
  vec2 p = vUv - 0.5;
  float n = noise(vUv * 4.0 + uSeed) * 0.5 + noise(vUv * 9.0 - uSeed) * 0.25;
  float d = length(p * vec2(1.0, 1.35)) + n * 0.18;
  float mask = smoothstep(0.42, 0.3, d);
  float fres = 1.0 - abs(dot(normalize(vView), normalize(vNormal)));
  float t = n * 2.2 + fres * 1.6 + uTime * 0.03 + d * 3.0;
  vec3 film = 0.5 + 0.5 * cos(6.2831 * (t + vec3(0.0, 0.33, 0.67)));
  film = mix(film, vec3(0.75, 0.2, 1.0), 0.25);
  vec3 base = vec3(0.01, 0.01, 0.015);
  vec3 col = base + film * (0.35 + fres * 0.9);
  gl_FragColor = vec4(col * 0.7, mask * 0.6);
}`;
const OIL_VERT = /* glsl */ `
varying vec2 vUv; varying vec3 vView; varying vec3 vNormal;
void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vView = -mv.xyz; vNormal = normalMatrix * normal; gl_Position = projectionMatrix * mv; }`;

function OilPuddle({ x, z, s, rot, seed }: { x: number; z: number; s: number; rot: number; seed: number }) {
  const mat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: OIL_VERT, fragmentShader: OIL_FRAG, transparent: true, depthWrite: false, uniforms: { uTime: { value: 0 }, uSeed: { value: seed } } }),
    [seed],
  );
  useFrame((st) => { mat.uniforms["uTime"]!.value = st.clock.elapsedTime; });
  return (
    <mesh position={[x, 0.008, z]} rotation={[-Math.PI / 2, 0, rot]} material={mat} renderOrder={1}>
      <planeGeometry args={[s * 1.6, s]} />
    </mesh>
  );
}

function Walls() {
  const back = useMemo(() => brickTexture([HX / 4, H / 4]), []);
  const side = useMemo(() => {
    const t = brickTexture([HZ / 4, H / 4]).clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(HZ / 4, H / 4);
    t.needsUpdate = true;
    return t;
  }, []);
  const doorW = 16;
  const front = useMemo(() => {
    const t = brickTexture([(HX - doorW / 2) / 4, H / 4]).clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set((HX - doorW / 2) / 4, H / 4);
    t.needsUpdate = true;
    return t;
  }, []);
  const mat = (map: THREE.Texture) => <meshStandardMaterial map={map} roughness={0.92} color="#c4b6ae" />;
  const segW = HX - doorW / 2;
  return (
    <group>
      <mesh position={[0, H / 2, -HZ]}>
        <planeGeometry args={[HX * 2, H]} />
        {mat(back)}
      </mesh>
      <mesh position={[-HX, H / 2, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[HZ * 2, H]} />
        {mat(side)}
      </mesh>
      <mesh position={[HX, H / 2, 0]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[HZ * 2, H]} />
        {mat(side)}
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (doorW / 2 + segW / 2), H / 2, HZ]} rotation-y={Math.PI}>
          <planeGeometry args={[segW, H]} />
          {mat(front)}
        </mesh>
      ))}
      {/* header above the door + half-open shutter */}
      <mesh position={[0, H - 1.5, HZ]} rotation-y={Math.PI}>
        <planeGeometry args={[doorW, 3]} />
        {mat(front)}
      </mesh>
      <group position={[0, H - 3.6, HZ - 0.05]}>
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} position={[0, -i * 0.28, 0]}>
            <boxGeometry args={[doorW, 0.24, 0.06]} />
            <meshStandardMaterial color="#3d434d" metalness={0.8} roughness={0.45} />
          </mesh>
        ))}
        <mesh position={[0, -2.3, -0.06]}>
          <boxGeometry args={[doorW, 0.06, 0.12]} />
          <meshBasicMaterial color={new THREE.Color(2.2, 1.6, 0.2)} toneMapped={false} />
        </mesh>
      </group>
      {/* skirting grime strip */}
      <mesh position={[0, 0.25, -HZ + 0.02]}>
        <planeGeometry args={[HX * 2, 0.5]} />
        <meshStandardMaterial color="#111113" roughness={1} />
      </mesh>
    </group>
  );
}

function Skyline() {
  const tex = useMemo(
    () =>
      textTexture("skyline", 2048, 768, (ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "#070814");
        g.addColorStop(0.65, "#2a0e3a");
        g.addColorStop(1, "#5b1640");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        let seed = 3;
        const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
        for (let layer = 0; layer < 3; layer++) {
          let x = 0;
          while (x < w) {
            const bw = 40 + r() * 120;
            const bh = (0.25 + r() * 0.55) * h * (1 - layer * 0.18);
            ctx.fillStyle = ["#0b0c18", "#090a12", "#050509"][layer]!;
            ctx.fillRect(x, h - bh, bw, bh);
            for (let wy = h - bh + 10; wy < h - 6; wy += 14) {
              for (let wx = x + 6; wx < x + bw - 6; wx += 11) {
                if (r() < 0.32) {
                  ctx.fillStyle = r() < 0.15 ? "#ff2e88" : r() < 0.3 ? "#1fb6ff" : "#ffd59a";
                  ctx.globalAlpha = 0.5 + r() * 0.5;
                  ctx.fillRect(wx, wy, 5, 7);
                  ctx.globalAlpha = 1;
                }
              }
            }
            x += bw + r() * 20;
          }
        }
        ctx.font = "bold 70px 'Russo One', 'Noto Sans JP', sans-serif";
        ctx.fillStyle = "#ff2e88";
        ctx.shadowColor = "#ff2e88";
        ctx.shadowBlur = 24;
        ctx.fillText("東京", 380, 300);
        ctx.fillStyle = "#1fb6ff";
        ctx.shadowColor = "#1fb6ff";
        ctx.fillText("ドリフト", 1300, 260);
      }),
    [],
  );
  return (
    <mesh position={[0, 6, HZ + 12]} rotation-y={Math.PI}>
      <planeGeometry args={[60, 22]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}

function CeilingLights() {
  const tube = useMemo(() => new THREE.Color(2.6, 2.8, 3.2), []);
  const spots: [number, number][] = [[-12, -8], [0, -8], [12, -8], [-12, 6], [0, 6], [12, 6]];
  return (
    <group>
      {spots.map(([x, z], i) => (
        <group key={i} position={[x, H - 1.2, z]}>
          <mesh>
            <boxGeometry args={[3.2, 0.12, 0.35]} />
            <meshStandardMaterial color="#1a1c21" metalness={0.7} roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.08, 0]}>
            <boxGeometry args={[3, 0.05, 0.12]} />
            <meshBasicMaterial color={tube} toneMapped={false} />
          </mesh>
          {[-1.2, 1.2].map((dx) => (
            <mesh key={dx} position={[dx, 0.6, 0]}>
              <cylinderGeometry args={[0.01, 0.01, 1.2]} />
              <meshBasicMaterial color="#222" />
            </mesh>
          ))}
        </group>
      ))}
      <pointLight position={[-10, H - 1.6, -8]} intensity={90} distance={26} decay={1.6} color="#cfe0ff" />
      <pointLight position={[10, H - 1.6, -8]} intensity={90} distance={26} decay={1.6} color="#cfe0ff" />
      <pointLight position={[0, H - 1.6, 6]} intensity={80} distance={26} decay={1.6} color="#d8e4ff" />
      {/* beams */}
      {[-14, -4, 6, 16].map((z) => (
        <mesh key={z} position={[0, H - 0.3, z]}>
          <boxGeometry args={[HX * 2, 0.5, 0.35]} />
          <meshStandardMaterial color="#25272c" metalness={0.6} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function Pillars() {
  const hazard = useMemo(
    () =>
      textTexture("hazard", 256, 64, (ctx, w, h) => {
        ctx.fillStyle = "#f2c200";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#111";
        for (let x = -h; x < w + h; x += 40) {
          ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + 20, h); ctx.lineTo(x + 20 + h, 0); ctx.lineTo(x + h, 0); ctx.fill();
        }
      }),
    [],
  );
  return (
    <>
      {PILLARS.map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]}>
          <mesh position={[0, H / 2, 0]}>
            <boxGeometry args={[1.2, H, 1.2]} />
            <meshStandardMaterial color="#55585f" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[1.24, 1, 1.24]} />
            <meshStandardMaterial map={hazard} roughness={0.7} />
          </mesh>
          <mesh position={[0, 3.2, 0.63]}>
            <planeGeometry args={[0.8, 0.5]} />
            <meshBasicMaterial map={neonSign(`pillar-${i}`, [`P${i + 1}`], "#1fb6ff")} transparent toneMapped={false} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function NeonSign({ text, color, position, rotation = 0, scale = 1 }: { text: string[]; color: string; position: [number, number, number]; rotation?: number; scale?: number }) {
  const tex = useMemo(() => neonSign(`sign-${text.join("|")}`, text, color), [text, color]);
  const ref = useRef<THREE.MeshBasicMaterial>(null);
  useFrame((st) => {
    if (!ref.current) return;
    const t = st.clock.elapsedTime;
    const flicker = Math.sin(t * 50) > 0.97 || (t % 7 > 6.85 && t % 7 < 6.92) ? 0.5 : 1;
    ref.current.color.setScalar(1.6 * flicker);
  });
  return (
    <mesh position={position} rotation-y={rotation} scale={scale}>
      <planeGeometry args={[4, text.length]} />
      <meshBasicMaterial ref={ref} map={tex} transparent toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

function Poster({ position, rotation, kind }: { position: [number, number, number]; rotation: number; kind: number }) {
  const tex = useMemo(
    () =>
      textTexture(`poster-${kind}`, 512, 720, (ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, kind === 0 ? "#1fb6ff" : kind === 1 ? "#ff2e88" : "#f2c200");
        g.addColorStop(1, "#06070b");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.lineWidth = 6;
        ctx.strokeRect(20, 20, w - 40, h - 40);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 64px 'Russo One', sans-serif";
        const lines = kind === 0 ? ["SP", "UNDER", "GROUND", "MEET"] : kind === 1 ? ["TOKYO", "DRIFT", "NIGHT"] : ["JDM", "LEGENDS", "ONLY"];
        lines.forEach((l, i) => ctx.fillText(l, 44, 130 + i * 78));
        ctx.font = "600 26px 'Chakra Petch', sans-serif";
        ctx.fillText(kind === 0 ? "SÁB · 23:00 · ZONA LESTE" : kind === 1 ? "峠 · TOUGE · 2 STEP" : "R34 · MK4 · GSX · CBR", 44, h - 70);
        // speed lines
        ctx.globalAlpha = 0.4;
        for (let i = 0; i < 14; i++) ctx.fillRect(40, 470 + i * 12, (w - 80) * (0.3 + ((i * 37) % 70) / 100), 3);
        ctx.globalAlpha = 1;
      }),
    [kind],
  );
  return (
    <mesh position={position} rotation-y={rotation}>
      <planeGeometry args={[1.4, 1.97]} />
      <meshStandardMaterial map={tex} roughness={0.8} />
    </mesh>
  );
}

function Tire({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <torusGeometry args={[0.32, 0.14, 12, 28]} />
        <meshStandardMaterial color="#111113" roughness={0.9} />
      </mesh>
    </group>
  );
}

function TireRack({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  return (
    <group position={position} rotation-y={rotation}>
      {[0, 1.1].map((y) => (
        <mesh key={y} position={[0, 0.55 + y, 0]}>
          <boxGeometry args={[3.4, 0.05, 0.9]} />
          <meshStandardMaterial color="#c43b2e" metalness={0.6} roughness={0.5} />
        </mesh>
      ))}
      {[-1.65, 1.65].map((x) =>
        [-0.42, 0.42].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 1.2, z]}>
            <boxGeometry args={[0.06, 2.4, 0.06]} />
            <meshStandardMaterial color="#c43b2e" metalness={0.6} roughness={0.5} />
          </mesh>
        )),
      )}
      {[-1.1, -0.36, 0.38, 1.12].map((x) => (
        <group key={x}>
          <Tire position={[x, 1.0, 0]} rotation={[0, 0, 0]} />
          <Tire position={[x, 2.1, 0]} rotation={[0, 0, 0]} />
        </group>
      ))}
    </group>
  );
}

function TireStack({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Tire key={i} position={[0, 0.15 + i * 0.29, 0]} rotation={[Math.PI / 2, 0, i * 0.4]} />
      ))}
      {[0, 1, 2].map((i) => (
        <Tire key={`b${i}`} position={[1.0, 0.15 + i * 0.29, 0.4]} rotation={[Math.PI / 2, 0, i]} />
      ))}
      <Tire position={[0.2, 0.46, 1.2]} rotation={[0, 0.6, 0]} />
    </group>
  );
}

function Drum({ position, color, tipped = false }: { position: [number, number, number]; color: string; tipped?: boolean }) {
  return (
    <group position={position} rotation={tipped ? [Math.PI / 2, 0, 0.6] : [0, 0, 0]}>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.9, 24]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.45} />
      </mesh>
      {[0.15, 0.45, 0.75].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.305, 0.015, 6, 24]} />
          <meshStandardMaterial color={color} metalness={0.7} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function Shelf({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  const cans = ["#1fb6ff", "#f2c200", "#e33", "#3dff8a", "#fff", "#ff2e88"];
  return (
    <group position={position} rotation-y={rotation}>
      {[0.3, 1.1, 1.9, 2.7].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[3, 0.05, 0.6]} />
          <meshStandardMaterial color="#9aa0a8" metalness={0.8} roughness={0.4} />
        </mesh>
      ))}
      {[-1.48, 1.48].map((x) => (
        <mesh key={x} position={[x, 1.5, 0.27]}>
          <boxGeometry args={[0.05, 3, 0.05]} />
          <meshStandardMaterial color="#9aa0a8" metalness={0.8} roughness={0.4} />
        </mesh>
      ))}
      {[1.1, 1.9, 2.7].map((y, row) =>
        Array.from({ length: 6 }, (_, i) => (
          <mesh key={`${y}-${i}`} position={[-1.2 + i * 0.45, y + 0.2, 0]}>
            {row === 1 ? <boxGeometry args={[0.26, 0.36, 0.18]} /> : <cylinderGeometry args={[0.1, 0.1, 0.34, 14]} />}
            <meshStandardMaterial color={cans[(i + row * 2) % cans.length] ?? "#ffffff"} roughness={0.5} metalness={0.3} />
          </mesh>
        )),
      )}
      {/* box on bottom shelf */}
      <mesh position={[-0.6, 0.62, 0]}>
        <boxGeometry args={[1, 0.6, 0.5]} />
        <meshStandardMaterial color="#8a6a45" roughness={0.9} />
      </mesh>
    </group>
  );
}

function FloorTools() {
  const chrome = <meshStandardMaterial color="#c9ced6" metalness={1} roughness={0.22} />;
  const wrench = (p: [number, number, number], r: number, s = 1) => (
    <group position={p} rotation={[0, r, 0]} scale={s}>
      <mesh position={[0, 0.012, 0]}>
        <boxGeometry args={[0.32, 0.018, 0.035]} />
        {chrome}
      </mesh>
      <mesh position={[0.19, 0.012, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.035, 0.014, 6, 12, Math.PI * 1.6]} />
        {chrome}
      </mesh>
      <mesh position={[-0.19, 0.012, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.03, 0.012, 6, 14]} />
        {chrome}
      </mesh>
    </group>
  );
  return (
    <group>
      {wrench([-22.6, 0, -2.6], 0.5)}
      {wrench([-22.2, 0, -3.1], 2.1, 0.8)}
      {wrench([-6.2, 0, -6.5], 1.2)}
      {wrench([21.8, 0, -2.4], -0.8)}
      {[[-22.9, -1.9], [-22.5, -2.1], [-22.7, -2.4], [7, -6.8], [7.2, -6.5]].map(([x, z], i) => (
        <mesh key={i} position={[x!, 0.03, z!]} rotation={[i % 2 ? Math.PI / 2 : 0, 0, i % 2 ? 0.4 : 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.06, 6]} />
          {chrome}
        </mesh>
      ))}
      {/* traffic cones for the drift box */}
      {[[-6, 8], [6, 8], [0, 12], [-10, 12], [10, 12]].map(([x, z], i) => (
        <group key={i} position={[x!, 0, z!]}>
          <mesh position={[0, 0.36, 0]}>
            <coneGeometry args={[0.2, 0.7, 16]} />
            <meshStandardMaterial color="#ff5a1f" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.34, 0]}>
            <cylinderGeometry args={[0.13, 0.15, 0.1, 16]} />
            <meshStandardMaterial color="#f5f5f5" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <boxGeometry args={[0.46, 0.04, 0.46]} />
            <meshStandardMaterial color="#222" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function BayLines() {
  const label = (t: string) =>
    textTexture(`bay-${t}`, 512, 128, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(235,235,230,0.7)";
      ctx.font = "bold 92px 'Russo One', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(t, w / 2, 100);
    });
  const lines = [-13.5, -6.75, 0, 6.75, 13.5];
  return (
    <group>
      {lines.map((x) => (
        <mesh key={x} position={[x, 0.006, -12]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[0.12, 7]} />
          <meshStandardMaterial color="#d8d8d0" roughness={0.6} transparent opacity={0.65} />
        </mesh>
      ))}
      {["BAY 01", "BAY 02", "BAY 03", "BAY 04"].map((t, i) => (
        <mesh key={t} position={[-10.1 + i * 6.75, 0.007, -15]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[2.4, 0.6]} />
          <meshBasicMaterial map={label(t)} transparent depthWrite={false} />
        </mesh>
      ))}
      {/* drift box outline */}
      <mesh position={[0, 0.006, 8]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[7.9, 8.05, 64]} />
        <meshBasicMaterial color="#ff2e88" transparent opacity={0.45} />
      </mesh>
    </group>
  );
}

function Spot({ position, target, color = "#e8eeff", intensity = 160 }: { position: [number, number, number]; target: [number, number, number]; color?: string; intensity?: number }) {
  const t = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(...target);
    return o;
  }, [target]);
  return (
    <>
      <primitive object={t} />
      <spotLight position={position} target={t} angle={0.62} penumbra={0.7} intensity={intensity} distance={20} decay={1.6} color={color} />
    </>
  );
}

export function Garage({ reflect }: { reflect: boolean }) {
  return (
    <group>
      <Spot position={[-7, 9, -7]} target={[-7, 0, -10]} />
      <Spot position={[7, 9, -7]} target={[7, 0, -10]} color="#f0e8ff" />
      <Spot position={[-22, 8, -4]} target={[-27, 0.8, -4]} color="#ffe2c4" intensity={110} />
      <Spot position={[22, 8, -4]} target={[27, 0.8, -4]} color="#ffe2c4" intensity={110} />
      <Floor reflect={reflect} />
      <Walls />
      <Skyline />
      <CeilingLights />
      <Pillars />
      <BayLines />
      <FloorTools />
      <OilPuddle x={-6.5} z={-7.5} s={2.2} rot={0.4} seed={1} />
      <OilPuddle x={7.5} z={-6.2} s={1.6} rot={1.4} seed={4} />
      <OilPuddle x={-21} z={-5} s={1.4} rot={0.2} seed={7} />
      <OilPuddle x={3} z={4} s={2.6} rot={2.2} seed={9} />
      <OilPuddle x={19.5} z={8} s={1.8} rot={0.9} seed={12} />
      {/* neon signs */}
      <NeonSign text={["TOKYO NIGHT"]} color="#ff2e88" position={[-8.5, 6.6, -HZ + 0.08]} scale={1.5} />
      <NeonSign text={["東京 ドリフト"]} color="#1fb6ff" position={[8.5, 6.6, -HZ + 0.08]} scale={1.5} />
      <NeonSign text={["SP UNDERGROUND"]} color="#1fb6ff" position={[-HX + 0.08, 6.4, 8]} rotation={Math.PI / 2} scale={1.4} />
      <NeonSign text={["2 STEP // 14K"]} color="#c026ff" position={[HX - 0.08, 6.4, 8]} rotation={-Math.PI / 2} scale={1.4} />
      <pointLight position={[-8.5, 6, -HZ + 1.2]} color="#ff2e88" intensity={30} distance={14} decay={2} />
      <pointLight position={[8.5, 6, -HZ + 1.2]} color="#1fb6ff" intensity={30} distance={14} decay={2} />
      <pointLight position={[-HX + 1.2, 6, 8]} color="#1fb6ff" intensity={24} distance={12} decay={2} />
      <pointLight position={[HX - 1.2, 6, 8]} color="#c026ff" intensity={24} distance={12} decay={2} />
      {/* posters */}
      <Poster position={[-14, 3.2, -HZ + 0.03]} rotation={0} kind={0} />
      <Poster position={[14, 3.2, -HZ + 0.03]} rotation={0} kind={1} />
      <Poster position={[-HX + 0.03, 3.2, 2.5]} rotation={Math.PI / 2} kind={2} />
      <Poster position={[HX - 0.03, 3.2, 3]} rotation={-Math.PI / 2} kind={0} />
      {/* storage */}
      <Shelf position={[-HX + 0.4, 0, -13]} rotation={Math.PI / 2} />
      <Shelf position={[HX - 0.4, 0, -12]} rotation={-Math.PI / 2} />
      <TireRack position={[-HX + 4.5, 0, 13]} rotation={0.2} />
      <TireStack position={[HX - 5.5, 0, -16]} />
      <Drum position={[HX - 5, 0, 14]} color="#c4262e" />
      <Drum position={[HX - 4.3, 0, 14.6]} color="#1d4fd6" />
      <Drum position={[HX - 5.6, 0, 14.8]} color="#c4262e" />
      <Drum position={[-HX + 4.5, 0, -16]} color="#2a7a3a" />
      <Drum position={[-HX + 5.2, 0, -16.6]} color="#c4262e" tipped />
    </group>
  );
}
