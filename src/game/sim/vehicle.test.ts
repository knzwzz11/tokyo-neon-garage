import { describe, expect, it } from "vitest";
import { SPECS } from "./specs";
import { collide, createVehicleState, NO_INPUT, stepVehicle, type DriveInput } from "./vehicle";

const DT = 1 / 60;
function run(seconds: number, input: DriveInput, id: keyof typeof SPECS = "r34", s = createVehicleState(0, 0, 0, SPECS[id].idleRpm)) {
  for (let t = 0; t < seconds; t += DT) stepVehicle(s, input, SPECS[id], DT);
  return s;
}
const gas: DriveInput = { ...NO_INPUT, throttle: 1 };

describe("vehicle", () => {
  it("W drives toward +Z at yaw 0", () => {
    const s = run(1, gas);
    expect(s.z).toBeGreaterThan(2);
    expect(Math.abs(s.x)).toBeLessThan(0.01);
  });

  it("flat out reaches 80% of top speed within 8 s", () => {
    const s = run(8, gas);
    expect(s.speed).toBeGreaterThan(SPECS.r34.topSpeed * 0.8);
  });

  it("a parked vehicle reports no slip or drift", () => {
    const s = run(1, { ...NO_INPUT, steer: 1, handbrake: true });
    expect(s.slip).toBe(0);
    expect(s.drifting).toBe(false);
  });

  it("holding SPACE while steering at speed starts a drift; plain steering keeps grip", () => {
    const fast = () => run(3, gas);
    const grip = run(0.6, { ...gas, steer: 1 }, "r34", fast());
    const drift = run(0.6, { ...gas, steer: 1, handbrake: true }, "r34", fast());
    expect(drift.slip).toBeGreaterThan(grip.slip);
    expect(drift.drifting).toBe(true);
  });

  it("the bike's rev limiter cuts at 14,000 RPM and bangs repeatedly", () => {
    const s = createVehicleState(0, 0, 0, SPECS.bike.idleRpm);
    let bangs = 0;
    let peak = 0;
    for (let t = 0; t < 1; t += DT) {
      stepVehicle(s, { ...NO_INPUT, limiter: true }, SPECS.bike, DT);
      if (s.limiterBang) bangs++;
      peak = Math.max(peak, s.rpm);
    }
    expect(SPECS.bike.redline).toBe(14000);
    expect(peak).toBeLessThanOrEqual(14000);
    expect(peak).toBeGreaterThan(13000);
    expect(bangs).toBeGreaterThanOrEqual(8);
  });

  it("walls push the vehicle back inside and bounce it", () => {
    const s = createVehicleState(9.5, 0, Math.PI / 2, 900);
    s.vx = 20;
    const impact = collide(s, 1, { minX: -10, maxX: 10, minZ: -10, maxZ: 10 }, []);
    expect(s.x).toBe(9);
    expect(s.vx).toBeLessThan(0);
    expect(impact).toBe(20);
  });
});

import { keysToInput } from "./input";
const noTouch = { steer: 0, throttle: 0, brake: 0, handbrake: false, limiter: false };

describe("controls", () => {
  it("W + D turns toward screen-right (world -X) from the chase camera", () => {
    const input = keysToInput(new Set(["KeyW", "KeyD"]), noTouch);
    const s = run(1.5, input);
    expect(s.x).toBeLessThan(0);
  });
  it("touch stick right matches the D key", () => {
    expect(keysToInput(new Set(), { ...noTouch, steer: 1 }).steer).toBe(keysToInput(new Set(["KeyD"]), noTouch).steer);
  });
  it("SPACE is the handbrake and R the rev limiter", () => {
    const i = keysToInput(new Set(["Space", "KeyR"]), noTouch);
    expect(i.handbrake).toBe(true);
    expect(i.limiter).toBe(true);
  });
});
