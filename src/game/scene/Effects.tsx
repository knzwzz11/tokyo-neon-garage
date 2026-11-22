import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { world } from "../world";

const VERT = /* glsl */ `
attribute float aSize;
attribute float aAlpha;
attribute vec3 aColor;
varying float vAlpha;
varying vec3 vColor;
uniform float uScale;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uScale / max(0.1, -mv.z);
  vAlpha = aAlpha;
  vColor = aColor;
}`;

const FRAG = /* glsl */ `
varying float vAlpha;
varying vec3 vColor;
void main() {
  vec2 p = gl_PointCoord - 0.5;
  float d = length(p);
  float a = smoothstep(0.5, 0.0, d);
  a *= a;
  if (a * vAlpha < 0.003) discard;
  gl_FragColor = vec4(min(vColor, vec3(8.0)), clamp(a * vAlpha, 0.0, 1.0));
}`;

type Pool = {
  pos: Float32Array; vel: Float32Array; size: Float32Array; grow: Float32Array; alpha: Float32Array; alpha0: Float32Array;
  color: Float32Array; life: Float32Array; max: Float32Array; next: number; n: number;
};

function makePool(n: number): Pool {
  return {
    pos: new Float32Array(n * 3), vel: new Float32Array(n * 3), size: new Float32Array(n), grow: new Float32Array(n),
    alpha: new Float32Array(n), alpha0: new Float32Array(n), color: new Float32Array(n * 3), life: new Float32Array(n), max: new Float32Array(n).fill(1), next: 0, n,
  };
}

function Particles({ count, additive, register }: { count: number; additive: boolean; register: (spawn: (p: THREE.Vector3, v: THREE.Vector3, size: number, life: number, color: [number, number, number], alpha: number, grow: number) => void) => void }) {
  const pool = useMemo(() => makePool(count), [count]);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pool.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aSize", new THREE.BufferAttribute(pool.size, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aAlpha", new THREE.BufferAttribute(pool.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aColor", new THREE.BufferAttribute(pool.color, 3).setUsage(THREE.DynamicDrawUsage));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 200);
    return g;
  }, [pool]);
  const { size, camera } = useThree();
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthWrite: false,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
        uniforms: { uScale: { value: 400 } },
      }),
    [additive],
  );
  useLayoutEffect(() => {
    register((p, v, s, life, color, alpha, grow) => {
      const i = pool.next;
      pool.next = (pool.next + 1) % pool.n;
      pool.pos.set([p.x, p.y, p.z], i * 3);
      pool.vel.set([v.x, v.y, v.z], i * 3);
      pool.size[i] = s;
      pool.grow[i] = grow;
      pool.alpha0[i] = alpha;
      pool.alpha[i] = alpha;
      pool.color.set(color, i * 3);
      pool.life[i] = life;
      pool.max[i] = life;
    });
    return () => geo.dispose();
  }, [pool, register, geo]);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const persp = camera as THREE.PerspectiveCamera;
    mat.uniforms["uScale"]!.value = (size.height * 0.5) / Math.tan(((persp.fov ?? 50) * Math.PI) / 360);
    for (let i = 0; i < pool.n; i++) {
      if (pool.life[i]! <= 0) { pool.alpha[i] = 0; continue; }
      pool.life[i]! -= dt;
      const k = Math.max(0, pool.life[i]! / pool.max[i]!);
      const j = i * 3;
      const drag = Math.exp(-1.6 * dt);
      pool.vel[j] = pool.vel[j]! * drag;
      pool.vel[j + 1] = pool.vel[j + 1]! * drag + (additive ? 0.6 : 0.35) * dt;
      pool.vel[j + 2] = pool.vel[j + 2]! * drag;
      pool.pos[j] = pool.pos[j]! + pool.vel[j]! * dt;
      pool.pos[j + 1] = pool.pos[j + 1]! + pool.vel[j + 1]! * dt;
      pool.pos[j + 2] = pool.pos[j + 2]! + pool.vel[j + 2]! * dt;
      pool.size[i] = pool.size[i]! + pool.grow[i]! * dt;
      pool.alpha[i] = pool.alpha0[i]! * (additive ? k : Math.min(1, (1 - k) * 6) * k);
    }
    geo.attributes["position"]!.needsUpdate = true;
    geo.attributes["aSize"]!.needsUpdate = true;
    geo.attributes["aAlpha"]!.needsUpdate = true;
    geo.attributes["aColor"]!.needsUpdate = true;
  });
  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={additive ? 6 : 5} />;
}

const SKIDS = 2400;

function SkidMarks() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const state = useMemo(() => ({ next: 0, last: new Map<string, THREE.Vector3>(), dummy: new THREE.Object3D() }), []);
  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const zero = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < SKIDS; i++) m.setMatrixAt(i, zero);
    m.instanceMatrix.needsUpdate = true;
    world.fx.skid = (key, p, width) => {
      if (!p) { state.last.delete(key); return; }
      const prev = state.last.get(key);
      if (!prev) { state.last.set(key, p.clone()); return; }
      const dx = p.x - prev.x, dz = p.z - prev.z;
      const len = Math.hypot(dx, dz);
      if (len < 0.12) return;
      if (len > 3) { prev.copy(p); return; }
      const d = state.dummy;
      d.position.set((p.x + prev.x) / 2, 0.012 + (state.next % 7) * 0.0004, (p.z + prev.z) / 2);
      d.rotation.set(-Math.PI / 2, 0, Math.atan2(dx, dz));
      d.scale.set(width, len + 0.04, 1);
      d.updateMatrix();
      m.setMatrixAt(state.next, d.matrix);
      state.next = (state.next + 1) % SKIDS;
      m.instanceMatrix.needsUpdate = true;
      prev.copy(p);
    };
  }, [state]);
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, SKIDS]} frustumCulled={false} renderOrder={1}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial color="#050506" transparent opacity={0.62} depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
    </instancedMesh>
  );
}

function Flash() {
  const light = useRef<THREE.PointLight>(null);
  useLayoutEffect(() => {
    world.fx.flash = (p) => {
      if (!light.current) return;
      light.current.position.copy(p);
      light.current.intensity = 40;
    };
  }, []);
  useFrame((_, dt) => {
    if (light.current) light.current.intensity *= Math.exp(-22 * Math.min(dt, 0.05));
  });
  return <pointLight ref={light} color="#ff7a2a" intensity={0} distance={7} decay={2} />;
}

export function Effects() {
  const regSmoke = useMemo(
    () => (spawn: Parameters<Parameters<typeof Particles>[0]["register"]>[0]) => {
      world.fx.smoke = (p, v, size, life, shade, alpha, tint) => spawn(p, v, size, life, tint ?? [shade, shade, shade + 0.02], alpha, size * 1.6);
    },
    [],
  );
  const regFlame = useMemo(
    () => (spawn: Parameters<Parameters<typeof Particles>[0]["register"]>[0]) => {
      world.fx.flame = (p, v) => {
        const r = Math.random();
        const color: [number, number, number] = r < 0.25 ? [0.6, 1.2, 4] : r < 0.6 ? [5, 2.2, 0.5] : [4, 1.1, 0.2];
        spawn(p, v, 0.22 + Math.random() * 0.25, 0.12 + Math.random() * 0.12, color, 1, 1.2);
      };
    },
    [],
  );
  return (
    <>
      <SkidMarks />
      <Particles count={700} additive={false} register={regSmoke} />
      <Particles count={260} additive register={regFlame} />
      <Flash />
    </>
  );
}
