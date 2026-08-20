import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FitLog | 음성 운동일지",
  description: "트레이너를 위한 음성 기반 운동 기록",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
