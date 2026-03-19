import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요.")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // 변경된 브랜드명으로 스토리지 키를 새로 파서 기존 브라우저에 남아있던 고장난 Auth Lock 무한대기 현상 강제 해제
    storageKey: 'vibet-auth-token',
  }
})
