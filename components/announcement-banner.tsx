"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { X, ChevronLeft, ChevronRight, ExternalLink, Megaphone, Sparkles, Bell, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Announcement } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function AnnouncementBanner() {
  const { data: announcements = [] } = useSWR<Announcement[]>("/api/announcements", fetcher)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dismissed, setDismissed] = useState<string[]>([])
  const [isVisible, setIsVisible] = useState(false)

  const activeAnnouncements = announcements.filter((a) => !dismissed.includes(a.id))

  useEffect(() => {
    if (activeAnnouncements.length > 0) {
      setIsVisible(true)
    }
  }, [activeAnnouncements.length])

  // Auto-rotate announcements every 5 seconds
  useEffect(() => {
    if (activeAnnouncements.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeAnnouncements.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [activeAnnouncements.length])

  if (activeAnnouncements.length === 0 || !isVisible) return null

  const current = activeAnnouncements[currentIndex % activeAnnouncements.length]

  const getTypeConfig = (type: Announcement["type"]) => {
    switch (type) {
      case "success":
        return {
          gradient: "from-emerald-600 via-teal-600 to-cyan-600",
          icon: <Sparkles className="h-4 w-4" />,
          glow: "shadow-emerald-500/20",
        }
      case "warning":
        return {
          gradient: "from-amber-500 via-orange-500 to-yellow-500",
          icon: <AlertTriangle className="h-4 w-4" />,
          glow: "shadow-amber-500/20",
        }
      case "urgent":
        return {
          gradient: "from-rose-600 via-red-600 to-pink-600",
          icon: <Bell className="h-4 w-4 animate-pulse" />,
          glow: "shadow-rose-500/20",
        }
      default:
        return {
          gradient: "from-blue-600 via-indigo-600 to-violet-600",
          icon: <Megaphone className="h-4 w-4" />,
          glow: "shadow-blue-500/20",
        }
    }
  }

  const config = getTypeConfig(current.type)

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + activeAnnouncements.length) % activeAnnouncements.length)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeAnnouncements.length)
  }

  const handleDismiss = () => {
    setDismissed((prev) => [...prev, current.id])
    if (currentIndex >= activeAnnouncements.length - 1) {
      setCurrentIndex(0)
    }
  }

  return (
    <div className={cn("relative overflow-hidden", `shadow-lg ${config.glow}`)}>
      {/* Gradient Background */}
      <div className={cn("absolute inset-0 bg-gradient-to-r", config.gradient)} />

      {/* Animated shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Icon with background */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm flex-shrink-0">
              {config.icon}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{current.title}</p>
              <p className="text-xs text-white/80 truncate hidden sm:block">{current.message}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {current.link_url && (
              <a
                href={current.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-white hover:bg-white/30 transition-colors whitespace-nowrap"
              >
                {current.link_text || "Learn more"}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}

            {activeAnnouncements.length > 1 && (
              <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-full px-1">
                <button
                  onClick={handlePrev}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                  aria-label="Previous announcement"
                >
                  <ChevronLeft className="h-3.5 w-3.5 text-white" />
                </button>

                {/* Dot indicators */}
                <div className="flex items-center gap-1 px-1">
                  {activeAnnouncements.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={cn(
                        "h-1.5 w-1.5 rounded-full transition-all",
                        idx === currentIndex % activeAnnouncements.length
                          ? "bg-white w-3"
                          : "bg-white/40 hover:bg-white/60",
                      )}
                      aria-label={`Go to announcement ${idx + 1}`}
                    />
                  ))}
                </div>

                <button
                  onClick={handleNext}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                  aria-label="Next announcement"
                >
                  <ChevronRight className="h-3.5 w-3.5 text-white" />
                </button>
              </div>
            )}

            <button
              onClick={handleDismiss}
              className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Dismiss announcement"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
