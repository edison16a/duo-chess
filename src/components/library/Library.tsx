"use client";

import { useState } from "react";
import { CUSTOM_PIECE_DEFS, PIECES, STANDARD_PIECES } from "@/engine";
import { MODES } from "@/features/modes";
import { ALL_POWERS, RARITIES, RARITY_LABEL, type Rarity } from "@/features/powers";
import { PowerCard } from "@/components/game/PowerCard";
import { MODE_ICONS } from "@/components/lobby/modeIcons";
import { Segmented } from "@/components/ui/Controls";
import { GlyphIcon } from "@/components/ui/icons";
import { TopBar } from "@/components/ui/TopBar";
import { PieceCard } from "./PieceCard";
import styles from "./library.module.css";

type Tab = "modes" | "pieces" | "powers";

export function Library() {
  const [tab, setTab] = useState<Tab>("modes");
  const [rarity, setRarity] = useState<Rarity | "all">("all");
  const powers = ALL_POWERS.filter((p) => rarity === "all" || p.rarity === rarity);

  return (
    <div className={styles.screen}>
      <TopBar />
      <div className={styles.body}>
        <div className={styles.tabs}>
          <Segmented
            options={[{ label: "Modes", value: "modes" as Tab }, { label: "Pieces", value: "pieces" as Tab }, { label: `Powers (${ALL_POWERS.length})`, value: "powers" as Tab }]}
            value={tab}
            onChange={setTab}
          />
        </div>

        {tab === "modes" && (
          <div className={styles.grid}>
            {MODES.map((m) => (
              <article key={m.id} className={styles.modeCard}>
                <span className={styles.modeIcon}><GlyphIcon size={24}>{MODE_ICONS[m.id]}</GlyphIcon></span>
                <h3>{m.name}</h3>
                {m.howTo.map((line) => <p key={line}>{line}</p>)}
              </article>
            ))}
          </div>
        )}

        {tab === "pieces" && (
          <div className={styles.grid}>
            {[...STANDARD_PIECES, ...CUSTOM_PIECE_DEFS, PIECES.duck].map((def) => <PieceCard key={def.kind} def={def} />)}
          </div>
        )}

        {tab === "powers" && (
          <>
            <div className={styles.filter}>
              <Segmented
                options={[{ label: "All", value: "all" as const }, ...RARITIES.map((r) => ({ label: RARITY_LABEL[r], value: r }))]}
                value={rarity}
                onChange={setRarity}
              />
            </div>
            <div className={styles.powerGrid}>
              {powers.map((p) => <PowerCard key={p.id} id={p.id} size="lg" />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
