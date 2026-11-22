// Mutable per-frame runtime state shared by the stepper and the scene. Not React state.
import type * as THREE from "three";
import { SPECS, type VehicleId } from "./sim/specs";
import { createVehicleState, type Bounds, type Circle, type VehicleState } from "./sim/vehicle";
import type { HotspotId } from "./store";
import type { TouchAxes } from "./sim/input";

export type VehicleRig = {
  state: VehicleState;
  group: THREE.Group | null;
  body: THREE.Group | null;
  wheels: THREE.Object3D[]; // [fl, fr, rl, rr] (bike: [front, rear])
  steerers: THREE.Object3D[];
  /** exhaust tips in vehicle-local space (x right-ish, y up, z forward) */
  exhausts: [number, number, number][];
  /** rear contact points (local) for skid marks */
  rearContacts: [number, number, number][];
  light: THREE.PointLight | null;
};

function rig(id: VehicleId): VehicleRig {
  const p = SPECS[id].park;
  return {
    state: createVehicleState(p.x, p.z, p.yaw, SPECS[id].idleRpm),
    group: null, body: null, wheels: [], steerers: [], exhausts: [], rearContacts: [], light: null,
  };
}

export const GARAGE = { halfX: 28, halfZ: 20, height: 10 };

export const BOUNDS: Bounds = { minX: -GARAGE.halfX + 2.2, maxX: GARAGE.halfX - 2.2, minZ: -GARAGE.halfZ + 1.6, maxZ: GARAGE.halfZ - 1 };

export const PILLARS: Circle[] = [
  { x: -15, z: 6, r: 0.8 }, { x: 15, z: 6, r: 0.8 }, { x: -17, z: -12, r: 0.8 }, { x: 17, z: -12, r: 0.8 },
];
export const PROP_CIRCLES: Circle[] = [
  { x: -23.5, z: 13, r: 2.2 }, // tyre rack
  { x: 23, z: 14, r: 1.8 }, // fuel drums
  { x: -23.5, z: -16, r: 1.6 }, // drums back left
  { x: 22.5, z: -15.5, r: 2 }, // tyre stack
];

/** Floor point a driver must reach to inspect a hotspot. */
export const STATIONS: Record<HotspotId, { x: number; z: number; label: string }> = {
  chest: { x: -23, z: -4, label: "GAVETAS" },
  portrait: { x: 0, z: -15, label: "RETRATO" },
  phone: { x: 23, z: -4, label: "TELEFONE" },
};

export const FOCUS: Record<HotspotId, { pos: [number, number, number]; target: [number, number, number] }> = {
  chest: { pos: [-18.5, 3.6, -2], target: [-26, 1.2, -4] },
  portrait: { pos: [0, 4.6, -8], target: [0, 1.6, -18.5] },
  phone: { pos: [18.5, 3.6, -2], target: [26, 1.4, -4] },
};

export const HOME_VIEW = { pos: [5, 5.6, 2.5] as [number, number, number], target: [0, 0.8, -9] as [number, number, number] };

export const world = {
  keys: new Set<string>(),
  touch: { steer: 0, throttle: 0, brake: 0, handbrake: false, limiter: false } as TouchAxes,
  vehicles: {
    r34: rig("r34"), supra: rig("supra"), eclipse: rig("eclipse"), bike: rig("bike"),
  } as Record<VehicleId, VehicleRig>,
  /** orbit-mode rev request: until (performance.now ms) */
  revUntil: 0,
  revHold: false,
  focus: null as null | { pos: [number, number, number]; target: [number, number, number] },
  saved: null as null | { pos: [number, number, number]; target: [number, number, number] },
  returning: false,
  fx: {
    smoke: (_p: THREE.Vector3, _v: THREE.Vector3, _size: number, _life: number, _shade: number, _alpha: number, _tint?: [number, number, number]) => {},
    flame: (_p: THREE.Vector3, _v: THREE.Vector3) => {},
    skid: (_key: string, _p: THREE.Vector3 | null, _width: number) => {},
    flash: (_p: THREE.Vector3) => {},
  },
  driftScore: 0,
};

export function resetVehicle(id: VehicleId) {
  const p = SPECS[id].park;
  world.vehicles[id].state = createVehicleState(p.x, p.z, p.yaw, SPECS[id].idleRpm);
}
