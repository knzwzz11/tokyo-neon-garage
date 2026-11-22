import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { audio } from "../audio/audio";
import { keysToInput } from "../sim/input";
import { SPECS, VEHICLE_ORDER, type VehicleId } from "../sim/specs";
import { collide, NO_INPUT, stepVehicle, type Circle } from "../sim/vehicle";
import { useUI, type HotspotId } from "../store";
import { BOUNDS, PILLARS, PROP_CIRCLES, STATIONS, world } from "../world";

/** The one stepper: advances vehicles, effects, audio and HUD telemetry in a fixed order. */
export function Stepper() {
  const tmp = useMemo(() => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), q: new THREE.Vector3() }), []);
  const acc = useRef({ hud: 0, exhaust: 0, smoke: 0, lastCrash: 0, prevV: new Map<VehicleId, number>() });

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const ui = useUI.getState();
    const driving = ui.mode === "drive" && ui.view === "3d";
    const active: VehicleId | null = driving ? ui.selected : null;
    const revOn = !driving && ui.view === "3d" && (world.revHold || performance.now() < world.revUntil);
    const revving: VehicleId | null = revOn ? ui.selected : null;
    const input = active && !ui.modal ? keysToInput(world.keys, world.touch) : NO_INPUT;
    const a = acc.current;

    for (const id of VEHICLE_ORDER) {
      const rig = world.vehicles[id];
      const spec = SPECS[id];
      const s = rig.state;
      const isBike = spec.kind === "bike";
      if (id === active) {
        stepVehicle(s, input, spec, dt);
        const circles: Circle[] = [...PILLARS, ...PROP_CIRCLES];
        for (const other of VEHICLE_ORDER) {
          if (other === id) continue;
          const o = world.vehicles[other].state;
          circles.push({ x: o.x, z: o.z, r: SPECS[other].radius * 0.85 });
        }
        const impact = collide(s, spec.radius * 0.8, BOUNDS, circles);
        if (impact > 4 && performance.now() - a.lastCrash > 250) {
          a.lastCrash = performance.now();
          audio.crash(impact);
        }
        if (s.drifting) world.driftScore += s.speed * s.slip * dt * 12;
      } else if (id === revving) {
        stepVehicle(s, { ...NO_INPUT, limiter: true }, spec, dt);
      } else {
        s.rpm += (spec.idleRpm - s.rpm) * (1 - Math.exp(-4 * dt));
        s.limiterBang = false;
        s.blowOff = false;
        s.drifting = false;
      }

      const g = rig.group;
      if (!g) continue;
      g.position.set(s.x, 0, s.z);
      g.rotation.y = s.yaw;
      g.updateMatrixWorld();
      const r = isBike ? 0.31 : 0.34;
      for (const w of rig.wheels) w.rotation.z -= (s.vLong * dt) / r;
      for (const st of rig.steerers) st.rotation.y = s.steerVisual * (isBike ? 0.35 : 0.5);
      if (rig.body) {
        const prev = a.prevV.get(id) ?? s.vLong;
        const longAcc = (s.vLong - prev) / Math.max(dt, 1e-3);
        a.prevV.set(id, s.vLong);
        const speedK = Math.min(1, s.speed / 12);
        const lean = isBike ? -s.steerVisual * 0.5 * speedK : s.steerVisual * 0.05 * speedK;
        rig.body.rotation.z += (lean - rig.body.rotation.z) * (1 - Math.exp(-8 * dt));
        const pitch = THREE.MathUtils.clamp(-longAcc * 0.0025, -0.04, 0.04) + (id === revving ? Math.sin(performance.now() * 0.08) * 0.004 : 0);
        rig.body.rotation.x += (pitch - rig.body.rotation.x) * (1 - Math.exp(-6 * dt));
        if (isBike && id === active && input.throttle > 0.5 && s.speed < 6 && s.gear === 1) rig.body.rotation.x = Math.max(rig.body.rotation.x - dt * 0.6, -0.18);
      }

      // ---- effects
      const running = id === active || id === revving;
      const fx = Math.sin(s.yaw);
      const fz = Math.cos(s.yaw);
      if (running) {
        const ex = rig.exhausts[0];
        if (ex) {
          tmp.p.set(ex[0], ex[1], ex[2]).applyMatrix4(g.matrixWorld);
          const throttle = Math.max(input.throttle, id === revving ? 1 : 0);
          a.exhaust += dt * (6 + throttle * 26);
          while (a.exhaust > 1) {
            a.exhaust -= 1;
            tmp.v.set(-fx * (1 + Math.random()) + s.vx * 0.4 + (Math.random() - 0.5) * 0.4, 0.25 + Math.random() * 0.3, -fz * (1 + Math.random()) + s.vz * 0.4 + (Math.random() - 0.5) * 0.4);
            world.fx.smoke(tmp.p, tmp.v, 0.18 + throttle * 0.12, 1.1, 0.62, 0.18 + throttle * 0.12);
          }
          if (s.limiterBang) {
            const n = 6 + Math.floor(Math.random() * 8);
            for (let i = 0; i < n; i++) {
              const sp = 4 + Math.random() * 6;
              tmp.v.set(-fx * sp + (Math.random() - 0.5) * 1.2 + s.vx, (Math.random() - 0.2) * 1.2 + (isBike ? 1.2 : 0), -fz * sp + (Math.random() - 0.5) * 1.2 + s.vz);
              tmp.q.copy(tmp.p).addScaledVector(tmp.v, 0.01);
              world.fx.flame(tmp.q, tmp.v);
            }
            world.fx.flash(tmp.p);
            audio.pop(0.7 + Math.random() * 0.4);
            tmp.v.set(-fx * 1.5, 0.6, -fz * 1.5);
            world.fx.smoke(tmp.p, tmp.v, 0.35, 1.4, 0.4, 0.35);
          }
        }
        if (s.blowOff) audio.blowOff();
      }
      if (rig.light) {
        rig.light.intensity = (isBike ? 6 : 9) * (s.limiterBang ? 1.6 : 1);
      }
      // skid marks + tyre smoke
      const skidding = id === active && (s.drifting || (input.brake > 0.5 && s.vLong > 12) || (input.handbrake && s.speed > 6));
      rig.rearContacts.forEach((c, i) => {
        const key = `${id}-${i}`;
        if (!skidding) { world.fx.skid(key, null, 0); return; }
        tmp.p.set(c[0], c[1], c[2]).applyMatrix4(g.matrixWorld);
        world.fx.skid(key, tmp.p.clone(), isBike ? 0.13 : 0.24);
        a.smoke += dt * (10 + s.slip * 40);
        while (a.smoke > 1) {
          a.smoke -= 1;
          tmp.v.set((Math.random() - 0.5) * 1.6 - s.vx * 0.08, 0.4 + Math.random() * 0.8, (Math.random() - 0.5) * 1.6 - s.vz * 0.08);
          world.fx.smoke(tmp.p.clone().setY(0.25), tmp.v, 0.6 + Math.random() * 0.5, 2 + Math.random() * 1.2, 0.82, 0.32);
        }
      });
    }

    // ---- audio
    const voice = active ?? revving;
    if (voice && ui.audioOn) {
      if (!audio.engineRunning) audio.startEngine();
      const s = world.vehicles[voice].state;
      const spec = SPECS[voice];
      audio.updateEngine({
        rpm: s.rpm, redline: spec.redline, throttle: voice === revving ? 1 : input.throttle, cylinders: spec.cylinders,
        boost: s.boost, slip: voice === active ? s.slip : 0, speed: s.speed, bike: spec.kind === "bike",
      });
    } else if (audio.engineRunning) {
      audio.stopEngine();
    }

    // ---- HUD telemetry (10 Hz) + stations
    a.hud += dt;
    if (a.hud > 0.1) {
      a.hud = 0;
      const id = voice ?? ui.selected;
      const s = world.vehicles[id].state;
      ui.setTelemetry({ speed: s.speed * 3.6, rpm: s.rpm, redline: SPECS[id].redline, gear: s.gear, drifting: s.drifting, driftScore: Math.floor(world.driftScore), x: s.x, z: s.z, yaw: s.yaw });
      if (active) {
        let near: HotspotId | null = null;
        let best = 5.5;
        (Object.keys(STATIONS) as HotspotId[]).forEach((k) => {
          const st = STATIONS[k];
          const d = Math.hypot(st.x - s.x, st.z - s.z);
          if (d < best) { best = d; near = k; }
        });
        if (near !== ui.near) ui.setNear(near);
      }
    }
  });
  return null;
}
