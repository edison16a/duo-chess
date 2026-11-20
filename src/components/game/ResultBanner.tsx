import type { Color, GameResult } from "@/engine";
import type { Player } from "@/features/room/types";
import { Button } from "@/components/ui/Button";
import styles from "./game.module.css";

const REASONS: Record<GameResult["reason"], string> = {
  checkmate: "by checkmate",
  stalemate: "by stalemate",
  resign: "by resignation",
  timeout: "on time",
  "king-captured": "by capturing the king",
  "king-exploded": "by blowing up the king",
  hill: "by taking the hill",
  "three-check": "by three checks",
  repetition: "by repetition",
  "fifty-move": "by the fifty move rule",
  insufficient: "by insufficient material",
  agreement: "by agreement",
  annihilation: "by wiping out every piece",
  giveaway: "by losing everything",
  abandoned: "because the opponent left",
};

interface Props {
  result: GameResult;
  me: Color | null;
  players: Record<Color, Player | undefined>;
  rematchVotes: string[];
  myId: string;
  onRematch: () => void;
}

export function ResultBanner({ result, me, players, rematchVotes, myId, onRematch }: Props) {
  const title = result.winner === null ? "Draw" : me ? (result.winner === me ? "You win" : "You lose") : `${players[result.winner]?.name ?? "Winner"} wins`;
  const voted = rematchVotes.includes(myId);
  const waitingOn = rematchVotes.length === 1 && !voted;
  return (
    <div className={styles.result} data-testid="result">
      <div className={styles.resultCard}>
        <h2>{title}</h2>
        <p>{result.winner === null ? REASONS[result.reason].replace("by ", "By ") : REASONS[result.reason]}</p>
        {me && (
          <Button variant="primary" icon="rematch" onClick={onRematch} disabled={voted}>
            {voted ? "Waiting for opponent" : waitingOn ? "Accept rematch" : "Rematch"}
          </Button>
        )}
      </div>
    </div>
  );
}
