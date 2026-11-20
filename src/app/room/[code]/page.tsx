import { RoomScreen } from "@/components/room/RoomScreen";
import { normalizeCode } from "@/features/net/roomCode";

export default async function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <RoomScreen code={normalizeCode(code)} />;
}
