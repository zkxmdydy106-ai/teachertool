"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { FileDropZone } from "@/components/FileDropZone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Logger } from "@/lib/utils/logger"
import { ArrowLeft, Send, Tag, BookOpen, GraduationCap, Info, Lock } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"

const logger = new Logger("Upload")

/* SQL 스키마의 school_level enum에 대응하는 선택지 */
const SCHOOL_LEVELS = [
  { value: "", label: "선택 안함" },
  { value: "preschool", label: "유치원" },
  { value: "elementary", label: "초등학교" },
  { value: "middle", label: "중학교" },
  { value: "high", label: "고등학교" },
  { value: "special", label: "특수학교" },
  { value: "other", label: "기타" },
] as const

/**
 * 업로드 페이지 — 교육 자료 업로드 폼
 * - 파일 드래그앤드롭 영역
 * - 제목, 설명, 학교급, 과목, 태그 입력
 * - 폼 검증 후 제출 (현재 Mock — Supabase 연결 시 실제 API 호출로 교체)
 */
export default function UploadPage() {
  /* 폼 상태 */
  const [resourceType, setResourceType] = useState<"file" | "link">("file")
  const [externalUrl, setExternalUrl] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [schoolLevel, setSchoolLevel] = useState("")
  const [subject, setSubject] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<"success" | "error" | null>(null)
  
  const { user, isLoading: authLoading, signInWithGoogle } = useAuth()

  /* 태그 추가 (Enter 또는 쉼표로 구분) */
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      const newTag = tagInput.trim().replace(/^#/, "")
      if (newTag && !tags.includes(newTag) && tags.length < 10) {
        setTags([...tags, newTag])
        setTagInput("")
      }
    }
  }

  /* 태그 삭제 */
  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index))
  }

  /* 폼 검증 */
  const isValidUrl = (urlString: string) => {
    if (!urlString.trim()) return false
    try {
      new URL(urlString.includes('://') ? urlString : `https://${urlString}`)
      return true
    } catch {
      return false
    }
  }

  const isFormValid =
    title.trim().length >= 2 &&
    description.trim().length >= 5 &&
    (resourceType === "file" ? files.length > 0 : isValidUrl(externalUrl))

  /* 폼 제출 (Supabase 연동) */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid || !supabase) return

    setIsSubmitting(true)
    logger.action("자료 업로드 시도 (Supabase)", {
      title,
      fileCount: files.length,
      tags,
      schoolLevel,
      subject,
    })

    try {
      // 1. Resources 테이블에 메타데이터 Insert
      const { data: resourceData, error: resourceError } = await supabase
        .from("resources")
        .insert({
          title,
          description,
          school_level: schoolLevel || null,
          subject: subject || null,
          status: "pending",
          author_id: user?.id, // 실제 로그인된 유저 ID
          resource_type: resourceType,
          external_url: resourceType === "link" ? externalUrl : null,
          video_url: videoUrl ? videoUrl : null,
        })
        .select()
        .single()

      if (resourceError) throw resourceError
      const resourceId = resourceData.id

      // 2. Tags 테이블 Upsert 및 매핑
      for (const t of tags) {
        // Tag가 이미 존재하는지 조회 후 없으면 Insert (Supabase JS upsert의 한계 보완)
        let tagId = null
        const { data: existingTag } = await supabase.from("tags").select("id").eq("name", t).single()
        
        if (existingTag) {
          tagId = existingTag.id
        } else {
          const { data: newTag, error: tagErr } = await supabase.from("tags").insert({ name: t }).select("id").single()
          if (!tagErr && newTag) tagId = newTag.id
        }

        if (tagId) {
          await supabase.from("resource_tags").insert({
            resource_id: resourceId,
            tag_id: tagId,
          })
        }
      }

      // 3. Storage에 파일 업로드 및 FileAssets 생성
      for (const file of files) {
        // 한글 파일명, 공백 등을 안전한 경로로 변경
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
        const filePath = `uploads/${resourceId}/${Date.now()}_${safeFileName}`

        const { error: uploadError } = await supabase.storage
          .from("quarantine_bucket")
          .upload(filePath, file, { cacheControl: "3600", upsert: false })

        if (uploadError) throw uploadError

        const { error: assetError } = await supabase.from("file_assets").insert({
          resource_id: resourceId,
          storage_path: filePath,
          bucket_name: "quarantine_bucket",
          file_type: file.type || "application/octet-stream",
          file_size: file.size,
          is_safe: false, // AI 검증 전
        })

        if (assetError) throw assetError
      }

      logger.info("자료 업로드 완료", { resourceId })
      setSubmitResult("success")
    } catch (err) {
      logger.error("업로드 실패", err)
      setSubmitResult("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  /* 제출 성공 화면 */
  if (submitResult === "success") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <Send className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-text)]">
            자료가 성공적으로 제출되었습니다!
          </h2>
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
            AI 검증 시스템이 자료를 검사 중입니다. 검증이 완료되면 알림을 보내드립니다.
            평균 검증 시간은 약 5분입니다.
          </p>
          <div className="mt-8 flex gap-3 justify-center">
            <Link href="/profile">
              <Button variant="outline">내 자료 확인하기</Button>
            </Link>
            <Button
              onClick={() => {
                setSubmitResult(null)
                setResourceType("file")
                setExternalUrl("")
                setVideoUrl("")
                setTitle("")
                setDescription("")
                setSchoolLevel("")
                setSubject("")
                setTags([])
                setFiles([])
              }}
            >
              다른 자료 올리기
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 lg:py-16">
      {/* 상단 뒤로가기 + 타이틀 */}
      <div className="mb-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          홈으로 돌아가기
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-text)]">
          교육 자료 업로드
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          업로드된 자료는 AI 검증 시스템이 자동으로 저작권, 개인정보, 악성코드를 검사합니다.
        </p>
      </div>

      {authLoading ? (
         <div className="py-12 flex justify-center">
           <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
         </div>
      ) : !user ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-text)] mb-2">로그인이 필요한 서비스입니다</h2>
          <p className="text-[var(--color-text-secondary)] mb-8 max-w-md mx-auto">
            신뢰할 수 있는 교사 생태계를 위해, 자료 업로드는 로그인한 사용자만 이용할 수 있습니다.
          </p>
          <Button onClick={signInWithGoogle} size="lg" className="rounded-xl px-8">
            Google 계정으로 로그인
          </Button>
        </div>
      ) : (
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {submitResult === "error" && (
          <div className="rounded-md bg-red-50 p-4 border border-red-200">
            <h3 className="text-sm font-medium text-red-800">업로드 중 오류가 발생했습니다.</h3>
            <p className="mt-1 text-sm text-red-700">서버 연결 상태나 입력값을 확인해주세요.</p>
          </div>
        )}
        
        {/* 타입 선택 탭 */}
        <section className="flex gap-4 border-b border-[var(--color-border)] pb-2 mb-8">
          <button
            type="button"
            onClick={() => setResourceType("file")}
            className={`pb-2 text-sm font-semibold transition-colors relative ${
              resourceType === "file"
                ? "text-blue-600"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            일반 파일 업로드
            {resourceType === "file" && (
              <motion.div layoutId="activeTab" className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setResourceType("link")}
            className={`pb-2 text-sm font-semibold transition-colors relative ${
              resourceType === "link"
                ? "text-blue-600"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            외부 앱/웹 링크 공유 (스크립트 등)
            {resourceType === "link" && (
              <motion.div layoutId="activeTab" className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        </section>

        {/* ① 컨텐츠 핵심 첨부/링크 영역 */}
        <section>
          {resourceType === "file" ? (
            <>
              <label className="block text-sm font-semibold text-[var(--color-text)] mb-3">
                파일 첨부 <span className="text-red-500">*</span>
              </label>
              <FileDropZone onFilesSelected={setFiles} />
            </>
          ) : (
            <>
              <label
                htmlFor="upload-external-url"
                className="block text-sm font-semibold text-[var(--color-text)] mb-2"
              >
                앱 구동 주소 (URL) <span className="text-red-500">*</span>
              </label>
              <Input
                id="upload-external-url"
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="예: https://script.google.com/macros/s/.../exec"
                required
              />
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                사용자가 앱을 실행할 수 있는 웹 페이지 주소를 입력해주세요.
              </p>
            </>
          )}
        </section>

        {/* 동영상 예시 추가 (선택) */}
        <section>
          <label
            htmlFor="upload-video-url"
            className="block text-sm font-semibold text-[var(--color-text)] mb-2"
          >
            사용 예시 동영상 링크 (선택사항)
          </label>
          <Input
            id="upload-video-url"
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="예: https://youtube.com/watch?v=..."
          />
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            YouTube, Vimeo 등의 링크를 입력하시면 상세 페이지에 플레이어가 노출됩니다. 직접 영상을 올리시려면 위 파일 첨부 영역을 이용해주세요 (mp4, webm만 가능).
          </p>
        </section>

        {/* ② 제목 */}
        <section>
          <label
            htmlFor="upload-title"
            className="block text-sm font-semibold text-[var(--color-text)] mb-2"
          >
            자료 제목 <span className="text-red-500">*</span>
          </label>
          <Input
            id="upload-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 초등 3학년 분수 도입 슬라이드 세트"
            maxLength={100}
          />
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">{title.length}/100</p>
        </section>

        {/* ③ 설명 */}
        <section>
          <label
            htmlFor="upload-description"
            className="block text-sm font-semibold text-[var(--color-text)] mb-2"
          >
            자료 설명 <span className="text-red-500">*</span>
          </label>
          <textarea
            id="upload-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="이 자료가 어떤 내용을 담고 있는지, 어떤 수업에서 활용할 수 있는지 설명해주세요. (최소 5자)"
            rows={4}
            maxLength={2000}
            className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          />
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">{description.length}/2000</p>
        </section>

        {/* ④ 학교급 & 과목 (2컬럼) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <section>
            <label
              htmlFor="upload-school-level"
              className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-text)] mb-2"
            >
              <GraduationCap className="h-4 w-4 text-[var(--color-text-muted)]" />
              학교급
            </label>
            <select
              id="upload-school-level"
              value={schoolLevel}
              onChange={(e) => setSchoolLevel(e.target.value)}
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              {SCHOOL_LEVELS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </section>

          <section>
            <label
              htmlFor="upload-subject"
              className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-text)] mb-2"
            >
              <BookOpen className="h-4 w-4 text-[var(--color-text-muted)]" />
              과목
            </label>
            <Input
              id="upload-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="예: 수학, 국어, 과학"
            />
          </section>
        </div>

        {/* ⑤ 태그 */}
        <section>
          <label
            htmlFor="upload-tags"
            className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-text)] mb-2"
          >
            <Tag className="h-4 w-4 text-[var(--color-text-muted)]" />
            태그 (최대 10개)
          </label>
          <Input
            id="upload-tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="태그를 입력 후 Enter (예: 분수, 3학년, 활동지)"
          />
          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((tag, index) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="ml-0.5 hover:text-red-500 transition-colors"
                    aria-label={`태그 "${tag}" 삭제`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* 안내 메시지 */}
        <div className="flex items-start gap-3 rounded-xl bg-blue-50 p-4 border border-blue-100">
          <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-800 leading-relaxed">
            <p className="font-semibold">AI 자동 검증 안내</p>
            <p className="mt-1">
              업로드된 파일은 AI가 저작권 침해, 개인정보 포함, 악성코드 여부를 자동 검사합니다.
              검증에 통과하면 &apos;안전 승인됨&apos; 상태로 전환되어 다른 교사들에게 공개됩니다.
            </p>
          </div>
        </div>

        {/* 제출 버튼 */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
          {!isFormValid && (
            <p className="text-xs font-medium text-red-500 mr-2 flex items-center gap-1">
              <span className="hidden sm:inline">필수 항목을 확인해주세요: </span>
              {title.trim().length < 2 && "제목(2자~)"}
              {title.trim().length < 2 && description.trim().length < 5 && ", "}
              {description.trim().length < 5 && "설명(5자~)"}
              {(title.trim().length < 2 || description.trim().length < 5) && (resourceType === "file" && files.length === 0 || resourceType === "link" && !isValidUrl(externalUrl)) && ", "}
              {resourceType === "file" && files.length === 0 && "파일 첨부"}
              {resourceType === "link" && !isValidUrl(externalUrl) && "유효한 앱/웹 링크"}
            </p>
          )}
          <Link href="/">
            <Button type="button" variant="outline">
              취소
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                제출 중...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Send className="h-4 w-4" />
                자료 제출하기
              </span>
            )}
          </Button>
        </div>
      </form>
      )}
    </div>
  )
}
