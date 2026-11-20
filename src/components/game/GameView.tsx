"use client";

import { opposite, type Color } from "@/engine";
import { fxLevel, ratingsShow } from "@/features/fx";
import { MODE_BY_ID } from "@/features/modes";
import type { RoomHandle } from "@/features/room/useRoom";
import dynamic from "next/dynamic";
import { Board, type BoardProps } from "@/components/board/Board";
import { DraftPanel } from "./DraftPanel";
import { EvalBar } from "./EvalBar";
import { GameControls } from "./GameControls";
import { MoveList } from "./MoveList";
import { PlayerStrip } from "./PlayerStrip";
import { PocketBar } from "./PocketBar";
import { PowerBar } from "./PowerBar";
import { ResultBanner } from "./ResultBanner";
import { checkSquaresOf, useGameView } from "./useGameView";

/** three.js only loads for people who switch to the 3D board. */
const Board3D = dynamic(() => import("@/components/board3d/Board3D"), { ssr: false });
import styles from "./game.module.css";

export function GameView({ handle }: { handle: RoomHandle }) {
  const v = useGameView(handle);
  const { room, game, pos, me } = v;
  const mode = MODE_BY_ID[room.config.mode];
  const mods = room.config.mods;
  // Rooms saved before the setting existed have no view, so they stay flat.
  const view = mods.view ?? "2d";
  const player = (c: Color) => room.players.find((p) => p.id === room.seats[c]);
  const players = { w: player("w"), b: player("b") };
  const bottom = v.orientation;
  const top = opposite(bottom);
  const lastEval = [...game.history].reverse().find((h) => h.evalCp !== undefined)?.evalCp ?? null;
  // Looking at an earlier position makes the board read only.
  const past = v.history.past;

  if (room.phase === "draft" && room.draft) {
    return (
      <div className={styles.draftScreen}>
        <DraftPanel draft={room.draft} me={me} players={players} onPick={(picks) => handle.send({ type: "draft", picks })} />
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
            <BoardView
              mode={view}
              pos={past ? past.pos : pos}
              orientation={v.orientation}
              viewer={me}
              theme={v.theme}
              legal={past ? [] : v.legal}
              onMove={v.onMove}
              lastMove={past ? past.lastMove : game.lastMove}
              checkSquares={past ? checkSquaresOf(past.pos) : v.checkSquares}
              events={game.events}
              eventSeq={game.eventSeq}
              fog={!!mode.fog && v.playing}
              blindfold={mods.blindfold && v.playing}
              targeting={past ? null : v.targeting}
              dropKind={past ? null : v.dropKind}
              rating={past ? null : v.rating}
              premove={past ? null : v.premove}
              fx={fxLevel(mods)}
            />
            {past && (
              <button type="button" className={`${styles.livePill} ${v.history.behind ? styles.liveBehind : ""}`} onClick={v.history.live} data-testid="back-to-live">
                Back to live
              </button>
            )}
            {game.result && !past && (
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
        <MoveList
          history={game.history}
          showRatings={ratingsShow(mods) !== "off"}
          hideFor={mode.fog && v.playing ? me : null}
          current={v.history.current}
          canOpen={v.history.canOpen}
          onOpen={v.history.open}
        />
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

function BoardView({ mode, ...props }: BoardProps & { mode: "2d" | "3d" }) {
  return mode === "3d" ? <Board3D {...props} /> : <Board {...props} />;
}
