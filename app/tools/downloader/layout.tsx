import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Video Downloader — Nexium",
  robots: { index: false, follow: false },
};

export default function DownloaderToolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
