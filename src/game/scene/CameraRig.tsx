import { useFrame, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { SPECS } from "../sim/specs";
import { useUI } from "../store";
import { HOME_VIEW, world } from "../world";

export function CameraRig() {
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const tmp = useMemo(() => ({ pos: new THREE.Vector3(), look: new THREE.Vector3(), target: new THREE.Vector3() }), []);
  useFrame((state, delta) => {
    if (!controls) return;
    const dt = Math.min(delta, 0.05);
    const cam = state.camera;
    const ui = useUI.getState();
    const save = () => {
      if (!world.saved) world.saved = { pos: cam.position.toArray() as [number, number, number], target: controls.target.toArray() as [number, number, number] };
    };
    controls.autoRotate = ui.mode === "orbit" && !ui.modal && !world.focus && ui.hovered === null;

    if (ui.mode === "drive" && ui.view === "3d") {
      save();
      controls.enabled = false;
      const id = ui.selected;
      const s = world.vehicles[id].state;
      const bike = SPECS[id].kind === "bike";
      let dx = Math.sin(s.yaw), dz = Math.cos(s.yaw);
      if (s.speed > 3) {
        const vx = s.vx / s.speed, vz = s.vz / s.speed;
        const sign = s.vLong < 0 ? -1 : 1;
        dx = dx * 0.55 + vx * sign * 0.45;
        dz = dz * 0.55 + vz * sign * 0.45;
        const l = Math.hypot(dx, dz) || 1;
        dx /= l; dz /= l;
      }
      const back = bike ? 5.2 : 7.2;
      const up = bike ? 2.3 : 3.1;
      const extra = Math.min(2, s.speed / 20);
      tmp.pos.set(s.x - dx * (back + extra), up + extra * 0.4, s.z - dz * (back + extra));
      cam.position.lerp(tmp.pos, 1 - Math.exp(-4.5 * dt));
      tmp.look.set(s.x + dx * 3, bike ? 0.9 : 1.0, s.z + dz * 3);
      controls.target.lerp(tmp.look, 1 - Math.exp(-8 * dt));
      cam.lookAt(controls.target);
      return;
    }

    const goal = world.focus ?? (world.returning ? world.saved ?? HOME_VIEW : null);
    if (goal) {
      if (world.focus) save();
      controls.enabled = false;
      tmp.pos.fromArray(goal.pos);
      tmp.target.fromArray(goal.target);
      const k = 1 - Math.exp(-3.2 * dt);
      cam.position.lerp(tmp.pos, k);
      controls.target.lerp(tmp.target, k);
      cam.lookAt(controls.target);
      if (!world.focus && cam.position.distanceTo(tmp.pos) < 0.08 && controls.target.distanceTo(tmp.target) < 0.08) {
        world.returning = false;
        world.saved = null;
        controls.enabled = true;
      }
      return;
    }
    controls.enabled = true;
  });
  return null;
}
