"use client"

import { useState, useEffect } from "react"
import { Bookmark } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"

interface BookmarkButtonProps {
  resourceId: string
  initialBookmarked?: boolean
  className?: string
  showText?: boolean
  onToggleComplete?: (newState: boolean) => void
}

/**
 * 북마크(저장) 토글 버튼
 * - 로그인하지 않은 유저에게는 아무것도 렌더링하지 않음 (불필요한 쿼리 방지)
 * - bookmarks 테이블이 아직 없어도 에러 없이 동작하도록 try-catch 처리
 */
export function BookmarkButton({ resourceId, initialBookmarked = false, className = "", showText = false, onToggleComplete }: BookmarkButtonProps) {
  const { user } = useAuth()
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked)
  const [isLoading, setIsLoading] = useState(false)

  // 로그인한 유저만 초기 북마크 상태를 체크
  useEffect(() => {
    if (!user) return

    const checkBookmarkStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('bookmarks')
          .select('id')
          .eq('user_id', user.id)
          .eq('resource_id', resourceId)
          .single()
        
        if (!error && data) {
          setIsBookmarked(true)
        }
      } catch {
        // bookmarks 테이블이 없거나 네트워크 에러 → 무시 (북마크 기능 비활성 상태)
      }
    }

    checkBookmarkStatus()
  }, [user, resourceId])

  // 로그인하지 않은 유저에게는 버튼을 표시하지 않음
  if (!user) return null

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsLoading(true)
    try {
      if (isBookmarked) {
        // 북마크 취소
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('resource_id', resourceId)

        if (!error) {
          setIsBookmarked(false)
          onToggleComplete?.(false)
        }
      } else {
        // 북마크 추가
        const { error } = await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            resource_id: resourceId
          })

        if (!error) {
          setIsBookmarked(true)
          onToggleComplete?.(true)
        }
      }
    } catch (err) {
      console.error("북마크 토글 실패:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={toggleBookmark}
      disabled={isLoading}
      className={`flex items-center justify-center gap-2 rounded-xl transition-all font-semibold active:scale-95 disabled:opacity-50 ${
        isBookmarked 
          ? "bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100" 
          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
      } ${className}`}
      aria-label={isBookmarked ? "저장됨 (취소하기)" : "저장하기"}
    >
      <Bookmark className={showText ? "h-5 w-5" : "h-4 w-4"} fill={isBookmarked ? "currentColor" : "none"} />
      {showText && <span>{isBookmarked ? "저장됨" : "저장하기"}</span>}
    </button>
  )
}
