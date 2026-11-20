/**
 * Cinematic hero shots for every power: one piece in a world that matches
 * the power's element (an ice cave for freezes, a volcano for fire, a
 * temple for holy light) with the power playing on it. Used for card art
 * and the live hover preview.
 */

import type { PieceKind, Side } from "@/engine";
import { ALL_POWERS } from "@/features/powers";
import { ENVIRONMENTS } from "../env";
import { grassland } from "../env/grassland";
import type { EnvironmentId } from "../env/types";
import type { Effect } from "../fx";
import { fxContext } from "./director";
import { shootCamera, stageHero } from "./cinematic";
import type { SceneDef } from "./types";
import { SHOTS, type ShotSpec } from "./powerShots";

const DOF = { focus: 2.6, aperture: 0.012, maxblur: 0.008 };

function buildEnvironment(id: EnvironmentId) {
  return id === "grassland" ? (stage: Parameters<typeof grassland>[0]) => grassland(stage, { blades: 30000 }) : ENVIRONMENTS[id];
}

export function powerScene(id: string): SceneDef {
  const spec: ShotSpec = SHOTS[id] ?? { env: "arcane", hero: ["queen", "w"], burst: () => [] };
  return {
    duration: 6,
    bloom: 0.42,
    dof: DOF,
    poster: spec.poster ?? 1.2,
    async setup(stage) {
      const env = buildEnvironment(spec.env)(stage);
      const [kind, color] = spec.hero as [PieceKind, Side];
      await stageHero(stage, { kind, color }, (spec.extras ?? []).map(([k, c, x, z]) => ({ kind: k, color: c, at: [x, z] })));
      const active: Effect[] = [];
      const lasting: Effect[] = [];
      let fired = -1;
      let last = 0;
      const add = (list: Effect[], e: Effect, at: [number, number] = [0, 0]) => {
        e.object.position.set(at[0], 0, at[1]);
        stage.scene.add(e.object);
        list.push(e);
      };
      return {
        update(t) {
          const dt = Math.min(0.05, Math.max(0, t - last));
          last = t;
          env.update(t, dt);
          shootCamera(stage, t, spec.shot);
          // The burst replays every six seconds; lasting looks appear once and stay.
          const loop = Math.floor((t - 0.3) / 6);
          if (t >= 0.3 && loop !== fired) {
            fired = loop;
            spec.burst().forEach((e) => add(active, e, spec.burstAt));
            if (lasting.length === 0 && spec.lasting) spec.lasting().forEach(([e, at]) => add(lasting, e, at));
          }
          const ctx = fxContext(stage);
          for (let i = active.length - 1; i >= 0; i--) {
            if (!active[i].update(dt, ctx)) { stage.scene.remove(active[i].object); active[i].dispose(); active.splice(i, 1); }
          }
          lasting.forEach((e) => e.update(dt, ctx));
        },
        dispose: () => env.dispose(),
      };
    },
  };
}

export const POWER_SCENE_IDS = ALL_POWERS.map((p) => p.id);
