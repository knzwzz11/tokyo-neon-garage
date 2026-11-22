import { Environment, Lightformer, OrbitControls, PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { Component, memo, useEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { audio } from "./audio/audio";
import { activateHotspot, closeModal, exitDrive, revBurst } from "./actions";
import { CameraRig } from "./scene/CameraRig";
import { Effects } from "./scene/Effects";
import { Garage } from "./scene/Garage";
import { Hotspots } from "./scene/Hotspots";
import { Stepper } from "./scene/Stepper";
import { Vehicles } from "./scene/Vehicles";
import { useUI } from "./store";
import { HOME_VIEW, world } from "./world";

const DEG = Math.PI / 180;

function DebugHook() {
  const three = useThree();
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (window as unknown as { __game: unknown }).__game = { world, ui: useUI, three, audio };
  }, [three]);
  return null;
}

function ReadySignal({ onReady }: { onReady: () => void }) {
  const frames = useRef(0);
  useFrame(() => {
    frames.current++;
    if (frames.current === 4) onReady();
  });
  return null;
}

const World = memo(function World({ quality }: { quality: { reflect: boolean; bloom: boolean } }) {
  return (
    <>
      <color attach="background" args={["#05060a"]} />
      <fog attach="fog" args={["#05060a", 34, 80]} />
      <ambientLight intensity={0.6} color="#8090c0" />
      <hemisphereLight args={["#3a4870", "#0a0a10", 0.6]} />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[20, 2, 1]} />
        <Lightformer form="rect" intensity={2} position={[0, 6, -6]} rotation-x={Math.PI / 2} scale={[20, 1, 1]} />
        <Lightformer form="rect" intensity={2.5} color="#ff2e88" position={[-10, 2, -4]} rotation-y={Math.PI / 2} scale={[14, 1.5, 1]} />
        <Lightformer form="rect" intensity={2.5} color="#1fb6ff" position={[10, 2, -4]} rotation-y={-Math.PI / 2} scale={[14, 1.5, 1]} />
        <Lightformer form="ring" intensity={2} color="#c026ff" position={[0, 3, 10]} scale={4} />
      </Environment>
      <Garage reflect={quality.reflect} />
      <Vehicles />
      <Hotspots />
      <Effects />
      <Stepper />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        enablePan={false}
        minPolarAngle={15 * DEG}
        maxPolarAngle={75 * DEG}
        minDistance={6}
        maxDistance={17}
        autoRotate
        autoRotateSpeed={0.35}
        target={HOME_VIEW.target}
      />
      <CameraRig />
      {quality.bloom && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={0.85} luminanceThreshold={1} luminanceSmoothing={0.2} levels={6} />
          <Vignette eskil={false} offset={0.25} darkness={0.7} />
        </EffectComposer>
      )}
    </>
  );
});

class CanvasBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch(error: unknown) {
    console.error("3D garage failed", error);
    this.props.onError();
  }
  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function GameCanvas() {
  const wrap = useRef<HTMLDivElement>(null);
  const setReady = useUI((s) => s.setReady);
  const setWebglFailed = useUI((s) => s.setWebglFailed);
  const [quality, setQuality] = useState({ reflect: true, bloom: true });
  const [dpr, setDpr] = useState(1.5);
  const [ok] = useState(() => hasWebGL());

  useEffect(() => {
    if (!ok) setWebglFailed();
  }, [ok, setWebglFailed]);

  useEffect(() => {
    const isField = (t: EventTarget | null) => t instanceof HTMLElement && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
    const down = (e: KeyboardEvent) => {
      if (isField(e.target)) return;
      const ui = useUI.getState();
      if (ui.view !== "3d") return;
      audio.ensure();
      if (e.code === "Escape") {
        if (e.defaultPrevented) return;
        if (ui.modal) closeModal();
        else if (ui.mode === "drive") exitDrive();
        return;
      }
      if (ui.modal) return;
      if (ui.mode === "drive") {
        if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
        if (e.code === "Enter" && ui.near) activateHotspot(ui.near);
        world.keys.add(e.code);
      } else if (e.code === "KeyR" && !e.repeat) {
        world.revHold = true;
        revBurst(300);
      }
    };
    const up = (e: KeyboardEvent) => {
      world.keys.delete(e.code);
      if (e.code === "KeyR") world.revHold = false;
    };
    const blur = () => { world.keys.clear(); world.revHold = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      document.body.style.cursor = "";
    };
  }, []);

  if (!ok) return null;
  return (
    <div ref={wrap} className="absolute inset-0" data-garage-canvas>
      <CanvasBoundary onError={setWebglFailed}>
        <Canvas
          dpr={[1, dpr]}
          camera={{ position: HOME_VIEW.pos, fov: 50, near: 0.1, far: 160 }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.15;
          }}
          onPointerMissed={() => useUI.getState().setHovered(null)}
        >
          <PerformanceMonitor
            onDecline={() => {
              setDpr(1);
              setQuality((q) => (q.reflect ? { ...q, reflect: false } : { reflect: false, bloom: false }));
            }}
          />
          <World quality={quality} />
          <DebugHook />
          <ReadySignal
            onReady={() => {
              wrap.current?.setAttribute("data-scene-ready", "true");
              setReady();
            }}
          />
        </Canvas>
      </CanvasBoundary>
    </div>
  );
}
