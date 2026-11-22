// UI-facing actions shared by the 3D scene and the HUD.
import { audio } from "./audio/audio";
import { useUI, type HotspotId } from "./store";
import { FOCUS, world } from "./world";

export function focusCamera(id: HotspotId) {
  if (useUI.getState().mode !== "orbit") return;
  world.focus = FOCUS[id];
}

export function activateHotspot(id: HotspotId) {
  const ui = useUI.getState();
  audio.ensure();
  focusCamera(id);
  if (id === "chest") {
    audio.drawer();
    ui.open({ kind: "drawers" });
  } else if (id === "phone") {
    audio.ring();
    ui.open({ kind: "phone" });
  } else if (id === "portrait") {
    if (ui.helmet === "on") {
      audio.unbuckle();
      ui.setHelmet("falling");
      ui.setHovered(null);
      // the helmet opens the bio when it has dissolved
    } else if (ui.helmet === "gone") {
      ui.open({ kind: "bio" });
    }
  }
}

export function closeModal() {
  useUI.getState().close();
  if (world.focus) {
    world.focus = null;
    world.returning = true;
  }
}

export function enterDrive() {
  audio.ensure();
  const ui = useUI.getState();
  ui.close();
  world.focus = null;
  world.driftScore = 0;
  ui.setMode("drive");
}

export function exitDrive() {
  const ui = useUI.getState();
  ui.setMode("orbit");
  ui.setNear(null);
  world.keys.clear();
  world.returning = true;
}

/** One short burst of the rev limiter on the selected (parked) vehicle. */
export function revBurst(ms = 1200) {
  audio.ensure();
  world.revUntil = performance.now() + ms;
}
