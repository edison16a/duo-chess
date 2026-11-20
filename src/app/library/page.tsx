import type { Metadata } from "next";
import { Library } from "@/components/library/Library";

export const metadata: Metadata = { title: "Library | Duo Chess" };

export default function LibraryPage() {
  return <Library />;
}
