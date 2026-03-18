"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Upload, Home, Shield, LogOut, Loader2, User as UserIcon, ChevronDown, Settings } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"

/**
 * 네비게이션 바 — 상단 고정 헤더
 * 홈 / 업로드 / 동적 로그인 상태 표시
 */
export function Navbar() {
  const pathname = usePathname()
  const { user, isLoading, isAdmin, signInWithGoogle, signOut } = useAuth()

  /* 현재 경로와 일치하면 활성 스타일 적용 */
  const isActive = (href: string) => pathname === href

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[var(--color-border)] bg-[var(--color-bg-card)]/80 backdrop-blur-lg">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <Shield className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold text-[var(--color-text)] group-hover:text-blue-600 transition-colors">
              Antigravity
            </span>
          </Link>

          {/* 메뉴 링크 */}
          <div className="flex items-center gap-1">
            <Link
              href="/"
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive("/")
                  ? "bg-blue-50 text-blue-700"
                  : "text-[var(--color-text-secondary)] hover:bg-slate-100 hover:text-[var(--color-text)]"
              }`}
            >
              <Home className="h-4 w-4" />
              홈
            </Link>

            <Link
              href="/upload"
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive("/upload")
                  ? "bg-blue-50 text-blue-700"
                  : "text-[var(--color-text-secondary)] hover:bg-slate-100 hover:text-[var(--color-text)]"
              }`}
            >
              <Upload className="h-4 w-4" />
              자료 올리기
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive("/admin")
                    ? "bg-purple-50 text-purple-700"
                    : "text-[var(--color-text-secondary)] hover:bg-slate-100 hover:text-[var(--color-text)]"
                }`}
              >
                <Shield className="h-4 w-4 text-purple-600" />
                관리자 페이지
              </Link>
            )}

            {/* 로그인 상태 */}
            <div className="ml-3 flex items-center border-l border-[var(--color-border)] pl-4">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-[var(--color-text-muted)]" />
              ) : user ? (
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button className="flex items-center gap-2 rounded-full p-1 pl-2 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                      <div className="flex items-center gap-2">
                        {user.user_metadata?.avatar_url ? (
                          <img src={user.user_metadata.avatar_url} alt="Avatar" className="h-8 w-8 rounded-full border border-[var(--color-border)] object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                            <UserIcon className="h-4 w-4" />
                          </div>
                        )}
                        <span className="hidden sm:inline-block text-sm font-medium text-[var(--color-text)]">
                          {user.user_metadata?.name || user.email?.split("@")[0] || "사용자"}
                        </span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)] mr-1" />
                    </button>
                  </DropdownMenu.Trigger>

                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      className="z-50 min-w-[220px] overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-lg animate-in fade-in-80 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
                      align="end"
                      sideOffset={8}
                    >
                      <div className="flex flex-col space-y-1 p-3 border-b border-slate-100 mb-1">
                        <p className="text-sm font-medium leading-none text-slate-900">{user.user_metadata?.name || "사용자"}</p>
                        <p className="text-xs leading-none text-slate-500 mt-1.5">{user.email}</p>
                      </div>
                      
                      <DropdownMenu.Item asChild>
                        <Link href="/profile" className="flex w-full cursor-pointer select-none items-center rounded-md px-2 py-2 text-sm text-slate-700 outline-none hover:bg-slate-100 transition-colors">
                          <UserIcon className="mr-2 h-4 w-4 text-slate-500" />
                          내 프로필
                        </Link>
                      </DropdownMenu.Item>
                      
                      <DropdownMenu.Item onSelect={async (e) => { e.preventDefault(); await signOut(); await signInWithGoogle(); }} className="flex w-full cursor-pointer select-none items-center rounded-md px-2 py-2 text-sm text-slate-700 outline-none hover:bg-slate-100 transition-colors">
                        <Settings className="mr-2 h-4 w-4 text-slate-500" />
                        다른 계정으로 로그인 (전환)
                      </DropdownMenu.Item>
                      
                      <DropdownMenu.Separator className="h-px bg-slate-100 my-1" />
                      
                      <DropdownMenu.Item onSelect={() => signOut()} className="flex w-full cursor-pointer select-none items-center rounded-md px-2 py-2 text-sm text-red-600 outline-none hover:bg-red-50 transition-colors">
                        <LogOut className="mr-2 h-4 w-4" />
                        로그아웃
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              ) : (
                <button 
                  onClick={signInWithGoogle}
                  className="rounded-lg bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google 로그인
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
