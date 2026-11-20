"use client";

import { useEffect, useState } from "react";
import { deleteCustomMap, loadCustomMaps, mapProblem, saveCustomMap, type ChessMap } from "@/features/maps";
import { MiniBoard } from "@/components/board/MiniBoard";
import { Button } from "@/components/ui/Button";
import { Segmented, Toggle } from "@/components/ui/Controls";
import { Icon } from "@/components/ui/icons";
import { TopBar } from "@/components/ui/TopBar";
import { EditorBoard } from "./EditorBoard";
import { Palette } from "./Palette";
import { useEditor } from "./useEditor";
import styles from "./editor.module.css";

const SIZES = [6, 7, 8, 9, 10].map((n) => ({ label: String(n), value: n }));

export function MapEditor() {
  const ed = useEditor();
  const [saved, setSaved] = useState<ChessMap[]>([]);
  const [flash, setFlash] = useState<string | null>(null);
  const problem = mapProblem(ed.map);

  useEffect(() => {
    setSaved(loadCustomMaps());
  }, []);

  const save = () => {
    if (problem) return;
    saveCustomMap(ed.map);
    setSaved(loadCustomMaps());
    setFlash("Saved. Pick it under Custom Map in any lobby.");
    setTimeout(() => setFlash(null), 2500);
  };

  return (
    <div className={styles.screen}>
      <TopBar />
      <div className={styles.layout}>
        <aside className={styles.side}>
          <Palette tool={ed.tool} color={ed.color} onTool={ed.setTool} onColor={ed.setColor} />
          <label className={styles.option}>
            <span><Icon name="mirror" size={16} />Mirror sides</span>
            <Toggle label="Mirror sides" checked={ed.mirror} onChange={ed.setMirror} />
          </label>
          <div className={styles.sizes}>
            <span className={styles.caption}>Width</span>
            <Segmented options={SIZES} value={ed.map.width} onChange={(w) => ed.resize(w, ed.map.height)} />
            <span className={styles.caption}>Height</span>
            <Segmented options={SIZES} value={ed.map.height} onChange={(h) => ed.resize(ed.map.width, h)} />
          </div>
          <div className={styles.row}>
            <Button size="sm" icon="trash" onClick={ed.clear}>Clear</Button>
            <Button size="sm" icon="rematch" onClick={ed.reset}>Standard</Button>
          </div>
        </aside>

        <main className={styles.center}>
          <div className={styles.boardWrap} style={{ ["--ratio" as string]: ed.map.width / ed.map.height }}>
            <EditorBoard map={ed.map} onPaint={ed.paint} />
          </div>
        </main>

        <aside className={styles.side}>
          <input className={styles.nameInput} value={ed.map.name} maxLength={32} onChange={(e) => ed.setMap({ ...ed.map, name: e.target.value })} aria-label="Map name" />
          <Button variant="primary" icon="save" onClick={save} disabled={!!problem}>Save map</Button>
          {problem && <span className={styles.problem}>{problem}</span>}
          {flash && <span className={styles.flash}>{flash}</span>}
          <span className={styles.caption}>Your maps</span>
          <div className={`${styles.saved} scroll-thin`}>
            {saved.length === 0 && <span className={styles.empty}>Nothing saved yet</span>}
            {saved.map((m) => (
              <div key={m.id} className={styles.savedItem}>
                <button type="button" className={styles.savedLoad} onClick={() => ed.setMap(m)}>
                  <MiniBoard map={m} size={44} />
                  <span>{m.name}</span>
                </button>
                <Button size="sm" variant="ghost" icon="trash" aria-label="Delete" onClick={() => { deleteCustomMap(m.id); setSaved(loadCustomMaps()); }} />
              </div>
            ))}
          </div>
          <Button size="sm" variant="ghost" icon="plus" onClick={ed.fresh}>New map</Button>
        </aside>
      </div>
    </div>
  );
}
