"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { FileCheck, GraduationCap, ShieldCheck, TrendingUp } from "lucide-react"

/**
 * 통계 섹션 — 플랫폼 신뢰도를 숫자로 전달
 * 스크롤 시 카운트업 애니메이션으로 강조
 */

interface Stat {
  icon: React.ReactNode
  value: number
  suffix: string
  label: string
  gradient: string
}

const stats: Stat[] = [
  {
    icon: <FileCheck className="h-6 w-6" />,
    value: 2400,
    suffix: "+",
    label: "검증 완료 자료",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: <GraduationCap className="h-6 w-6" />,
    value: 850,
    suffix: "+",
    label: "활성 교사 회원",
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    icon: <ShieldCheck className="h-6 w-6" />,
    value: 99.7,
    suffix: "%",
    label: "안전 검증률",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    value: 15000,
    suffix: "+",
    label: "월간 다운로드",
    gradient: "from-amber-500 to-orange-500",
  },
]

/**
 * 숫자가 0에서 목표 값까지 증가하는 카운터 훅
 * IntersectionObserver로 뷰포트 진입 시 트리거
 */
function useCountUp(target: number, duration: number = 1500) {
  const [count, setCount] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true)
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [hasStarted])

  useEffect(() => {
    if (!hasStarted) return

    const startTime = performance.now()
    const isDecimal = target % 1 !== 0

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      /* easeOutCubic 커브로 자연스러운 감속 */
      const eased = 1 - Math.pow(1 - progress, 3)
      const currentValue = eased * target

      setCount(isDecimal ? parseFloat(currentValue.toFixed(1)) : Math.floor(currentValue))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [hasStarted, target, duration])

  return { count, ref }
}

export function StatsSection() {
  return (
    <section className="relative bg-[var(--color-bg-dark)] py-20 sm:py-24 overflow-hidden">
      {/* 배경 효과 */}
      <div className="absolute inset-0 bg-dot-pattern opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] bg-blue-500/10 rounded-full blur-[150px]" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* 섹션 타이틀 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl tracking-tight">
            숫자로 보는{" "}
            <span className="text-gradient">신뢰와 성장</span>
          </h2>
          <p className="mt-4 text-slate-400 max-w-xl mx-auto">
            교사들이 직접 만든 검증된 플랫폼, 그 가치를 확인하세요.
          </p>
        </motion.div>

        {/* 통계 카드 그리드 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatCard key={stat.label} stat={stat} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* 개별 통계 카드 컴포넌트 */
function StatCard({ stat, index }: { stat: Stat; index: number }) {
  const { count, ref } = useCountUp(stat.value)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 text-center hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300"
    >
      {/* 아이콘 */}
      <div
        className={`mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg`}
      >
        {stat.icon}
      </div>

      {/* 카운팅 숫자 */}
      <div className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums">
        {stat.value % 1 !== 0 ? count.toFixed(1) : count.toLocaleString()}
        <span className="text-gradient">{stat.suffix}</span>
      </div>

      {/* 라벨 */}
      <p className="mt-2 text-sm font-medium text-slate-400">
        {stat.label}
      </p>
    </motion.div>
  )
}
