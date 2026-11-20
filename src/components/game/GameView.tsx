"use client";

import { opposite, type Color } from "@/engine";
import { MODE_BY_ID } from "@/features/modes";
import type { RoomHandle } from "@/features/room/useRoom";
import { Board } from "@/components/board/Board";
import { DraftPanel } from "./DraftPanel";
import { EvalBar } from "./EvalBar";
import { GameControls } from "./GameControls";
import { MoveList } from "./MoveList";
import { PlayerStrip } from "./PlayerStrip";
import { PocketBar } from "./PocketBar";
import { PowerBar } from "./PowerBar";
import { ResultBanner } from "./ResultBanner";
import { useGameView } from "./useGameView";
import styles from "./game.module.css";

export function GameView({ handle }: { handle: RoomHandle }) {
  const v = useGameView(handle);
  const { room, game, pos, me } = v;
  const mode = MODE_BY_ID[room.config.mode];
  const mods = room.config.mods;
  const player = (c: Color) => room.players.find((p) => p.id === room.seats[c]);
  const players = { w: player("w"), b: player("b") };
  const bottom = v.orientation;
  const top = opposite(bottom);
  const lastEval = [...game.history].reverse().find((h) => h.evalCp !== undefined)?.evalCp ?? null;

  if (room.phase === "draft" && room.draft) {
    return (
      <div className={styles.draftScreen}>
        <DraftPanel draft={room.draft} me={me} players={players} onPick={(keep, give) => handle.send({ type: "draft", keep, give })} />
      </div>
    );
  }

  const strip = (c: Color) => (
    <PlayerStrip
      player={players[c]}
      color={c}
      turn={pos.turn}
      playing={v.playing}
      clock={room.clock}
      hostOffset={handle.hostOffset}
      taken={game.lost[opposite(c)]}
      materialEdge={v.material(c) - v.material(opposite(c))}
      isMe={me === c}
      extra={pos.movesLeft > 1 && pos.turn === c && v.playing ? <span className={styles.movesLeft}>{pos.movesLeft} moves left</span> : null}
    />
  );

  return (
    <div className={styles.layout} style={{ ["--ratio" as string]: `${pos.width / pos.height}` }}>
      <section className={styles.boardArea}>
        {strip(top)}
        <div className={styles.boardRow}>
          {mods.evalBar && <EvalBar evalCp={lastEval} orientation={v.orientation} />}
          <div className={styles.boardWrap}>
            <Board
              pos={pos}
              orientation={v.orientation}
              viewer={me}
              theme={v.theme}
              legal={v.legal}
              onMove={v.onMove}
              lastMove={game.lastMove}
              checkSquares={v.checkSquares}
              events={game.events}
              eventSeq={game.eventSeq}
              fog={!!mode.fog && v.playing}
              blindfold={mods.blindfold && v.playing}
              targeting={v.targeting}
              dropKind={v.dropKind}
              rating={v.rating}
            />
            {game.result && (
              <ResultBanner
                result={game.result}
                me={me}
                players={players}
                rematchVotes={room.rematch}
                myId={handle.myId}
                onRematch={() => handle.send({ type: "rematch" })}
              />
            )}
          </div>
        </div>
        {strip(bottom)}
        {v.notice && <div key={v.notice.at} className={styles.toast}>{v.notice.text}</div>}
      </section>

      <aside className={styles.panel}>
        <div className={styles.panelHead}>
          <span className={styles.modeName}>{mode.name}</span>
          <span className={styles.code}>{room.code}</span>
        </div>
        {game.powers && (
          <PowerBar
            me={me}
            mine={me ? game.powers.inventory[me] : game.powers.inventory.w}
            theirs={me ? game.powers.inventory[opposite(me)] : game.powers.inventory.b}
            canUse={v.canUsePower}
            aiming={v.aiming}
            onPick={v.pickPower}
            onCancel={v.cancelAim}
          />
        )}
        {pos.rules.drops && me && (
          <PocketBar pocket={pos.pockets[me]} color={me} selected={v.dropKind} enabled={v.myTurn} onSelect={v.setDropKind} />
        )}
        <MoveList history={game.history} showRatings={mods.ratings} hideFor={mode.fog && v.playing ? me : null} />
        <GameControls
          playing={v.playing}
          seated={me !== null}
          drawOffered={room.drawOffer ? (room.drawOffer === me ? "mine" : me ? "theirs" : null) : null}
          theme={v.theme}
          onTheme={v.setTheme}
          onFlip={v.flip}
          onResign={() => handle.send({ type: "resign" })}
          onDraw={() => handle.send({ type: "draw-offer" })}
          onDrawAnswer={(accept) => handle.send({ type: "draw-answer", accept })}
        />
      </aside>
    </div>
  );
}
