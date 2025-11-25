"use client"

import type { University } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, FileText, ExternalLink, GraduationCap, Banknote } from "lucide-react"
import { cn } from "@/lib/utils"

interface UniversityDetailsProps {
  university: University
}

export function UniversityDetails({ university }: UniversityDetailsProps) {
  const getStatusColor = (status: University["application_status"]) => {
    switch (status) {
      case "ongoing":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "upcoming":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "closed":
        return "bg-red-500/20 text-red-400 border-red-500/30"
    }
  }

  const getStatusLabel = (status: University["application_status"]) => {
    switch (status) {
      case "ongoing":
        return "Applications Open"
      case "upcoming":
        return "Upcoming"
      case "closed":
        return "Applications Closed"
    }
  }

  return (
    <div className="space-y-6">
      {/* University Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <img
            src={university.logo || "/placeholder.svg"}
            alt={`${university.name} logo`}
            className="h-16 w-16 rounded-xl bg-secondary object-cover"
          />
          <div>
            <h2 className="text-2xl font-bold text-foreground">{university.name}</h2>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="secondary" className="font-mono">
                {university.exam_name}
              </Badge>
              <Badge variant="outline" className={cn(getStatusColor(university.application_status))}>
                {getStatusLabel(university.application_status)}
              </Badge>
            </div>
          </div>
        </div>
        <Button asChild className="shrink-0">
          <a href={university.admission_link} target="_blank" rel="noopener noreferrer">
            Visit Admissions
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>

      {/* Info Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Application Period */}
        <Card className="bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4 text-primary" />
              Application Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Start Date</p>
              <p className="font-medium text-foreground">{university.application_start}</p>
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-sm text-muted-foreground">End Date</p>
              <p className="font-medium text-foreground">{university.application_end}</p>
            </div>
          </CardContent>
        </Card>

        {/* Exam Dates */}
        <Card className="bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="h-4 w-4 text-primary" />
              Exam Date(s)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {university.exam_dates.map((exam, index) => (
                <div key={index}>
                  <p className="font-medium text-foreground">{exam.date}</p>
                  {exam.note && <p className="text-sm text-muted-foreground">{exam.note}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Results Release */}
        <Card className="bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-primary" />
              Results Release
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium text-foreground">{university.results_release}</p>
          </CardContent>
        </Card>

        {/* Exam Fee */}
        <Card className="bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Banknote className="h-4 w-4 text-primary" />
              Application Fee
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{university.exam_fee || "Contact University"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Test Locations */}
      <Card className="bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-primary" />
            Test Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 sm:grid-cols-2">
            {university.test_locations.map((location, index) => (
              <li key={index} className="flex items-start gap-2 rounded-md bg-secondary/50 px-3 py-2 text-sm">
                <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                <span className="text-foreground">{location}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Requirements */}
      <Card className="bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary" />
            Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {university.requirements.map((requirement, index) => (
              <li key={index} className="flex items-start gap-3 text-sm">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
                  {index + 1}
                </span>
                <span className="text-foreground">{requirement}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="rounded-lg border border-primary/30 bg-primary/10 p-6 text-center">
        <h3 className="text-lg font-semibold text-foreground">Ready to Apply?</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Visit the official admissions page for the most up-to-date information and to start your application.
        </p>
        <Button asChild className="mt-4">
          <a href={university.admission_link} target="_blank" rel="noopener noreferrer">
            Go to {university.short_name} Admissions
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  )
}
