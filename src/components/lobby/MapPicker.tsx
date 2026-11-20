"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PREMADE_MAPS, loadCustomMaps, type ChessMap } from "@/features/maps";
import { MiniBoard } from "@/components/board/MiniBoard";
import { Icon } from "@/components/ui/icons";
import styles from "./lobby.module.css";

interface Props {
  mapId: string;
  customMap: ChessMap | null;
  disabled: boolean;
  onPick: (map: ChessMap) => void;
}

export function MapPicker({ mapId, customMap, disabled, onPick }: Props) {
  const [mine, setMine] = useState<ChessMap[]>([]);
  useEffect(() => {
    setMine(loadCustomMaps());
  }, []);
  // Guests do not have the host's maps locally, so show the shared copy.
  const extra = customMap && !mine.some((m) => m.id === customMap.id) ? [customMap] : [];
  const maps = [...mine, ...extra, ...PREMADE_MAPS];

  return (
    <div className={styles.maps}>
      {maps.map((m) => (
        <button
          key={m.id}
          type="button"
          className={`${styles.mapCard} ${m.id === mapId ? styles.mapActive : ""}`}
          onClick={() => onPick(m)}
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
