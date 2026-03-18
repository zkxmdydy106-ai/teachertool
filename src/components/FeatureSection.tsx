"use client"

import { motion } from "framer-motion"
import { ShieldCheck, Zap, Users } from "lucide-react"
import Image from "next/image"

/**
 * 핵심 기능 소개 섹션 — 3컬럼 카드 레이아웃
 * AI 검증, 빠른 검색, 교사 커뮤니티 3가지 핵심 가치를 전달
 */

interface Feature {
  icon: React.ReactNode
  title: string
  description: string
  imageSrc?: string
  imageAlt?: string
  gradient: string
}

const features: Feature[] = [
  {
    icon: <ShieldCheck className="h-6 w-6" />,
    title: "AI 기반 자동 검증",
    description:
      "업로드된 자료는 AI가 저작권, 개인정보, 악성코드를 자동 검사합니다. 위험 요소가 발견되면 즉시 격리되어 안전한 자료만 공유됩니다.",
    imageSrc: "/images/feature-ai-verify.png",
    imageAlt: "AI 보안 검증 시스템",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "초고속 하이브리드 검색",
    description:
      "키워드 검색과 의미 기반 검색을 결합하여 원하는 자료를 정확하게 찾아냅니다. 단원명, 교과, 주제별 필터로 탐색 시간을 80% 단축하세요.",
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "교사 전용 안심 커뮤니티",
    description:
      "인증된 현직 교사만 참여할 수 있는 폐쇄형 커뮤니티입니다. 실제 현장에서 검증된 자료와 노하우를 안심하고 나눌 수 있습니다.",
    imageSrc: "/images/feature-community.png",
    imageAlt: "교사 커뮤니티 협업",
    gradient: "from-violet-500 to-pink-500",
  },
]

/* framer-motion 컨테이너/아이템 변형 — 순차 등장 효과 */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
} as const

export function FeatureSection() {
  return (
    <section className="relative py-24 sm:py-32 bg-[var(--color-bg)]">
      {/* 섹션 타이틀 */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-600/10">
            핵심 기능
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
            왜 이 플랫폼이{" "}
            <span className="text-gradient">특별한가요?</span>
          </h2>
          <p className="mt-4 text-base text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed">
            교사의 일상 업무를 혁신하는 세 가지 핵심 시스템을 만나보세요.
          </p>
        </motion.div>
      </div>

      {/* 피처 카드 그리드 */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="mx-auto max-w-7xl px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        {features.map((feature) => (
          <motion.div
            key={feature.title}
            variants={itemVariants}
            className="card-hover-glow group relative flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 transition-all duration-300"
          >
            {/* 아이콘 원형 배경 */}
            <div
              className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg shadow-blue-500/10`}
            >
              {feature.icon}
            </div>

            <h3 className="text-lg font-bold text-[var(--color-text)] group-hover:text-blue-600 transition-colors">
              {feature.title}
            </h3>
            <p className="mt-3 text-sm text-[var(--color-text-secondary)] leading-relaxed flex-1">
              {feature.description}
            </p>

            {/* 피처 이미지 (있는 경우에만) */}
            {feature.imageSrc && (
              <div className="mt-6 overflow-hidden rounded-xl bg-slate-50">
                <Image
                  src={feature.imageSrc}
                  alt={feature.imageAlt || feature.title}
                  width={320}
                  height={200}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
