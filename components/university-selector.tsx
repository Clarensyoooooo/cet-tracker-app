"use client"

import type { University } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface UniversitySelectorProps {
  universities: University[]
  selectedUniversity: University | null
  onSelect: (university: University) => void
}

export function UniversitySelector({ universities, selectedUniversity, onSelect }: UniversitySelectorProps) {
  const getStatusColor = (status: University["application_status"]) => {
    switch (status) {
      case "ongoing":
        return "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30"
      case "upcoming":
        return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30"
      case "closed":
        return "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30"
    }
  }

  const getStatusLabel = (status: University["application_status"]) => {
    switch (status) {
      case "ongoing":
        return "Open"
      case "upcoming":
        return "Upcoming"
      case "closed":
        return "Closed"
    }
  }

  return (
    <div className="space-y-2">
      {universities.map((university) => (
        <button
          key={university.id}
          onClick={() => onSelect(university)}
          className={cn(
            "w-full rounded-lg border border-border bg-card p-3 text-left transition-all hover:border-primary/50 hover:bg-secondary",
            selectedUniversity?.id === university.id && "border-primary bg-secondary ring-1 ring-primary",
          )}
        >
          <div className="flex items-start gap-3">
            <img
              src={university.logo || "/placeholder.svg"}
              alt={`${university.name} logo`}
              className="h-10 w-10 rounded-md bg-secondary object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground truncate">{university.short_name}</span>
                <Badge variant="outline" className={cn("text-xs", getStatusColor(university.application_status))}>
                  {getStatusLabel(university.application_status)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{university.exam_name}</p>
              {university.academic_year && (
                <p className="text-xs text-muted-foreground/70 mt-0.5">AY {university.academic_year}</p>
              )}
            </div>
          </div>
        </button>
      ))}
      {universities.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">No universities found matching your search.</p>
      )}
    </div>
  )
}
