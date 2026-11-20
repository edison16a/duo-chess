"use client";

import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { FILES, type Color, type GameEvent, type Move, type PieceKind, type Position, type RatingId } from "@/engine";
import { Effects } from "./Effects";
import { cellOf, cellStyle, isLightSquare, squareAt } from "./layout";
import { FogLayer, HintLayer, UnderLayer } from "./Overlays";
import { PieceLayer } from "./PieceLayer";
import { PromotionPicker } from "./PromotionPicker";
import type { BoardTheme } from "./themes";
import { useInteraction, type Targeting } from "./useInteraction";
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
}

interface Drag {
  square: number;
  startX: number;
  startY: number;
  dx: number;
  dy: number;
  moved: boolean;
}

export function Board(props: BoardProps) {
  const { pos, orientation, viewer, theme, legal, onMove, targeting, dropKind } = props;
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [shaking, setShaking] = useState(false);
  const ui = useInteraction({ pos, legal, onMove, targeting, dropKind });

  const visible = useMemo(() => (props.fog && viewer ? fogVisible(pos, viewer) : null), [props.fog, viewer, pos]);
  const aimSquares = useMemo(() => {
    if (!targeting) return new Set<number>();
    return new Set(pos.board.map((_, s) => s).filter((s) => !pos.holes.includes(s) && targeting.valid(s)));
  }, [targeting, pos]);

  const squareFromPointer = (e: { clientX: number; clientY: number }): number | null => {
    const rect = ref.current!.getBoundingClientRect();
    const col = Math.floor(((e.clientX - rect.left) / rect.width) * pos.width);
    const row = Math.floor(((e.clientY - rect.top) / rect.height) * pos.height);
    return squareAt(pos, col, row, orientation);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const square = squareFromPointer(e);
    if (square === null) return;
    if (ui.pressSquare(square)) {
      ref.current?.setPointerCapture(e.pointerId);
      setDrag({ square, startX: e.clientX, startY: e.clientY, dx: 0, dy: 0, moved: false });
    }
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const dx = e.clientX - drag.startX, dy = e.clientY - drag.startY;
    setDrag({ ...drag, dx, dy, moved: drag.moved || Math.hypot(dx, dy) > 5 });
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    ui.releaseSquare(squareFromPointer(e), drag.moved);
    setDrag(null);
  };

  return (
    <div
      ref={ref}
      className={`${styles.board} ${shaking ? styles.shake : ""}`}
      style={{ aspectRatio: `${pos.width} / ${pos.height}`, ["--light" as string]: theme.light, ["--dark" as string]: theme.dark }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => setDrag(null)}
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
      <Effects pos={pos} orientation={orientation} events={props.events} seq={props.eventSeq} onShake={() => { setShaking(true); setTimeout(() => setShaking(false), 450); }} />
      {ui.promotion && <PromotionPicker moves={ui.promotion.moves} color={pos.turn} onPick={ui.choosePromotion} />}
    </div>
  );
}
