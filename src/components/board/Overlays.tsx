/** Static layers under and over the pieces: highlights, walls, mines, portals, move hints and fog. */

import type { Color, Position } from "@/engine";
import { cellStyle } from "./layout";
import styles from "./board.module.css";

interface Props {
  pos: Position;
  orientation: Color;
  viewer: Color | null;
  lastMove: { from: number; to: number } | null;
  selected: number | null;
  checkSquares: number[];
  targets: Set<number>;
  duckSquares: Set<number>;
  aimSquares: Set<number>;
  aimColor: string | null;
}

export function UnderLayer({ pos, orientation, viewer, lastMove, selected, checkSquares }: Props) {
  const at = (s: number) => cellStyle(pos, s, orientation);
  return (
    <>
      {lastMove && lastMove.from >= 0 && <div className={`${styles.cell} ${styles.last}`} style={at(lastMove.from)} />}
      {lastMove && lastMove.to >= 0 && <div className={`${styles.cell} ${styles.last}`} style={at(lastMove.to)} />}
      {selected !== null && <div className={`${styles.cell} ${styles.selected}`} style={at(selected)} />}
      {checkSquares.map((s) => <div key={`c${s}`} className={`${styles.cell} ${styles.check}`} style={at(s)} />)}
      {pos.holes.map((s) => <div key={`h${s}`} className={`${styles.cell} ${styles.hole}`} style={at(s)} />)}
      {pos.effects.map((e) => {
        if (e.kind === "mine" && viewer !== e.owner) return null;
        return <div key={`e${e.id}`} className={`${styles.cell} ${styles[e.kind]}`} style={at(e.square)} title={e.kind} />;
      })}
    </>
  );
}

export function HintLayer({ pos, orientation, targets, duckSquares, aimSquares, aimColor }: Props) {
  const at = (s: number) => cellStyle(pos, s, orientation);
  return (
    <>
      {[...targets].map((s) => (
        <div key={`t${s}`} className={`${styles.cell} ${pos.board[s] ? styles.captureHint : styles.moveHint}`} style={at(s)} />
      ))}
      {[...duckSquares].map((s) => <div key={`d${s}`} className={`${styles.cell} ${styles.duckHint}`} style={at(s)} />)}
      {[...aimSquares].map((s) => (
        <div key={`a${s}`} className={`${styles.cell} ${styles.aimHint}`} style={{ ...at(s), ["--aim" as string]: aimColor ?? "var(--accent)" }} />
      ))}
    </>
  );
}

export function FogLayer({ pos, orientation, visible }: { pos: Position; orientation: Color; visible: Set<number> | null }) {
  if (!visible) return null;
  return (
    <>
      {pos.board.map((_, s) => (visible.has(s) ? null : <div key={`f${s}`} className={`${styles.cell} ${styles.fog}`} style={cellStyle(pos, s, orientation)} />))}
    </>
  );
}
