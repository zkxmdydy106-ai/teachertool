"use client"

import { motion } from "framer-motion"
import { Search } from "lucide-react"
import Image from "next/image"

interface HeroProps {
  searchQuery: string
  onSearchChange: (val: string) => void
  onSearchSubmit: () => void
}

/**
 * 히어로 섹션 — Linear/Stripe 스타일 다크 배경 + 일러스트
 * - 왼쪽: 헤드라인, 서브 카피, 검색바
 * - 오른쪽: AI 생성 일러스트레이션
 * - 배경: 도트 그리드 패턴 + 블루 글로우
 */
export function HeroSection({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
}: HeroProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onSearchSubmit()
  }

  return (
    <section className="relative w-full overflow-hidden bg-[var(--color-bg-dark)] py-20 sm:py-28">
      {/* 배경: 도트 그리드 패턴 (Vercel 스타일) */}
      <div className="absolute inset-0 bg-dot-pattern opacity-40" />

      {/* 배경: 블루 글로우 효과 */}
      <div className="absolute top-[-20%] left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-blue-500/20 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[10%] h-[400px] w-[400px] rounded-full bg-indigo-500/15 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* 왼쪽: 텍스트 + 검색 */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex-1 text-center lg:text-left"
          >
            {/* 뱃지 */}
            <div className="mb-6 flex justify-center lg:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3.5 py-1.5 text-sm font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                </span>
                Antigravity v1.0 — AI 검증 시스템 가동 중
              </span>
            </div>

            {/* 메인 헤드라인 */}
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.1]">
              신뢰할 수 있는
              <br />
              교사 전용{" "}
              <span className="text-gradient">산출물 마켓플레이스</span>
            </h1>

            {/* 서브 카피 */}
            <p className="mt-6 text-base sm:text-lg leading-relaxed text-slate-400 max-w-xl mx-auto lg:mx-0">
              복잡한 저작권 검토와 개인정보 위험은 시스템에 맡기세요.
              <br className="hidden sm:block" />
              검증된 양질의 교육 자료만 빠르고 안전하게 검색하고 공유할 수 있습니다.
            </p>

            {/* 검색바 */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="mt-8 max-w-xl mx-auto lg:mx-0"
            >
              <div className="group relative flex items-center">
                <Search className="absolute left-4 h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="text"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-4 pl-12 pr-32 text-white backdrop-blur-md placeholder:text-slate-500 focus:bg-white/[0.08] focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none sm:text-base transition-all duration-300"
                  placeholder="단원명, 지문, 양식 이름으로 검색..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button
                  onClick={onSearchSubmit}
                  className="btn-glow absolute right-2 top-2 bottom-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all active:scale-[0.97]"
                >
                  검색하기
                </button>
              </div>

              {/* 인기 검색어 */}
              <div className="mt-3 flex flex-wrap gap-2 justify-center lg:justify-start">
                <span className="text-xs text-slate-500">인기:</span>
                {["수학 활동지", "가정통신문", "수능 분석", "AI 수업"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      onSearchChange(tag)
                      onSearchSubmit()
                    }}
                    className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* 오른쪽: 일러스트레이션 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
            className="flex-1 flex justify-center lg:justify-end"
          >
            <div className="relative w-full max-w-md lg:max-w-lg">
              {/* 글로우 배경 효과 */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 blur-2xl" />
              <Image
                src="/images/hero-illustration.png"
                alt="교사들이 디지털 자료를 공유하는 모습"
                width={520}
                height={520}
                className="relative z-10 drop-shadow-2xl rounded-2xl"
                priority
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
