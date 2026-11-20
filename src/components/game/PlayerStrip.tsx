import { PIECES, type Color, type PieceKind } from "@/engine";
import { PieceImage } from "@/components/board/PieceImage";
import type { ClockState, Player } from "@/features/room/types";
import { Clock } from "./Clock";
import { MoveTimer } from "./MoveTimer";
import styles from "./game.module.css";

interface Props {
  player: Player | undefined;
  color: Color;
  turn: Color;
  playing: boolean;
  clock: ClockState | null;
  hostOffset: number;
  /** Pieces this player has taken from the opponent. */
  taken: PieceKind[];
  materialEdge: number;
  isMe: boolean;
  extra?: React.ReactNode;
  /** Host time when the per move timer plays a move for whoever is to move. */
  moveDeadline?: number | null;
}

export function PlayerStrip({ player, color, turn, playing, clock, hostOffset, taken, materialEdge, isMe, extra, moveDeadline }: Props) {
  const opponent = color === "w" ? "b" : "w";
  const sorted = [...taken].sort((a, b) => PIECES[b].value - PIECES[a].value);
  return (
    <div className={`${styles.strip} ${playing && turn === color ? styles.stripTurn : ""}`}>
      <div className={styles.who}>
        <span className={`${styles.dot} ${color === "w" ? styles.dotWhite : styles.dotBlack}`} />
        <span className={styles.name}>{player?.name ?? "Waiting"}</span>
        {isMe && <span className={styles.you}>You</span>}
        {player && !player.online && <span className={styles.away}>away</span>}
        <span className={styles.taken}>
          {sorted.slice(0, 15).map((k, i) => <PieceImage key={i} kind={k} color={opponent} />)}
          {materialEdge > 0 && <span className={styles.edge}>+{Math.round(materialEdge / 100)}</span>}
        </span>
      </div>
      {extra}
      {playing && turn === color && moveDeadline ? <MoveTimer deadline={moveDeadline} hostOffset={hostOffset} /> : null}
      {clock && <Clock clock={clock} color={color} turn={turn} running={playing} hostOffset={hostOffset} mine={isMe} />}
    </div>
  );
}
