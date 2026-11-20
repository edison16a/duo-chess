"use client";

/**
 * React host for FxOverlay. three.js is imported lazily so the 2D board
 * renders instantly and the effects layer joins a moment later.
 */

import type { RatingMark } from "@/features/fx";
import { useEffect, useRef } from "react";
import type { Color, GameEvent, Position, RatingId } from "@/engine";
import type { FxOverlay } from "@/three/overlay/FxOverlay";
import styles from "./board.module.css";

interface Props {
  pos: Position;
  orientation: Color;
  viewer: Color | null;
  events: GameEvent[];
  seq: number;
  rating: RatingMark | null;
  /** These events ended the game. */
  finale?: boolean;
}

export function FxCanvas({ pos, orientation, viewer, events, seq, rating, finale = false }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const overlay = useRef<FxOverlay | null>(null);
  const seen = useRef(seq);
  const rated = useRef(rating?.key ?? "");
  const latest = useRef({ pos, orientation, viewer });
  latest.current = { pos, orientation, viewer };

  useEffect(() => {
    let alive = true;
    let observer: ResizeObserver | null = null;
    import("@/three/overlay/FxOverlay").then(({ FxOverlay }) => {
      if (!alive || !canvas.current) return;
      const fx = new FxOverlay(canvas.current);
      overlay.current = fx;
      const fit = () => fx.layout(latest.current.pos.width, latest.current.pos.height, latest.current.orientation);
      fit();
      observer = new ResizeObserver(fit);
      observer.observe(canvas.current);
      fx.sync(latest.current.pos, latest.current.viewer);
    });
    return () => {
      alive = false;
      observer?.disconnect();
      overlay.current?.dispose();
      overlay.current = null;
    };
  }, []);

  useEffect(() => {
    overlay.current?.layout(pos.width, pos.height, orientation);
    overlay.current?.sync(pos, viewer);
  }, [pos, orientation, viewer]);

  useEffect(() => {
    if (seq === seen.current) return;
    seen.current = seq;
    overlay.current?.playEvents(events, finale);
  }, [seq, events]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!rating || rating.key === rated.current) return;
    rated.current = rating.key;
    if (rating.quiet) return;
    overlay.current?.playRating(rating.id, rating.square);
  }, [rating]);

  // Canvases do not stretch between left and right, so size them explicitly.
  const style = {
    left: `${-100 / pos.width}%`,
    top: `${-100 / pos.height}%`,
    width: `${100 + 200 / pos.width}%`,
    height: `${100 + 200 / pos.height}%`,
  };
  return <canvas ref={canvas} className={styles.fxCanvas} style={style} aria-hidden />;
}
