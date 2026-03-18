"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { ResourceCard, type ResourceItem } from "@/components/ResourceCard"
import { Loader2, User as UserIcon, LayoutDashboard, Search, Upload, Bookmark } from "lucide-react"
import Link from "next/link"

type TabType = 'uploads' | 'bookmarks'

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth()
  const [resources, setResources] = useState<ResourceItem[]>([])
  const [bookmarkedResources, setBookmarkedResources] = useState<ResourceItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('uploads')

  useEffect(() => {
    if (!user) {
      if (!authLoading) setIsLoading(false)
      return
    }

    const fetchMyResources = async () => {
      try {
        // 내가 올린 자료 로드
        const { data: uploadData, error: uploadError } = await supabase
          .from("resources")
          .select(`
            id, title, description, status, risk_score, school_level, subject, resource_type, external_url, video_url,
            resource_tags(tags(name))
          `)
          .eq("author_id", user.id)
          .order("created_at", { ascending: false })

        if (uploadError) throw uploadError

        const formattedUploads = (uploadData || []).map((row: any) => ({
          id: row.id,
          title: row.title,
          description: row.description || "",
          status: row.status as ResourceItem["status"],
          riskScore: row.risk_score || 0,
          tags: row.resource_tags ? row.resource_tags.map((rt: any) => rt.tags?.name).filter(Boolean) : [],
          resourceType: row.resource_type || "file",
          externalUrl: row.external_url,
          videoUrl: row.video_url,
          downloads: 0, 
        }))

        setResources(formattedUploads)

        // 북마크(저장한 자료) 로드 — bookmarks 테이블이 아직 없을 수 있으므로 별도 try-catch
        try {
          const { data: bookmarkData, error: bookmarkError } = await supabase
            .from("bookmarks")
            .select(`
              resource_id,
              resources:resource_id (
                id, title, description, status, risk_score, school_level, subject, resource_type, external_url, video_url,
                resource_tags(tags(name))
              )
            `)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })

          if (!bookmarkError && bookmarkData) {
            const formattedBookmarks = bookmarkData
              .filter((b: any) => b.resources)
              .map((b: any) => {
                const res = Array.isArray(b.resources) ? b.resources[0] : b.resources
                return {
                  id: res.id,
                  title: res.title,
                  description: res.description || "",
                  status: res.status as ResourceItem["status"],
                  riskScore: res.risk_score || 0,
                  tags: res.resource_tags ? res.resource_tags.map((rt: any) => rt.tags?.name).filter(Boolean) : [],
                  resourceType: res.resource_type || "file",
                  externalUrl: res.external_url,
                  videoUrl: res.video_url,
                  downloads: 0,
                  isBookmarked: true,
                }
              })
            setBookmarkedResources(formattedBookmarks)
          }
        } catch {
          // bookmarks 테이블이 아직 생성되지 않았을 수 있음 → 무시하고 빈 배열 유지
          console.warn("[Profile] bookmarks 테이블 쿼리 실패 (테이블이 아직 없을 수 있음)")
        }
      } catch (err) {
        console.error("데이터 로드 실패:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMyResources()
  }, [user, authLoading])

  const handleBookmarkToggle = (resourceId: string, newState: boolean) => {
    if (!user) return

    if (!newState) {
      // 북마크가 해제되었으므로 '저장한 자료' 목록에서 즉시 제거
      setBookmarkedResources(prev => prev.filter(r => r.id !== resourceId))
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <UserIcon className="h-8 w-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">로그인이 필요합니다</h2>
        <p className="mt-2 text-slate-500 mb-6">프로필 및 내 자료 모아보기를 이용하려면 로그인해주세요.</p>
        <Link href="/" className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
          홈으로 돌아가기
        </Link>
      </div>
    )
  }

  // 통계 계산
  const approvedCount = resources.filter(r => r.status === "approved").length
  const pendingCount = resources.filter(r => r.status === "pending").length
  const rejectedCount = resources.filter(r => r.status === "rejected").length

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* 프로필 헤더 */}
        <div className="rounded-2xl bg-white p-6 md:p-8 shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row gap-8 items-center md:items-start">
          <div className="flex-shrink-0">
            {user.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="Profile" className="h-24 w-24 rounded-full border-4 border-white shadow-md object-cover" />
            ) : (
              <div className="h-24 w-24 rounded-full bg-slate-100 border-4 border-white shadow-md flex items-center justify-center">
                <UserIcon className="h-10 w-10 text-slate-400" />
              </div>
            )}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-slate-900">
              {user.user_metadata?.name || user.email?.split("@")[0] || "선생님"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">{user.email}</p>
            
            <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-4">
              <div className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-100 flex-1 min-w-[120px] max-w-[200px]">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">총 업로드</p>
                <p className="text-2xl font-bold text-slate-900">{resources.length}</p>
              </div>
              <div className="bg-blue-50 rounded-lg px-4 py-3 border border-blue-100 flex-1 min-w-[120px] max-w-[200px]">
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">승인 완료</p>
                <p className="text-2xl font-bold text-blue-700">{approvedCount}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg px-4 py-3 border border-yellow-100 flex-1 min-w-[120px] max-w-[200px]">
                <p className="text-xs font-medium text-yellow-600 uppercase tracking-wider mb-1">심사 대기</p>
                <p className="text-2xl font-bold text-yellow-700">{pendingCount}</p>
              </div>
              {rejectedCount > 0 && (
                <div className="bg-red-50 rounded-lg px-4 py-3 border border-red-100 flex-1 min-w-[120px] max-w-[200px]">
                  <p className="text-xs font-medium text-red-600 uppercase tracking-wider mb-1">반려/보류</p>
                  <p className="text-2xl font-bold text-red-700">{rejectedCount}</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 mt-4 md:mt-0 flex flex-col gap-3">
            <Link 
              href="/upload"
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-all"
            >
              <Upload className="h-4 w-4" />
              새 자료 올리기
            </Link>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex gap-6 border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab('uploads')}
            className={`flex items-center gap-2 pb-3 px-1 border-b-2 text-sm font-semibold transition-colors ${
              activeTab === 'uploads' 
                ? "border-blue-600 text-blue-600" 
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            내가 올린 자료 ({resources.length})
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`flex items-center gap-2 pb-3 px-1 border-b-2 text-sm font-semibold transition-colors ${
              activeTab === 'bookmarks' 
                ? "border-blue-600 text-blue-600" 
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Bookmark className="h-4 w-4" />
            저장한 자료 ({bookmarkedResources.length})
          </button>
        </div>

        {/* 내역 목록 */}
        <div>
          {activeTab === 'uploads' ? (
            resources.length === 0 ? (
              <div className="col-span-full py-24 text-center bg-white rounded-2xl border border-slate-200">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 mb-4">
                  <Search className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">업로드한 자료가 없습니다</h3>
                <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto mb-6">
                  선생님만의 유용한 자료를 첫 번째로 공유해 보세요. 다른 선생님들에게 큰 도움이 됩니다.
                </p>
                <Link href="/upload" className="inline-flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all">
                  <Upload className="h-4 w-4" />
                  자료 올리기
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.map((item) => (
                  <ResourceCard key={item.id} item={item} />
                ))}
              </div>
            )
          ) : (
            bookmarkedResources.length === 0 ? (
              <div className="col-span-full py-24 text-center bg-white rounded-2xl border border-slate-200">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 mb-4">
                  <Bookmark className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">저장한 자료가 없습니다</h3>
                <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto mb-6">
                  홈페이지에서 유용한 자료에 북마크를 눌러 나만의 보관함을 채워보세요.
                </p>
                <Link href="/" className="inline-flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all">
                  <Search className="h-4 w-4" />
                  자료 탐색하기
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookmarkedResources.map((item) => (
                  <ResourceCard 
                    key={item.id} 
                    item={item} 
                    onBookmarkToggle={handleBookmarkToggle}
                  />
                ))}
              </div>
            )
          )}
        </div>

      </div>
    </div>
  )
}
