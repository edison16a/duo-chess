import { RenderStudio } from "@/components/three/RenderStudio";

/** Internal page the media script screenshots. Not linked from the app. */
export default async function RenderPage({ searchParams }: { searchParams: Promise<{ scene?: string; capture?: string }> }) {
  const { scene = "showcase", capture } = await searchParams;
  return <RenderStudio scene={scene} capture={capture === "1"} />;
}
