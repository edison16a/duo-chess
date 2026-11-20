import type { ChessMap } from "@/features/maps";
import { pieceSrc } from "./PieceImage";
import styles from "./mini.module.css";

/** Static thumbnail of a map, used by the map picker, the editor list and the library. */
export function MiniBoard({ map, size = 120 }: { map: Pick<ChessMap, "width" | "height" | "pieces" | "holes">; size?: number }) {
  const cell = 100 / map.width;
  const rowH = 100 / map.height;
  const holes = new Set(map.holes ?? []);
  return (
    <div className={styles.mini} style={{ width: size, aspectRatio: `${map.width} / ${map.height}` }}>
      {Array.from({ length: map.width * map.height }, (_, s) => {
        const x = s % map.width, y = Math.floor(s / map.width);
        const light = (x + y) % 2 === 1;
        return (
          <span
            key={s}
            className={holes.has(s) ? styles.hole : light ? styles.light : styles.dark}
            style={{ left: `${x * cell}%`, top: `${(map.height - 1 - y) * rowH}%`, width: `${cell}%`, height: `${rowH}%` }}
          />
        );
      })}
      {map.pieces.map((p) => {
        const x = p.square % map.width, y = Math.floor(p.square / map.width);
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={p.square} src={pieceSrc(p.kind, p.color)} alt="" style={{ left: `${x * cell}%`, top: `${(map.height - 1 - y) * rowH}%`, width: `${cell}%`, height: `${rowH}%` }} />
        );
      })}
    </div>
  );
}
