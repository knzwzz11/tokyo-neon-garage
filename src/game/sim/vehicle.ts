// Arcade vehicle model. Pure TS: no React, no three.js.
// Convention: yaw 0 faces +Z. forward = (sin yaw, cos yaw), right = (cos yaw, -sin yaw).
import type { VehicleSpec } from "./specs";

export type DriveInput = {
  throttle: number; // 0..1
  brake: number; // 0..1 (reverses when slow)
  steer: number; // -1 (left) .. 1 (right)
  handbrake: boolean;
  limiter: boolean; // rev limiter / corte de giro held
};

export type VehicleState = {
  x: number;
  z: number;
  yaw: number;
  vx: number;
  vz: number;
  yawRate: number;
  rpm: number;
  gear: number;
  slip: number;
  drifting: boolean;
  speed: number;
  vLong: number;
  /** 0..1 turbo boost, builds with throttle at revs */
  boost: number;
  /** true for one step when the limiter cut fires */
  limiterBang: boolean;
  limiterTimer: number;
  /** true for one step when throttle is lifted with boost (blow-off valve) */
  blowOff: boolean;
  prevThrottle: number;
  steerVisual: number;
};

export const LIMITER_INTERVAL = 0.085; // seconds between limiter cuts
export const DRIFT_SLIP = 0.22; // rad
export const DRIFT_MIN_SPEED = 5; // m/s

export function createVehicleState(x: number, z: number, yaw: number, idleRpm: number): VehicleState {
  return {
    x, z, yaw, vx: 0, vz: 0, yawRate: 0, rpm: idleRpm, gear: 1, slip: 0, drifting: false,
    speed: 0, vLong: 0, boost: 0, limiterBang: false, limiterTimer: 0, blowOff: false,
    prevThrottle: 0, steerVisual: 0,
  };
}

export const NO_INPUT: DriveInput = { throttle: 0, brake: 0, steer: 0, handbrake: false, limiter: false };

export function stepVehicle(s: VehicleState, input: DriveInput, spec: VehicleSpec, rawDt: number) {
  const dt = Math.min(rawDt, 0.05);
  const fx = Math.sin(s.yaw);
  const fz = Math.cos(s.yaw);
  const rx = Math.cos(s.yaw);
  const rz = -Math.sin(s.yaw);

  let vLong = s.vx * fx + s.vz * fz;
  let vLat = s.vx * rx + s.vz * rz;

  // Longitudinal forces
  if (input.throttle > 0) {
    const headroom = Math.max(0, 1 - vLong / spec.topSpeed);
    vLong += input.throttle * spec.accel * headroom * dt;
  }
  if (input.brake > 0) {
    if (vLong > 0.5) vLong -= input.brake * spec.brake * dt;
    else vLong = Math.max(-spec.topSpeed * 0.3, vLong - input.brake * spec.accel * 0.6 * dt);
  }
  if (input.handbrake) vLong *= Math.exp(-0.9 * dt);
  vLong *= Math.exp(-spec.drag * dt);
  if (input.throttle === 0 && input.brake === 0 && Math.abs(vLong) < 0.3) vLong = 0;

  // Lateral grip
  const grip = input.handbrake ? spec.driftGrip : spec.grip;
  vLat *= Math.exp(-grip * dt);

  // Steering scales with speed, reverses in reverse
  const speedFactor = Math.min(1, Math.abs(vLong) / 6) / (1 + Math.abs(vLong) / 40);
  const dir = vLong >= 0 ? 1 : -1;
  const targetYawRate = input.steer * spec.turn * speedFactor * dir * (input.handbrake ? 1.45 : 1);
  s.yawRate += (targetYawRate - s.yawRate) * (1 - Math.exp(-10 * dt));
  s.yaw += s.yawRate * dt;
  s.steerVisual += (input.steer - s.steerVisual) * (1 - Math.exp(-12 * dt));

  // Recompose in the new heading (velocity keeps its old direction -> slide)
  const nfx = Math.sin(s.yaw);
  const nfz = Math.cos(s.yaw);
  const nrx = Math.cos(s.yaw);
  const nrz = -Math.sin(s.yaw);
  const oldVx = fx * vLong + rx * vLat;
  const oldVz = fz * vLong + rz * vLat;
  // Re-project onto new axes so the car slides when yaw changes faster than grip catches up
  const nLong = oldVx * nfx + oldVz * nfz;
  const nLat = oldVx * nrx + oldVz * nrz;
  s.vx = nfx * nLong + nrx * nLat;
  s.vz = nfz * nLong + nrz * nLat;
  s.x += s.vx * dt;
  s.z += s.vz * dt;

  s.vLong = nLong;
  s.speed = Math.hypot(s.vx, s.vz);
  s.slip = s.speed > 3 ? Math.atan2(Math.abs(nLat), Math.abs(nLong)) : 0;
  s.drifting = s.speed > DRIFT_MIN_SPEED && s.slip > DRIFT_SLIP;

  // Engine: gear by speed band, rpm inside band
  const band = spec.topSpeed / spec.gears;
  const absV = Math.abs(nLong);
  s.gear = Math.min(spec.gears, Math.floor(absV / band) + 1);
  const inBand = (absV - (s.gear - 1) * band) / band;
  const low = s.gear === 1 ? 0 : 0.45;
  let targetRpm = spec.idleRpm + (low + (1 - low) * inBand) * (spec.redline - spec.idleRpm) * (absV > 0.2 ? 1 : 0);
  if (s.drifting) targetRpm = Math.max(targetRpm, spec.redline * (0.75 + 0.15 * input.throttle));
  if (input.throttle > 0 && absV < 0.5) targetRpm = spec.idleRpm + input.throttle * (spec.redline - spec.idleRpm) * 0.7;

  s.limiterBang = false;
  if (input.limiter) {
    targetRpm = spec.redline;
    s.limiterTimer -= dt;
    if (s.limiterTimer <= 0) {
      s.limiterTimer = LIMITER_INTERVAL;
      s.limiterBang = true;
      s.rpm = spec.redline * 0.93; // cut: needle drops then bounces back
    }
  } else {
    s.limiterTimer = 0;
  }
  s.rpm += (targetRpm - s.rpm) * (1 - Math.exp(-(input.limiter ? 30 : 8) * dt));
  s.rpm = Math.min(spec.redline, Math.max(spec.idleRpm * 0.9, s.rpm));

  // Turbo boost + blow-off valve on throttle lift
  const load = Math.max(input.throttle, input.limiter ? 1 : 0);
  const boostTarget = load * Math.min(1, (s.rpm - spec.idleRpm) / (spec.redline * 0.55));
  s.boost += (boostTarget - s.boost) * (1 - Math.exp(-(boostTarget > s.boost ? 2.5 : 6) * dt));
  s.blowOff = s.prevThrottle > 0.5 && load < 0.1 && s.boost > 0.35;
  s.prevThrottle = load;
  return s;
}

// ---- Collision -------------------------------------------------------------

export type Circle = { x: number; z: number; r: number };
export type Bounds = { minX: number; maxX: number; minZ: number; maxZ: number };

export const RESTITUTION = 0.35;

/** Pushes the vehicle out of walls and circles; returns impact speed (0 when nothing hit). */
export function collide(s: VehicleState, radius: number, bounds: Bounds, circles: Circle[]): number {
  let impact = 0;
  if (s.x - radius < bounds.minX) { s.x = bounds.minX + radius; impact = Math.max(impact, Math.abs(s.vx)); s.vx = Math.abs(s.vx) * RESTITUTION; }
  if (s.x + radius > bounds.maxX) { s.x = bounds.maxX - radius; impact = Math.max(impact, Math.abs(s.vx)); s.vx = -Math.abs(s.vx) * RESTITUTION; }
  if (s.z - radius < bounds.minZ) { s.z = bounds.minZ + radius; impact = Math.max(impact, Math.abs(s.vz)); s.vz = Math.abs(s.vz) * RESTITUTION; }
  if (s.z + radius > bounds.maxZ) { s.z = bounds.maxZ - radius; impact = Math.max(impact, Math.abs(s.vz)); s.vz = -Math.abs(s.vz) * RESTITUTION; }
  for (const c of circles) {
    const dx = s.x - c.x;
    const dz = s.z - c.z;
    const d = Math.hypot(dx, dz);
    const min = radius + c.r;
    if (d < min && d > 1e-6) {
      const nx = dx / d;
      const nz = dz / d;
      s.x = c.x + nx * min;
      s.z = c.z + nz * min;
      const vn = s.vx * nx + s.vz * nz;
      if (vn < 0) {
        impact = Math.max(impact, -vn);
        s.vx -= (1 + RESTITUTION) * vn * nx;
        s.vz -= (1 + RESTITUTION) * vn * nz;
      }
    }
  }
  return impact;
}
