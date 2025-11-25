"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import type { University } from "@/lib/types"
import { UniversitySelector } from "./university-selector"
import { UniversityDetails } from "./university-details"
import { AnnouncementBanner } from "./announcement-banner"
import { ThemeToggle } from "./theme-toggle"
import { GraduationCap, Calendar, Search, Loader2, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const ACADEMIC_YEARS = ["2025-2026", "2024-2025", "2023-2024"]

export function CETTracker() {
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedYear, setSelectedYear] = useState<string>("all") // Added AY filter state

  const { data: universities = [], error, isLoading } = useSWR<University[]>("/api/universities", fetcher)

  const filteredUniversities = useMemo(() => {
    return universities.filter((uni) => {
      const matchesSearch =
        uni.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        uni.short_name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesYear = selectedYear === "all" || uni.academic_year === selectedYear
      return matchesSearch && matchesYear
    })
  }, [universities, searchQuery, selectedYear])

  const availableYears = useMemo(() => {
    const years = new Set(universities.map((uni) => uni.academic_year).filter(Boolean))
    return Array.from(years).sort().reverse()
  }, [universities])

  return (
    <div className="min-h-screen">
      <AnnouncementBanner />

      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">CET Tracker PH</h1>
                <p className="text-xs text-muted-foreground">College Entrance Test Schedule</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="text-center">
            <h2 className="text-pretty text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Track Your College Entrance Exams
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-balance text-muted-foreground">
              Find application periods, exam dates, requirements, and official admission links for the top 10
              universities in the Philippines.
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-2xl">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search universities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-border bg-secondary px-4 py-3 pl-12 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full sm:w-48 h-12 bg-secondary border-border">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Academic Year" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {(availableYears.length > 0 ? availableYears : ACADEMIC_YEARS).map((year) => (
                    <SelectItem key={year} value={year}>
                      AY {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Loading universities...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 py-20">
            <p className="text-destructive">Failed to load universities. Please try again later.</p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
            {/* Sidebar - University List */}
            <aside>
              <div className="sticky top-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Select a University</h3>
                  {selectedYear !== "all" && (
                    <span className="text-xs text-primary flex items-center gap-1">
                      <Filter className="h-3 w-3" />
                      AY {selectedYear}
                    </span>
                  )}
                </div>
                <UniversitySelector
                  universities={filteredUniversities}
                  selectedUniversity={selectedUniversity}
                  onSelect={setSelectedUniversity}
                />
              </div>
            </aside>

            {/* Main Content - University Details */}
            <main>
              {selectedUniversity ? (
                <UniversityDetails university={selectedUniversity} />
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/30 py-20">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                    <GraduationCap className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-foreground">Select a University</h3>
                  <p className="mt-2 text-center text-sm text-muted-foreground">
                    Choose from the list to view CET details, schedules, and requirements.
                  </p>
                </div>
              )}
            </main>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground">
            Disclaimer: Dates and requirements are subject to change. Always verify with official university websites.
          </p>
        </div>
      </footer>
    </div>
  )
}
