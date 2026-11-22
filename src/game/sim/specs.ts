// Vehicle handling specs. Pure data: no React, no three.js.
export type VehicleId = "r34" | "supra" | "eclipse" | "bike";

export type VehicleSpec = {
  id: VehicleId;
  name: string;
  short: string;
  kind: "car" | "bike";
  /** m/s^2 at zero speed */
  accel: number;
  /** m/s */
  topSpeed: number;
  brake: number;
  /** longitudinal drag rate (1/s) */
  drag: number;
  /** lateral grip rate (1/s); higher = less slide */
  grip: number;
  /** lateral grip while handbrake is held */
  driftGrip: number;
  /** yaw rate at full lock (rad/s) */
  turn: number;
  idleRpm: number;
  redline: number;
  /** engine firing multiplier: fundamental Hz = rpm/60 * cyl/2 */
  cylinders: number;
  gears: number;
  radius: number;
  underglow: string;
  park: { x: number; z: number; yaw: number };
};

export const SPECS: Record<VehicleId, VehicleSpec> = {
  r34: {
    id: "r34", name: "Nissan Skyline GT-R R34", short: "R34", kind: "car",
    accel: 13, topSpeed: 46, brake: 26, drag: 0.04, grip: 7.5, driftGrip: 1.1, turn: 2.3,
    idleRpm: 950, redline: 8000, cylinders: 6, gears: 6, radius: 2.1, underglow: "#1fb6ff",
    park: { x: -10, z: -9, yaw: 0.35 },
  },
  supra: {
    id: "supra", name: "Toyota Supra MK4", short: "SUPRA", kind: "car",
    accel: 13.5, topSpeed: 47, brake: 25, drag: 0.04, grip: 7, driftGrip: 1, turn: 2.25,
    idleRpm: 900, redline: 7800, cylinders: 6, gears: 6, radius: 2.1, underglow: "#3dff8a",
    park: { x: -3.5, z: -11, yaw: 0.12 },
  },
  eclipse: {
    id: "eclipse", name: "Mitsubishi Eclipse GSX", short: "ECLIPSE", kind: "car",
    accel: 12, topSpeed: 43, brake: 24, drag: 0.045, grip: 7.8, driftGrip: 1.3, turn: 2.4,
    idleRpm: 1000, redline: 7500, cylinders: 4, gears: 5, radius: 2.0, underglow: "#1fb6ff",
    park: { x: 3.5, z: -11, yaw: -0.12 },
  },
  bike: {
    id: "bike", name: "Superbike branca 3D", short: "CBR", kind: "bike",
    accel: 16, topSpeed: 52, brake: 22, drag: 0.035, grip: 9, driftGrip: 1.8, turn: 2.6,
    idleRpm: 1300, redline: 14000, cylinders: 4, gears: 6, radius: 1.1, underglow: "#c026ff",
    park: { x: 10.5, z: -9, yaw: -0.4 },
  },
};

export const VEHICLE_ORDER: VehicleId[] = ["bike", "r34", "supra", "eclipse"];
