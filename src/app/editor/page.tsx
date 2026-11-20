import type { Metadata } from "next";
import { MapEditor } from "@/components/editor/MapEditor";

export const metadata: Metadata = { title: "Map editor | Duo Chess" };

export default function EditorPage() {
  return <MapEditor />;
}
