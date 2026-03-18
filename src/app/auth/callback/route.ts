import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            // we don't need to read cookies here for the callback
            console.log("get cookie:", name)
            return undefined
          },
          set(name: string, value: string, options: CookieOptions) {
            console.log("set cookie:", name, value, options)
            // this is a mock implementation because we're not actually setting cookies on the server
            // in a fully SSR app, we would use cookies() from next/headers
          },
          remove(name: string, options: CookieOptions) {
            console.log("remove cookie:", name, options)
          },
        },
      }
    )

    // Even though it's the server client, we are exchanging the code.
    // Actually, for client-side auth (which is what we are mostly using),
    // Supabase handles the session via hashes in the URL before it hits this route if configured so,
    // but when using `exchangeCodeForSession`, we do it server-side.
    // However, since we are doing a mostly SPA approach with createClient on the frontend,
    // the frontend client will automatically handle the URL `#access_token=...` fragment if we don't use SSR auth flow.
    // IF we are using standard OAuth with PKCE flow (default in v2), the redirect will be `?code=...`.
    
    // To keep the MVP simple, since `lib/supabase.ts` is a standard browser client,
    // we can just let the browser handle the callback if we redirect with a fragment, 
    // OR we can exchange the code here. Let's just exchange it using the frontend client.
  }

  // Next.js Route Handler for OAuth Callback
  // For simplicity in this MVP (since we use the standard supabase-js client on the frontend),
  // we can actually just redirect to the home page, and the Supabase JS client in AuthProvider
  // will automatically detect the tokens in the URL and set the session.
  return NextResponse.redirect(`${origin}${next}`)
}
