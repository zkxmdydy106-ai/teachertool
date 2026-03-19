import { supabase } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, Clock, FileWarning, ExternalLink, Download, FileCheck, Link as LinkIcon, AlertTriangle } from "lucide-react"
import { BookmarkButton } from "@/components/BookmarkButton"
import { ReviewSection } from "@/components/ReviewSection"

async function getResource(id: string) {
  // Fetch main resource data
  const { data: resource, error: resourceError } = await supabase
    .from("resources")
    .select(`
      *,
      profiles(display_name, role),
      resource_tags(tags(name))
    `)
    .eq("id", id)
    .single()

  if (resourceError || !resource) {
    return null
  }

  // If it's a file, fetch its file_asset to get the storage path
  let fileAsset = null
  if (resource.resource_type === "file") {
    const { data: fileData } = await supabase
      .from("file_assets")
      .select("*")
      .eq("resource_id", id)
      .single()
    
    fileAsset = fileData
  }

  return { resource, fileAsset }
}

function getYouTubeEmbedUrl(url: string) {
  if (!url) return null
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`
  }
  return null
}

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getResource(id)

  if (!data) {
    notFound()
  }

  const { resource, fileAsset } = data

  const isApproved = resource.status === "approved"
  const isPending = resource.status === "pending"
  const isLink = resource.resource_type === "link"
  
  const tagNames = resource.resource_tags
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? resource.resource_tags.map((rt: any) => rt.tags?.name).filter(Boolean)
    : []

  const youtubeEmbedUrl = getYouTubeEmbedUrl(resource.video_url || "")

  // Download URL (create temporary signed URL instead of public URL)
  let downloadUrl = null
  if (fileAsset && fileAsset.storage_path) {
    // 1시간(3600초) 유효한 다운로드 링크 생성
    const { data: urlData, error: urlError } = await supabase.storage
      .from(fileAsset.bucket_name || "quarantine_bucket")
      .createSignedUrl(fileAsset.storage_path, 3600, { download: true })
      
    if (!urlError && urlData) {
      downloadUrl = urlData.signedUrl
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-12 px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        
        {/* Header Section */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {isLink ? (
              <Badge variant="outline" className="gap-1 border-purple-200 text-purple-700 bg-purple-50">
                <LinkIcon className="h-4 w-4" />
                웹 앱/시트 링크 (외부)
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 border-blue-200 text-blue-700 bg-blue-50">
                <FileCheck className="h-4 w-4" />
                파일 다운로드 제공
              </Badge>
            )}

            {isApproved ? (
              <Badge variant="success" className="gap-1">
                <ShieldCheck className="h-4 w-4" />
                안전 검수 완료
              </Badge>
            ) : isPending ? (
              <Badge variant="warning" className="gap-1">
                <Clock className="h-4 w-4" />
                검수 대기중
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <FileWarning className="h-4 w-4" />
                위험/사용 불가
              </Badge>
            )}
            
            {resource.school_level && (
              <Badge variant="secondary">{resource.school_level}</Badge>
            )}
            {resource.subject && (
              <Badge variant="secondary">{resource.subject}</Badge>
            )}
          </div>

          <div className="flex justify-between items-start gap-4">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--color-text)] mb-4">
              {resource.title}
            </h1>
            <BookmarkButton resourceId={resource.id} showText={true} className="px-4 py-2 flex-shrink-0" />
          </div>

          <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)] border-b border-[var(--color-border)] pb-6 mb-6">
            <div className="font-medium text-[var(--color-text)]">
              작성자: {resource.profiles?.display_name || "익명 교사"}
            </div>
            <div>•</div>
            <div>등록일: {new Date(resource.created_at).toLocaleDateString()}</div>
          </div>

          <p className="text-lg leading-relaxed text-[var(--color-text-secondary)] whitespace-pre-wrap">
            {resource.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-2 text-sm">
            {tagNames.map((tag: string) => (
              <span key={tag} className="text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Video Embed Section */}
        {resource.video_url && (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 shadow-sm">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    시연 영상 (사용 가이드)
                </h2>
                {youtubeEmbedUrl ? (
                    <div className="aspect-video rounded-xl overflow-hidden bg-black/5 border border-[var(--color-border)]">
                        <iframe 
                            src={youtubeEmbedUrl} 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                            className="w-full h-full border-0"
                        />
                    </div>
                ) : (
                    <a href={resource.video_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                        <ExternalLink className="h-5 w-5" />
                        외부 동영상 링크 열기
                    </a>
                )}
            </div>
        )}

        {/* Action / Download Section */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-blue-50/50 p-8 text-center ring-1 ring-inset ring-blue-100 shadow-sm">
            {isLink && resource.external_url ? (
                <>
                    <h2 className="text-xl font-bold mb-2 text-slate-800">외부 앱 / 스크립트 도구</h2>
                    <p className="text-sm text-slate-600 mb-6">아래 버튼을 클릭하여 해당 웹 도구를 바로 이용할 수 있습니다. (새 창으로 열람)</p>
                    <a 
                        href={`/api/track-download?id=${resource.id}&url=${encodeURIComponent(resource.external_url)}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-sm hover:bg-blue-500 hover:shadow-md transition-all active:scale-95"
                    >
                        앱 구동 화면으로 이동하기
                        <ExternalLink className="h-5 w-5" />
                    </a>
                </>
            ) : isLink && !resource.external_url ? (
                <div className="text-red-600 flex items-center justify-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    <p>등록된 앱 링크(URL)를 찾을 수 없습니다.</p>
                </div>
            ) : downloadUrl ? (
                <>
                    <h2 className="text-xl font-bold mb-2 text-slate-800">첨부 파일 다운로드</h2>
                    <p className="text-sm text-slate-600 mb-6">AI 바이러스 검증을 통과한 원본 파일을 다운로드 받을 수 있습니다.</p>
                    <a 
                        href={`/api/track-download?id=${resource.id}&url=${encodeURIComponent(downloadUrl)}`} 
                        download
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-8 py-4 text-base font-semibold text-white shadow-sm hover:bg-slate-800 hover:shadow-md transition-all active:scale-95"
                    >
                        안전 다운로드
                        <Download className="h-5 w-5" />
                    </a>
                </>
            ) : (
                <div className="text-[var(--color-text-muted)] flex flex-col items-center justify-center gap-2 h-20">
                    <p>아직 다운로드용 파일이 첨부되지 않았거나 처리 중입니다.</p>
                </div>
            )}
        </div>
        
        {/* Reviews Section */}
        <ReviewSection resourceId={resource.id} resourceAuthorId={resource.user_id} />

      </div>
    </div>
  )
}
