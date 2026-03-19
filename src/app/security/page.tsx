export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-3xl font-bold mb-8">보안정책</h1>
      <div className="prose prose-slate">
        <p>VibeT는 교사 및 학생의 안전을 위해 업로드되는 모든 자료에 대하여 AI 기반 바이러스 및 악성코드 검사를 수행합니다.</p>
        <p>안전이 확인된 문서만 승인 처리되어 공유되며, 의심스러운 파일은 즉각 격리(Quarantine) 처리됩니다.</p>
        {/* 더미 텍스트 추가 가능 */}
      </div>
    </div>
  )
}
