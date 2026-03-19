// src/app/api/track-download/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  const url = searchParams.get("url")

  if (!id || !url) {
    return new NextResponse("Missing parameters", { status: 400 })
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // DB 카운트 증가 (비동기로 백그라운드 처리하여 유저 리다이렉트 지연 방지 가능하지만 여기선 대기)
    await supabase.rpc('increment_download', { res_id: id })
  } catch (error) {
    console.error("다운로드 카운트 증가 실패:", error)
  }

  // 사용자를 실제 파일/앱 URL로 리다이렉트
  return NextResponse.redirect(url)
}
