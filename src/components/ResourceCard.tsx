import { Badge } from "@/components/ui/badge"
import { ShieldCheck, Clock, FileWarning, Download, ArrowUpRight, Link as LinkIcon, FileCheck, PlayCircle, Star } from "lucide-react"
import { BookmarkButton } from "@/components/BookmarkButton"
import Link from "next/link"

export type ResourceStatus = "pending" | "approved" | "rejected" | "revision_requested" | "quarantined"

export interface ResourceItem {
  id: string
  title: string
  description: string
  status: ResourceStatus
  riskScore: number
  tags: string[]
  author?: string
  downloads?: number
  resourceType?: "file" | "link"
  externalUrl?: string | null
  videoUrl?: string | null
  isBookmarked?: boolean
  rating?: number
  reviewCount?: number
}

interface ResourceCardProps {
  item: ResourceItem
  onBookmarkToggle?: (id: string, newState: boolean) => void
}

/**
 * 리소스 카드 — 글라스모피즘 + 호버 글로우 효과
 * Linear/Stripe 디자인 킷에서 영감받은 깔끔한 카드 UI
 */
export function ResourceCard({ item, onBookmarkToggle }: ResourceCardProps) {
  const isApproved = item.status === "approved"
  const isPending = item.status === "pending"
  const isLink = item.resourceType === "link"
  const hasVideo = !!item.videoUrl

  return (
    <div className="card-hover-glow group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 shadow-[var(--shadow-sm)] transition-all duration-300 hover:shadow-[var(--shadow-lg)] hover:-translate-y-1">
      <div className="flex flex-col gap-4">
        {/* 상단: 상태 배지 + 위험도 + 타입 배지 + 북마크 */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap gap-2 min-h-[28px]">
            {isLink ? (
              <Badge variant="outline" className="gap-1 shadow-sm border-purple-200 text-purple-700 bg-purple-50">
                <LinkIcon className="h-3 w-3" />
                웹 앱/링크
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 shadow-sm border-blue-200 text-blue-700 bg-blue-50">
                <FileCheck className="h-3 w-3" />
                일반 자료
              </Badge>
            )}

            {hasVideo && (
              <Badge variant="outline" className="gap-1 shadow-sm border-rose-200 text-rose-700 bg-rose-50">
                <PlayCircle className="h-3 w-3" />
                영상 시연
              </Badge>
            )}

            {isApproved ? (
              <Badge variant="success" className="gap-1 shadow-sm">
                <ShieldCheck className="h-3 w-3" />
                안전 승인됨
              </Badge>
            ) : isPending ? (
              <Badge variant="warning" className="gap-1 shadow-sm">
                <Clock className="h-3 w-3" />
                AI 심사 대기중
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1 shadow-sm">
                <FileWarning className="h-3 w-3" />
                위험 의심
              </Badge>
            )}
            
            {item.riskScore > 0 && item.riskScore < 5 && (
              <Badge variant="outline" className="text-[var(--color-text-muted)]">
                위험도: {item.riskScore}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 relative z-20">
            {/* 평점 및 리뷰 수 */}
            {item.reviewCount !== undefined && item.reviewCount > 0 && (
              <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                <Star className="h-3 w-3 fill-amber-500" />
                {item.rating?.toFixed(1)} <span className="text-amber-600/70 font-normal">({item.reviewCount})</span>
              </span>
            )}

            {/* 다운로드 수 (있는 경우) */}
            {item.downloads !== undefined && (
              <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                <Download className="h-3 w-3" />
                {item.downloads?.toLocaleString()}
              </span>
            )}
            {/* 북마크 버튼 - 클릭 이벤트 버블링 방지는 BookmarkButton 내부에서 수행됨 */}
            <BookmarkButton 
              resourceId={item.id} 
              initialBookmarked={item.isBookmarked} 
              className="h-8 w-8 !p-0"
              onToggleComplete={(newState) => onBookmarkToggle?.(item.id, newState)}
            />
          </div>
        </div>

        {/* 제목 & 설명 */}
        <div>
          <h3 className="text-lg font-bold leading-snug text-[var(--color-text)] line-clamp-2 group-hover:text-blue-600 transition-colors pr-1">
            <Link href={`/resource/${item.id}`} className="flex items-start gap-1">
              <span className="absolute inset-0 z-0" />
              {item.title}
              <ArrowUpRight className="h-4 w-4 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 relative z-10" />
            </Link>
          </h3>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)] line-clamp-3 leading-relaxed relative z-10">
            {item.description}
          </p>
        </div>
      </div>

      {/* 하단: 태그 */}
      <div className="mt-6 flex flex-wrap gap-1.5 pt-4 border-t border-[var(--color-border)] relative z-10">
        {item.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-[var(--color-text-secondary)] ring-1 ring-inset ring-slate-200/80 hover:bg-blue-50 hover:text-blue-700 hover:ring-blue-200/80 transition-colors cursor-pointer"
          >
            #{tag}
          </span>
        ))}
      </div>
    </div>
  )
}
