"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { standardLayout } from "@/engine";
import { PREMADE_MAPS, loadCustomMaps, type ChessMap } from "@/features/maps";
import { STANDARD_MAP } from "@/features/modes";
import { MiniBoard } from "@/components/board/MiniBoard";
import { Icon } from "@/components/ui/icons";
import styles from "./lobby.module.css";

interface Props {
  /** The map in play, or STANDARD_MAP for the mode's own board. */
  mapId: string;
  customMap: ChessMap | null;
  disabled: boolean;
  /** Offers the mode's own board first. Custom Map always needs a real map, so it leaves this off. */
  standard: boolean;
  onPick: (map: ChessMap | null) => void;
}

/** The plain 8x8 setup drawn as a map, for the Standard card's thumbnail. */
const STANDARD_BOARD: ChessMap = { id: STANDARD_MAP, name: "Standard", holes: [], ...standardLayout() };

export function MapPicker({ mapId, customMap, disabled, standard, onPick }: Props) {
  const [mine, setMine] = useState<ChessMap[]>([]);
  useEffect(() => {
    setMine(loadCustomMaps());
  }, []);
  // Guests do not have the host's maps locally, so show the shared copy.
  const extra = customMap && !mine.some((m) => m.id === customMap.id) ? [customMap] : [];
  const maps = [...(standard ? [STANDARD_BOARD] : []), ...mine, ...extra, ...PREMADE_MAPS];

  return (
    <div className={styles.maps}>
      {maps.map((m) => (
        <button
          key={m.id}
          type="button"
          className={`${styles.mapCard} ${m.id === mapId ? styles.mapActive : ""}`}
          onClick={() => onPick(m.id === STANDARD_MAP ? null : m)}
          disabled={disabled && m.id !== mapId}
        >
          <MiniBoard map={m} size={88} />
          <span className={styles.mapName}>{m.name}</span>
          {m.custom && <span className={styles.mapTag}>Yours</span>}
        </button>
      ))}
      {!disabled && (
        <Link href="/editor" className={`${styles.mapCard} ${styles.mapNew}`} target="_blank">
          <Icon name="plus" size={26} />
          <span className={styles.mapName}>New map</span>
        </Link>
      )}
    </div>
  );
}
