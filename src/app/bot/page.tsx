import type { Metadata } from "next";
import { BotScreen } from "@/components/bot/BotScreen";

export const metadata: Metadata = { title: "Play vs bot | Duo Chess" };

export default function BotPage() {
  return <BotScreen />;
}
