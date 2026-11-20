"use client";

import { useMemo, useRef, useState } from "react";
import { FILES, positionKey, type Color, type GameEvent, type Move, type PieceKind, type Position, type RatingId } from "@/engine";
import { ArrowLayer, MarkLayer, PremoveLayer } from "./Annotations";
import type { FxLevel } from "@/features/fx";
import { Effects } from "./Effects";
import { FlashLayer } from "./FlashLayer";
import { FxCanvas } from "./FxCanvas";
import { cellOf, cellStyle, isLightSquare } from "./layout";
import { FogLayer, HintLayer, UnderLayer } from "./Overlays";
import { PieceLayer } from "./PieceLayer";
import { PromotionPicker } from "./PromotionPicker";
import type { BoardTheme } from "./themes";
import { useAnnotations } from "./useAnnotations";
import { useBoardPointer } from "./useBoardPointer";
import { useInteraction, type Targeting } from "./useInteraction";
import type { PremoveControl } from "./usePremove";
import { fogVisible } from "./visibility";
import styles from "./board.module.css";

export interface BoardProps {
  pos: Position;
  orientation: Color;
  /** The player looking at the board, null for spectators. */
  viewer: Color | null;
  theme: BoardTheme;
  legal: Move[];
  onMove: (move: Move) => void;
  lastMove: { from: number; to: number } | null;
  checkSquares: number[];
  events: GameEvent[];
  eventSeq: number;
  fog: boolean;
  blindfold: boolean;
  targeting: (Targeting & { color: string }) | null;
  dropKind: PieceKind | null;
  rating: { square: number; id: RatingId; key: string } | null;
  /** Set while you may queue a premove (your opponent is to move). */
  premove?: PremoveControl | null;
  /** Low swaps the 3D effects for square flashes and drops the shake. */
  fx?: FxLevel;
  /** True when the latest events ended the game, so they play bigger. */
  finale?: boolean;
}

const noShake = () => {};

export function Board(props: BoardProps) {
  const { pos, orientation, viewer, theme, legal, onMove, targeting, dropKind } = props;
  const ref = useRef<HTMLDivElement>(null);
  const [shaking, setShaking] = useState(false);
  const lite = props.fx === "low";
  // Premoves reuse the normal click and drag flow, fed with premove targets.
  const premove = props.premove && !targeting && !dropKind ? props.premove : null;
  const ui = useInteraction({
    pos,
    legal: premove ? premove.moves : legal,
    onMove: premove ? premove.onQueue : onMove,
    targeting,
    dropKind,
    autoQueen: !!premove,
  });
  const notes = useAnnotations(positionKey(pos));
  const pointer = useBoardPointer({ ref, pos, orientation, ui, notes, premove });
  const drag = pointer.drag;

  const visible = useMemo(() => (props.fog && viewer ? fogVisible(pos, viewer) : null), [props.fog, viewer, pos]);
  const aimSquares = useMemo(() => {
    if (!targeting) return new Set<number>();
    return new Set(pos.board.map((_, s) => s).filter((s) => !pos.holes.includes(s) && targeting.valid(s)));
  }, [targeting, pos]);

  return (
    <div className={styles.outer}>
    <div
      ref={ref}
      className={`${styles.board} ${shaking ? styles.shake : ""}`}
      style={{ aspectRatio: `${pos.width} / ${pos.height}`, ["--light" as string]: theme.light, ["--dark" as string]: theme.dark }}
      onPointerDown={pointer.onPointerDown}
      onPointerMove={pointer.onPointerMove}
      onPointerUp={pointer.onPointerUp}
      onPointerCancel={pointer.onPointerCancel}
      onContextMenu={(e) => e.preventDefault()}
      data-testid="board"
    >
      {pos.board.map((_, s) => {
        const { col, row } = cellOf(pos, s, orientation);
        const light = isLightSquare(pos, s);
        return (
          <div key={s} className={`${styles.cell} ${light ? styles.light : styles.dark}`} style={cellStyle(pos, s, orientation)} data-square={s}>
            {col === 0 && <span className={styles.rank}>{orientation === "w" ? pos.height - row : row + 1}</span>}
            {row === pos.height - 1 && <span className={styles.file}>{FILES[orientation === "w" ? col : pos.width - 1 - col]}</span>}
          </div>
        );
      })}
      <UnderLayer {...props} selected={ui.selected} targets={new Set()} duckSquares={new Set()} aimSquares={new Set()} aimColor={null} />
      <PremoveLayer pos={pos} orientation={orientation} move={premove?.queued ?? null} />
      <MarkLayer pos={pos} orientation={orientation} marks={notes.marks} />
      <PieceLayer
        pos={pos}
        orientation={orientation}
        viewer={viewer}
        visible={visible}
        blindfold={props.blindfold}
        drag={drag?.moved ? drag : null}
        rating={props.rating}
      />
      <HintLayer {...props} selected={ui.selected} targets={new Set(ui.targets.keys())} duckSquares={ui.duckSquares} aimSquares={aimSquares} aimColor={targeting?.color ?? null} />
      <FogLayer pos={pos} orientation={orientation} visible={visible} />
      <ArrowLayer pos={pos} orientation={orientation} arrows={notes.arrows} drawing={notes.drawing} />
      {lite && <FlashLayer pos={pos} orientation={orientation} events={props.events} seq={props.eventSeq} />}
      <Effects events={props.events} seq={props.eventSeq} onShake={lite ? noShake : () => { setShaking(true); setTimeout(() => setShaking(false), 450); }} />
      {ui.promotion && <PromotionPicker moves={ui.promotion.moves} color={pos.turn} onPick={ui.choosePromotion} />}
    </div>
    {!lite && <FxCanvas pos={pos} orientation={orientation} viewer={viewer} events={props.events} seq={props.eventSeq} rating={props.rating} finale={props.finale} />}
    </div>
  );
}
