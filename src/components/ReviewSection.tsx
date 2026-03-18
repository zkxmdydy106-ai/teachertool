"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Star, MessageSquare, Loader2, Send } from "lucide-react"

interface Review {
  id: string
  user_id: string
  rating: number
  content: string
  created_at: string
  profiles?: any
}

interface ReviewSectionProps {
  resourceId: string
  resourceAuthorId: string
}

export function ReviewSection({ resourceId, resourceAuthorId }: ReviewSectionProps) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [myReview, setMyReview] = useState<Review | null>(null)
  
  // 폼 상태
  const [rating, setRating] = useState(5)
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const isAuthor = user?.id === resourceAuthorId

  const fetchReviews = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          user_id,
          rating,
          content,
          created_at,
          profiles ( display_name )
        `)
        .eq('resource_id', resourceId)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        setReviews(data as any[])
        if (user) {
          const mine = data.find(r => r.user_id === user.id)
          setMyReview(mine || null)
        }
      }
    } catch (err) {
      // Supabase 테이블이 아직 없거나 다른 권한/네트워크 에러 발생 시 부드럽게 무시
      console.warn("리뷰 데이터를 불러올 수 없습니다 (테이블 미생성 가능성).")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [resourceId, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!content.trim()) {
      setErrorMsg("리뷰 내용을 입력해주세요.")
      return
    }

    setIsSubmitting(true)
    setErrorMsg("")

    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          resource_id: resourceId,
          user_id: user.id,
          rating,
          content: content.trim()
        })
        .select(`
          id, user_id, rating, content, created_at,
          profiles ( display_name )
        `)
        .single()

      if (error) {
        if (error.code === '23505') { // UNIQUE constraint violation
          setErrorMsg("이미 이 자료에 리뷰를 작성하셨습니다.")
        } else {
          throw error
        }
      } else if (data) {
        setMyReview(data as any)
        setReviews([data as any, ...reviews])
        setContent("")
        setRating(5)
      }
    } catch (err: any) {
      console.error("리뷰 등록 실패:", err)
      setErrorMsg("리뷰를 등록하는 중 문제가 발생했습니다. (테이블 미충족 가능성)")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!myReview || !user) return
    if (!confirm("정말 리뷰를 삭제하시겠습니까?")) return

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', myReview.id)
        .eq('user_id', user.id)

      if (error) throw error

      setMyReview(null)
      setReviews(reviews.filter(r => r.id !== myReview.id))
    } catch (err) {
      console.error("리뷰 삭제 실패:", err)
      alert("리뷰 삭제에 실패했습니다.")
    }
  }

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "0"

  return (
    <div className="mt-12 w-full max-w-4xl max-w-7xl mx-auto px-6 lg:px-8 bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border)] p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-8">
        <MessageSquare className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-[var(--color-text)]">선생님들의 리뷰</h2>
        {reviews.length > 0 && (
          <div className="ml-4 flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            <span className="font-bold text-amber-700">{avgRating}</span>
            <span className="text-sm text-amber-600/70">({reviews.length}개)</span>
          </div>
        )}
      </div>

      {/* 작성 폼 영역 */}
      {!isLoading && user && !myReview && !isAuthor && (
        <form onSubmit={handleSubmit} className="mb-10 bg-slate-50 rounded-xl p-5 border border-slate-200">
          <h3 className="font-semibold text-slate-700 mb-3 block">이 자료, 어떠셨나요?</h3>
          <div className="flex gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="focus:outline-none hover:scale-110 transition-transform"
              >
                <Star
                  className={`h-7 w-7 ${
                    star <= rating ? "text-amber-500 fill-amber-500" : "text-slate-300"
                  }`}
                />
              </button>
            ))}
          </div>
          
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="자료 사용 후기, 꿀팁, 아쉬운 점 등을 동료 선생님들과 공유해주세요!"
              className="w-full min-h-[100px] rounded-lg border border-slate-300 p-4 pr-14 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none text-slate-700"
              maxLength={500}
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="absolute right-3 bottom-3 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
          {errorMsg && <p className="text-red-500 text-sm mt-2">{errorMsg}</p>}
        </form>
      )}

      {/* 상태 메시지들 */}
      {!isLoading && !user && (
        <div className="mb-10 p-4 border border-blue-100 bg-blue-50 rounded-xl text-center">
          <p className="text-blue-800 text-sm">리뷰를 남기시려면 먼저 <button onClick={() => alert("상단의 구글 로그인 버튼을 이용해주세요.")} className="font-semibold underline underline-offset-2">로그인</button>해주세요.</p>
        </div>
      )}

      {!isLoading && isAuthor && (
        <div className="mb-10 p-4 border border-slate-200 bg-slate-50 rounded-xl text-center text-slate-500 text-sm">
          자신이 올린 자료에는 리뷰를 남길 수 없습니다.
        </div>
      )}

      {/* 내가 작성한 리뷰 (수정 폼 없이 그냥 보여주고 삭제만 지원하는 단순 버전) */}
      {!isLoading && myReview && (
        <div className="mb-10 bg-blue-50/50 rounded-xl p-5 border border-blue-100 relative">
          <div className="absolute top-4 right-4">
            <button 
              onClick={handleDelete}
              className="text-xs text-red-500 hover:text-red-700 hover:underline px-2 py-1"
            >
              삭제
            </button>
          </div>
          <p className="text-xs font-semibold text-blue-600 mb-2">내 리뷰</p>
          <div className="flex gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= myReview.rating ? "text-amber-500 fill-amber-500" : "text-slate-300"
                }`}
              />
            ))}
          </div>
          <p className="text-slate-700 whitespace-pre-wrap">{myReview.content}</p>
        </div>
      )}

      {/* 전체 리뷰 리스트 */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-12 text-center text-[var(--color-text-muted)] border-2 border-dashed border-slate-200 justify-center flex flex-col items-center rounded-xl">
            <MessageSquare className="h-8 w-8 mb-3 opacity-30" />
            아직 작성된 리뷰가 없습니다. 첫 리뷰를 남겨보세요!
          </div>
        ) : (
          reviews.map((r) => {
            // 내 리뷰는 이미 위에 보여줬으면 리스트에서는 생략하거나 다르게 표기
            if (myReview && r.id === myReview.id) return null;
            
            return (
              <div key={r.id} className="p-5 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-xs">
                      {r.profiles?.display_name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 text-sm">{r.profiles?.display_name || "사용자"}</span>
                      <span className="text-xs text-slate-400 ml-2">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3 w-3 ${
                          star <= r.rating ? "text-amber-500 fill-amber-500" : "text-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-slate-600 pl-10 text-sm leading-relaxed whitespace-pre-wrap">{r.content}</p>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
