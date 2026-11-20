import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Duo Chess",
  description: "Two player online chess with wild modes, superpowers and live move ratings.",
};

export const viewport: Viewport = {
  themeColor: "#0f1012",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
