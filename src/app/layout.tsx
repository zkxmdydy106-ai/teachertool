import type { Metadata } from "next";
import { Inter, Noto_Sans_KR } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

/* ──────────────────────────────────────────────
   폰트 설정 — Vercel 스타일 Inter + 한글 Noto Sans KR
   next/font가 자동으로 최적화(self-host, preload)
   ────────────────────────────────────────────── */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-noto-kr",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "교사 툴 공유 플랫폼 | VibeT",
  description:
    "신뢰 가능한 교사 전용 교육 산출물 공유 및 AI 검증 마켓플레이스. 안전하고 검증된 양질의 교육 자료를 빠르게 검색·공유하세요.",
  keywords: ["교사", "교육자료", "산출물", "공유", "AI검증", "마켓플레이스"],
};

import { AuthProvider } from "@/lib/auth-context"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${inter.variable} ${notoSansKR.variable}`}>
      <body className="bg-[var(--color-bg)] text-[var(--color-text)] antialiased font-[var(--font-noto-kr),var(--font-inter),system-ui,sans-serif]">
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
