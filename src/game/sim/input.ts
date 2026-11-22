// Maps held keys + touch values to a DriveInput. Pure TS.
// Screen-right with the chase camera is the vehicle's right, which is a yaw DECREASE
// (yaw 0 faces +Z, and +X is screen-left from behind), so D/ArrowRight => steer -1.
import type { DriveInput } from "./vehicle";

export type HeldKeys = Set<string>;
export type TouchAxes = { steer: number; throttle: number; brake: number; handbrake: boolean; limiter: boolean };

export function keysToInput(keys: HeldKeys, touch: TouchAxes): DriveInput {
  const left = keys.has("KeyA") || keys.has("ArrowLeft");
  const right = keys.has("KeyD") || keys.has("ArrowRight");
  const up = keys.has("KeyW") || keys.has("ArrowUp");
  const down = keys.has("KeyS") || keys.has("ArrowDown");
  const steerKeys = (left ? 1 : 0) - (right ? 1 : 0);
  // touch.steer: -1 = stick left, +1 = stick right (screen space)
  const steer = Math.max(-1, Math.min(1, steerKeys - touch.steer));
  return {
    throttle: Math.max(up ? 1 : 0, touch.throttle),
    brake: Math.max(down ? 1 : 0, touch.brake),
    steer,
    handbrake: keys.has("Space") || touch.handbrake,
    limiter: keys.has("KeyR") || touch.limiter,
  };
}
