"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Loader2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Trash2,
  Pencil,
  ExternalLink,
  Clock,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"

/* ─── 타입 ─── */
interface AdminResource {
  id: string
  title: string
  description: string | null
  status: string
  school_level: string | null
  subject: string | null
  resource_type: string | null
  external_url: string | null
  created_at: string
  author_email?: string
  author_name?: string
}

/* ─── 상태별 탭 정의 ─── */
type TabKey = "pending" | "approved" | "rejected" | "all"
const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "pending", label: "심사 대기", icon: <Clock className="h-4 w-4" /> },
  { key: "approved", label: "승인 완료", icon: <CheckCircle2 className="h-4 w-4" /> },
  { key: "rejected", label: "반려/보류", icon: <XCircle className="h-4 w-4" /> },
  { key: "all", label: "전체", icon: <ShieldCheck className="h-4 w-4" /> },
]

/* ─── 상태 뱃지 색상 ─── */
const STATUS_STYLE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  revision_requested: "bg-orange-100 text-orange-800 border-orange-200",
  quarantined: "bg-gray-100 text-gray-800 border-gray-200",
}

const STATUS_LABEL: Record<string, string> = {
  pending: "심사 대기",
  approved: "승인 완료",
  rejected: "반려",
  revision_requested: "수정 요청",
  quarantined: "격리됨",
}

export default function AdminPage() {
  const { user, isLoading: authLoading, isAdmin } = useAuth()
  const router = useRouter()

  const [resources, setResources] = useState<AdminResource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>("pending")
  const [actionLoading, setActionLoading] = useState<string | null>(null) // 작업 중인 리소스 ID

  /* ─── 데이터 불러오기 ─── */
  const fetchResources = useCallback(async () => {
    setIsLoading(true)
    try {
      // 모든 자료를 최신순으로 가져오기 (author 정보 포함)
      const { data, error } = await supabase
        .from("resources")
        .select(`
          id, title, description, status, school_level, subject,
          resource_type, external_url, created_at,
          profiles:author_id ( display_name )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formatted = (data || []).map((r: any) => ({
        ...r,
        author_name: r.profiles?.display_name || "알 수 없음",
      }))

      setResources(formatted)
    } catch (err) {
      console.error("관리자 자료 불러오기 실패:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return

    if (!user || !isAdmin) {
      router.replace("/")
      return
    }

    fetchResources()
  }, [user, isAdmin, authLoading, router, fetchResources])

  /* ─── 승인 / 반려 처리 ─── */
  const handleStatusChange = async (resourceId: string, newStatus: "approved" | "rejected") => {
    setActionLoading(resourceId)
    try {
      const { error } = await supabase
        .from("resources")
        .update({ status: newStatus })
        .eq("id", resourceId)

      if (error) throw error

      // 목록에서 즉각 반영
      setResources((prev) =>
        prev.map((r) => (r.id === resourceId ? { ...r, status: newStatus } : r))
      )
    } catch (err) {
      console.error("상태 변경 실패:", err)
      alert("상태 변경에 실패했습니다. 다시 시도해주세요.")
    } finally {
      setActionLoading(null)
    }
  }

  /* ─── 자료 삭제 처리 ─── */
  const handleDelete = async (resourceId: string) => {
    if (!confirm("정말로 이 자료를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."))
      return

    setActionLoading(resourceId)
    try {
      // 1. 연결된 파일 에셋 조회 및 Storage에서 삭제
      const { data: assets } = await supabase
        .from("file_assets")
        .select("storage_path, bucket_name")
        .eq("resource_id", resourceId)

      if (assets && assets.length > 0) {
        for (const asset of assets) {
          await supabase.storage.from(asset.bucket_name).remove([asset.storage_path])
        }
      }

      // 2. DB 레코드 삭제 (CASCADE로 file_assets, resource_tags 등 자동 삭제)
      const { error } = await supabase
        .from("resources")
        .delete()
        .eq("id", resourceId)

      if (error) throw error

      // 목록에서 즉각 제거
      setResources((prev) => prev.filter((r) => r.id !== resourceId))
    } catch (err) {
      console.error("삭제 실패:", err)
      alert("삭제에 실패했습니다. 다시 시도해주세요.")
    } finally {
      setActionLoading(null)
    }
  }

  /* ─── 탭 필터 ─── */
  const filteredResources =
    activeTab === "all"
      ? resources
      : resources.filter((r) => r.status === activeTab)

  /* ─── 비인가 사용자 또는 로딩 ─── */
  if (authLoading || isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!user || !isAdmin) return null // 리다이렉트 처리 중

  /* ─── 메인 렌더 ─── */
  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">관리자 대시보드</h1>
            <p className="text-sm text-slate-500">
              총 {resources.length}개 자료 · 심사 대기{" "}
              <span className="font-semibold text-yellow-600">
                {resources.filter((r) => r.status === "pending").length}
              </span>
              개
            </p>
          </div>
        </div>

        {/* 상태 탭 */}
        <div className="mb-6 flex gap-2 border-b border-slate-200 pb-1">
          {TABS.map((tab) => {
            const count =
              tab.key === "all"
                ? resources.length
                : resources.filter((r) => r.status === tab.key).length
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-white border border-b-0 border-slate-200 text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                }`}
              >
                {tab.icon}
                {tab.label}
                <span
                  className={`ml-1 rounded-full px-1.5 py-0.5 text-xs ${
                    activeTab === tab.key ? "bg-slate-200" : "bg-slate-100"
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* 자료 목록 */}
        {filteredResources.length === 0 ? (
          <div className="py-24 text-center bg-white rounded-2xl border border-slate-200">
            <CheckCircle2 className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-sm font-semibold text-slate-700">
              {activeTab === "pending"
                ? "심사 대기 중인 자료가 없습니다 🎉"
                : "해당 상태의 자료가 없습니다"}
            </h3>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredResources.map((resource) => (
              <div
                key={resource.id}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* 자료 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
                        STATUS_STYLE[resource.status] || STATUS_STYLE.pending
                      }`}
                    >
                      {STATUS_LABEL[resource.status] || resource.status}
                    </span>
                    {resource.resource_type === "link" && (
                      <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                        <ExternalLink className="h-3 w-3" />
                        외부 링크
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/resource/${resource.id}`}
                    className="text-base font-semibold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1"
                  >
                    {resource.title}
                  </Link>
                  <p className="text-sm text-slate-500 line-clamp-1 mt-0.5">
                    {resource.description || "설명 없음"}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                    <span>작성자: {resource.author_name}</span>
                    <span>·</span>
                    <span>{new Date(resource.created_at).toLocaleDateString("ko-KR")}</span>
                    {resource.school_level && (
                      <>
                        <span>·</span>
                        <span>{resource.school_level}</span>
                      </>
                    )}
                    {resource.subject && (
                      <>
                        <span>·</span>
                        <span>{resource.subject}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {resource.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(resource.id, "approved")}
                        disabled={actionLoading === resource.id}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                      >
                        {actionLoading === resource.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                        )}
                        승인
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(resource.id, "rejected")}
                        disabled={actionLoading === resource.id}
                        className="text-red-600 border-red-200 hover:bg-red-50 rounded-lg"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        반려
                      </Button>
                    </>
                  )}

                  {resource.status === "rejected" && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(resource.id, "approved")}
                      disabled={actionLoading === resource.id}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      승인으로 전환
                    </Button>
                  )}

                  {resource.status === "approved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(resource.id, "rejected")}
                      disabled={actionLoading === resource.id}
                      className="text-orange-600 border-orange-200 hover:bg-orange-50 rounded-lg"
                    >
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      승인 취소
                    </Button>
                  )}

                  <Link href={`/resource/${resource.id}?edit=true`}>
                    <Button size="sm" variant="outline" className="rounded-lg">
                      <Pencil className="h-4 w-4 mr-1" />
                      수정
                    </Button>
                  </Link>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(resource.id)}
                    disabled={actionLoading === resource.id}
                    className="text-red-600 border-red-200 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
