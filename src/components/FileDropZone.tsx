"use client"

import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, File, X, CheckCircle, AlertTriangle } from "lucide-react"

interface FileDropZoneProps {
  /** 선택된 파일 목록을 부모에게 전달 */
  onFilesSelected: (files: File[]) => void
  /** 허용된 최대 파일 크기 (바이트, 기본 50MB) */
  maxFileSize?: number
  /** 허용 파일 확장자 목록 (예: [".pdf", ".docx"]) */
  acceptedExtensions?: string[]
}

/**
 * 파일 드래그앤드롭 + 클릭 선택 영역
 * - 다중 파일 지원
 * - 드래그 오버 시 시각적 피드백
 * - 파일 타입/크기 검증
 * - 선택된 파일 목록 + 삭제 기능
 */
export function FileDropZone({
  onFilesSelected,
  maxFileSize = 50 * 1024 * 1024, // 50MB
  acceptedExtensions = [".pdf", ".pptx", ".ppt", ".docx", ".doc", ".xlsx", ".xls", ".hwp", ".hwpx", ".zip", ".png", ".jpg", ".jpeg", ".mp4", ".webm"],
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  /* 파일 검증 */
  const validateFile = useCallback(
    (file: File): string | null => {
      const ext = "." + file.name.split(".").pop()?.toLowerCase()
      if (!acceptedExtensions.includes(ext)) {
        return `"${file.name}" — 지원하지 않는 파일 형식입니다. (${acceptedExtensions.join(", ")})`
      }
      if (file.size > maxFileSize) {
        return `"${file.name}" — 파일 크기가 ${(maxFileSize / 1024 / 1024).toFixed(0)}MB를 초과합니다.`
      }
      return null
    },
    [acceptedExtensions, maxFileSize]
  )

  /* 파일 추가 처리 */
  const handleFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles)
      const validFiles: File[] = []
      const newErrors: string[] = []

      fileArray.forEach((file) => {
        const error = validateFile(file)
        if (error) {
          newErrors.push(error)
        } else {
          /* 중복 파일 방지 */
          if (!files.some((f) => f.name === file.name && f.size === file.size)) {
            validFiles.push(file)
          }
        }
      })

      const updated = [...files, ...validFiles]
      setFiles(updated)
      setErrors(newErrors)
      onFilesSelected(updated)
    },
    [files, validateFile, onFilesSelected]
  )

  /* 드래그 이벤트 핸들러 */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  /* 파일 제거 */
  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index)
    setFiles(updated)
    onFilesSelected(updated)
  }

  /* 파일 크기를 읽기 좋은 형태로 변환 */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-4">
      {/* 드롭존 영역 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-300 ${
          isDragging
            ? "border-blue-500 bg-blue-50 scale-[1.01]"
            : "border-[var(--color-border)] bg-slate-50/50 hover:border-blue-300 hover:bg-blue-50/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={acceptedExtensions.join(",")}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />

        <div
          className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${
            isDragging
              ? "bg-blue-100 text-blue-600"
              : "bg-slate-100 text-[var(--color-text-muted)]"
          }`}
        >
          <Upload className="h-7 w-7" />
        </div>

        <p className="text-sm font-semibold text-[var(--color-text)]">
          {isDragging ? "여기에 놓으세요!" : "파일을 드래그하거나 클릭하여 선택"}
        </p>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          PDF, HWP, DOCX, PPT, 이미지, 압축파일(ZIP), 동영상(MP4) 등 · 최대 {(maxFileSize / 1024 / 1024).toFixed(0)}MB
        </p>
      </div>

      {/* 에러 메시지 */}
      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-1"
          >
            {errors.map((err, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"
              >
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                {err}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 선택된 파일 목록 */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            {files.map((file, index) => (
              <motion.div
                key={`${file.name}-${file.size}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 group"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <File className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text)] truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile(index)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-50 text-[var(--color-text-muted)] hover:text-red-500 transition-all"
                  aria-label="파일 삭제"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
