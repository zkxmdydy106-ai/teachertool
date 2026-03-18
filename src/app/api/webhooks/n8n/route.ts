import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    // 1. 단순 API 키 기반 인증 (실제 프로덕션에서는 더 견고하게 구성 고려)
    const authHeader = request.headers.get('Authorization')
    const expectedKey = process.env.N8N_WEBHOOK_SECRET || 'my-secret-webhook-key'

    if (!authHeader || authHeader !== `Bearer ${expectedKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Payload 파싱
    const payload = await request.json()
    const { resource_id, status, risk_score } = payload

    if (!resource_id || !status) {
      return NextResponse.json({ error: 'Missing required fields (resource_id, status)' }, { status: 400 })
    }

    // 3. Supabase 관리자 클라이언트 초기화 (RLS 우회를 위해 Service Role Key 필요)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseKey) {
      return NextResponse.json({ error: 'Missing Supabase Key configuration' }, { status: 500 })
    }

    // Service Role Key가 없다면 RLS 우회가 안 되어 실패할 수 있습니다.
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

    // 4. 리소스 상태 업데이트
    const { error: resourceError } = await supabaseAdmin
      .from('resources')
      .update({
        status: status,
        risk_score: risk_score || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', resource_id)

    if (resourceError) {
      console.error('Failed to update resource:', resourceError)
      return NextResponse.json({ error: 'Database update failed', details: resourceError.message }, { status: 500 })
    }

    // 5. 연결된 파일(file_assets)에 안전 여부 마킹
    const isSafe = status === 'approved'
    const { error: fileError } = await supabaseAdmin
      .from('file_assets')
      .update({ is_safe: isSafe })
      .eq('resource_id', resource_id)

    if (fileError) {
      console.warn("Could not update file_assets (it might be a link resource):", fileError.message)
    }

    return NextResponse.json({ success: true, message: 'Resource verification completed' })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
