import { PIECES, STANDARD_PIECES, CUSTOM_PIECE_DEFS, type Color } from "@/engine";
import { PieceImage } from "@/components/board/PieceImage";
import { Segmented } from "@/components/ui/Controls";
import { Icon } from "@/components/ui/icons";
import type { Tool } from "./useEditor";
import styles from "./editor.module.css";

interface Props {
  tool: Tool;
  color: Color;
  onTool: (tool: Tool) => void;
  onColor: (color: Color) => void;
}

const KINDS = [...STANDARD_PIECES, ...CUSTOM_PIECE_DEFS, PIECES.duck];

export function Palette({ tool, color, onTool, onColor }: Props) {
  return (
    <div className={styles.palette}>
      <Segmented options={[{ label: "White", value: "w" as Color }, { label: "Black", value: "b" as Color }]} value={color} onChange={onColor} />
      <div className={styles.pieces}>
        {KINDS.map((def) => (
          <button
            key={def.kind}
            type="button"
            title={def.name}
            className={tool.type === "piece" && tool.kind === def.kind ? styles.toolActive : ""}
            onClick={() => onTool({ type: "piece", kind: def.kind })}
          >
            <PieceImage kind={def.kind} color={def.kind === "duck" ? "n" : color} />
          </button>
        ))}
      </div>
      <div className={styles.tools}>
        <button type="button" className={tool.type === "erase" ? styles.toolActive : ""} onClick={() => onTool({ type: "erase" })}>
          <Icon name="eraser" />Erase
        </button>
        <button type="button" className={tool.type === "hole" ? styles.toolActive : ""} onClick={() => onTool({ type: "hole" })}>
          <Icon name="hole" />Hole
        </button>
      </div>
    </div>
  );
}
