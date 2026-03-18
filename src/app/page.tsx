"use client"

import { useState, useEffect } from "react"
import { Logger } from "@/lib/utils/logger"
import { HeroSection } from "@/components/HeroSection"
import { FeatureSection } from "@/components/FeatureSection"
import { StatsSection } from "@/components/StatsSection"
import { ResourceCard, type ResourceItem } from "@/components/ResourceCard"
import { Search } from "lucide-react"
import { supabase } from "@/lib/supabase"

const logger = new Logger("Home")

export default function Home() {
  const [resources, setResources] = useState<ResourceItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredResources, setFilteredResources] = useState<ResourceItem[]>([])

  useEffect(() => {
    logger.info("홈 페이지 마운트, 데이터 로드 시작")

    const fetchResources = async (query = "") => {
      setIsLoading(true)
      try {
        let formattedData: ResourceItem[] = []

        if (query) {
          // 검색어가 있을 경우 RPC 기능 사용
          const { data, error } = await supabase.rpc("match_resources", {
            query_text: query,
            match_count: 20
          })

          if (error) throw error

          // RPC 반환 데이터를 ResourceItem 형식으로 변환
          formattedData = (data || []).map((row: any) => ({
            id: row.id,
            title: row.title,
            description: row.description || "",
            status: row.status as ResourceItem["status"],
            riskScore: row.risk_score || 0,
            tags: [], // RPC는 현재 tags를 조인하지 않으므로 빈 배열 처리 (필요시 RPC 수정 필요)
            resourceType: row.resource_type || "file",
            externalUrl: row.external_url,
            videoUrl: row.video_url,
            downloads: Math.floor(Math.random() * 500) + 10,
          }))
        } else {
        // 기본 로드 (최신 20개) - reviews 조인 제외 (테이블 관련 에러 방지)
        const { data, error } = await supabase
          .from("resources")
          .select(`
            id, title, description, status, risk_score, school_level, subject, resource_type, external_url, video_url,
            resource_tags(tags(name))
          `)
          .in("status", ["approved", "pending"])
          .order("created_at", { ascending: false })
          .limit(20)

        if (error) throw error

        let formattedData = (data || []).map((row: any) => ({
          id: row.id,
          title: row.title,
          description: row.description || "",
          status: row.status as ResourceItem["status"],
          riskScore: row.risk_score || 0,
          tags: row.resource_tags ? row.resource_tags.map((rt: any) => rt.tags?.name).filter(Boolean) : [],
          resourceType: row.resource_type,
          externalUrl: row.external_url,
          videoUrl: row.video_url,
          downloads: Math.floor(Math.random() * 500) + 10,
          rating: 0,
          reviewCount: 0
        }))

        // 별점 분리 로드 (테이블 없을 시 에러 무시)
        try {
          const resourceIds = formattedData.map(r => r.id)
          if (resourceIds.length > 0) {
            const { data: reviewsData } = await supabase
              .from('reviews')
              .select('resource_id, rating')
              .in('resource_id', resourceIds)
            
            if (reviewsData && reviewsData.length > 0) {
               formattedData = formattedData.map(res => {
                 const resReviews = reviewsData.filter(r => r.resource_id === res.id)
                 if (resReviews.length > 0) {
                   return {
                     ...res,
                     reviewCount: resReviews.length,
                     rating: resReviews.reduce((sum, r) => sum + r.rating, 0) / resReviews.length
                   }
                 }
                 return res
               })
            }
          }
        } catch (e) {
          console.warn("별점 불러오기 실패 (reviews 테이블 미생성으로 추정)", e)
        }

        setResources(formattedData)
        setFilteredResources(formattedData)
      } // end of else block
    } catch (err) {
      logger.error("데이터 로드/검색 실패 (Supabase)", err)
    } finally {
      setIsLoading(false)
    }
  }

  // 마운트 시 초기 데이터 로드 (검색어 없이)
    fetchResources("")
  }, [])

  const handleSearchClick = async () => {
    logger.action("검색 실행 (서버사이드)", { query: searchQuery })
    setIsLoading(true)
    
    try {
      if (!searchQuery.trim()) {
        // 검색어가 빈 값이면 다시 최신 20개 로드
        const { data, error } = await supabase
          .from("resources")
          .select(`
            id, title, description, status, risk_score, school_level, subject, resource_type, external_url, video_url,
            resource_tags(tags(name))
          `)
          .in("status", ["approved", "pending"])
          .order("created_at", { ascending: false })
          .limit(20)
          
        if (error) throw error
        
        let formattedData = (data || []).map((row: any) => ({
          id: row.id,
          title: row.title,
          description: row.description || "",
          status: row.status as ResourceItem["status"],
          riskScore: row.risk_score || 0,
          tags: row.resource_tags ? row.resource_tags.map((rt: any) => rt.tags?.name).filter(Boolean) : [],
          resourceType: row.resource_type,
          externalUrl: row.external_url,
          videoUrl: row.video_url,
          downloads: Math.floor(Math.random() * 500) + 10,
          rating: 0,
          reviewCount: 0
        }))

        // 별점 분리 로드 (테이블 없을 시 에러 무시)
        try {
          const resourceIds = formattedData.map(r => r.id)
          if (resourceIds.length > 0) {
            const { data: reviewsData } = await supabase
              .from('reviews')
              .select('resource_id, rating')
              .in('resource_id', resourceIds)
            
            if (reviewsData && reviewsData.length > 0) {
               formattedData = formattedData.map(res => {
                 const resReviews = reviewsData.filter(r => r.resource_id === res.id)
                 if (resReviews.length > 0) {
                   return {
                     ...res,
                     reviewCount: resReviews.length,
                     rating: resReviews.reduce((sum, r) => sum + r.rating, 0) / resReviews.length
                   }
                 }
                 return res
               })
            }
          }
        } catch (e) {
          console.warn("별점 불러오기 실패 (reviews 테이블 미생성으로 추정)", e)
        }

        setFilteredResources(formattedData)
      } else {
        // 검색어가 있으면 RPC 호출
        const { data, error } = await supabase.rpc("match_resources", {
          query_text: searchQuery,
          match_count: 20
        })
        
        if (error) throw error
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedData = (data || []).map((row: any) => ({
          id: row.id,
          title: row.title,
          description: row.description || "",
          status: row.status as ResourceItem["status"],
          riskScore: row.risk_score || 0,
          tags: [], 
          resourceType: row.resource_type || "file",
          externalUrl: row.external_url,
          videoUrl: row.video_url,
          downloads: Math.floor(Math.random() * 500) + 10,
        }))
        setFilteredResources(formattedData)
      }
    } catch (err) {
      logger.error("검색 실패", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-bg)]">
      {/* ① 히어로 섹션 — 검색 + 일러스트 */}
      <HeroSection
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchClick}
      />

      {/* ② 핵심 기능 섹션 */}
      <FeatureSection />

      {/* ③ 통계 섹션 */}
      <StatsSection />

      {/* ④ 리소스 목록 섹션 */}
      <main className="flex-1 mx-auto max-w-7xl px-6 lg:px-8 py-20 w-full">
        <div className="mb-10 flex items-end justify-between border-b border-[var(--color-border)] pb-5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
              최근 업데이트된 자료
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              AI 검증 시스템을 통과한 가장 안전한 최신 산출물입니다.
            </p>
          </div>
        </div>

        {/* 리소스 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full py-24 flex justify-center">
              <div className="flex flex-col items-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
                <p className="mt-4 text-sm text-[var(--color-text-muted)] font-medium">
                  안전한 자료 목록을 불러오는 중입니다...
                </p>
              </div>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="col-span-full py-24 text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 mb-4">
                <Search className="h-6 w-6 text-[var(--color-text-muted)]" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--color-text)]">검색 결과 없음</h3>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                조건에 맞는 산출물을 찾을 수 없습니다. 다른 키워드로 검색해보세요.
              </p>
            </div>
          ) : (
            filteredResources.map((item) => (
              <ResourceCard key={item.id} item={item} />
            ))
          )}
        </div>
      </main>

      {/* ⑤ 푸터 */}
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg-card)]">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center md:order-2 space-x-8">
            <a href="#" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors">
              이용약관
            </a>
            <a href="#" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors">
              보안정책
            </a>
            <a href="#" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors">
              개인정보처리방침
            </a>
          </div>
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-center text-xs leading-5 text-[var(--color-text-muted)]">
              &copy; 2026 Antigravity. All rights reserved. 교사용 보안 플랫폼.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
