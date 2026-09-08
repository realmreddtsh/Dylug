import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import GuildRail from "@/components/GuildRail";
import AppFrame from "@/components/AppFrame";

export const metadata: Metadata = {
  title: {
    default: "Dylug — Your place to talk",
    template: "%s · Dylug",
  },
  description: "A realtime community chat app with servers, channels, friends, and direct messages.",
  applicationName: "Dylug",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
  themeColor: "#1e1f22",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex h-[100dvh] overflow-hidden bg-disc-chat text-disc-text">
        <AppFrame rail={<GuildRail />}>{children}</AppFrame>
      </body>
    </html>
  );
}
