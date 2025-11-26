"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import type { University, ExamDate } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GraduationCap, Plus, Pencil, Trash2, ArrowLeft, Loader2, Save, X } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea" 
import { Sparkles } from "lucide-react" // Import the icon

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const defaultFormData = {
  slug: "",
  name: "",
  short_name: "",
  logo: "",
  exam_name: "",
  exam_fee: "",
  application_start: "",
  application_end: "",
  application_status: "upcoming" as const,
  exam_dates: [{ date: "", note: "" }] as ExamDate[],
  results_release: "",
  test_locations: [""],
  requirements: [""],
  admission_link: "",
}

export default function AdminPage() {
  const { data: universities = [], error, isLoading } = useSWR<University[]>("/api/universities", fetcher)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUniversity, setEditingUniversity] = useState<University | null>(null)
  const [formData, setFormData] = useState(defaultFormData)
  const [isSaving, setIsSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const [rawText, setRawText] = useState("")
const [isParsing, setIsParsing] = useState(false)

const handleMagicFill = async () => {
  if (!rawText) return
  setIsParsing(true)
  try {
    const res = await fetch("/api/admin/parse-announcement", {
      method: "POST",
      body: JSON.stringify({ text: rawText }),
    })
    const data = await res.json()
    
    // Merge AI data with existing form data
    setFormData(prev => ({
      ...prev,
      ...data,
      // Ensure arrays are handled safely
      exam_dates: data.exam_dates || prev.exam_dates,
      requirements: data.requirements || prev.requirements,
    }))
  } catch (error) {
    console.error("AI Parse failed", error)
  } finally {
    setIsParsing(false)
  }
}

  const resetForm = () => {
    setFormData(defaultFormData)
    setEditingUniversity(null)
  }

  const openEditDialog = (university: University) => {
    setEditingUniversity(university)
    setFormData({
      slug: university.slug,
      name: university.name,
      short_name: university.short_name,
      logo: university.logo || "",
      exam_name: university.exam_name,
      exam_fee: university.exam_fee || "",
      application_start: university.application_start,
      application_end: university.application_end,
      application_status: university.application_status,
      exam_dates: university.exam_dates.length > 0 ? university.exam_dates : [{ date: "", note: "" }],
      results_release: university.results_release,
      test_locations: university.test_locations.length > 0 ? university.test_locations : [""],
      requirements: university.requirements.length > 0 ? university.requirements : [""],
      admission_link: university.admission_link,
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const payload = {
        ...formData,
        exam_dates: formData.exam_dates.filter((ed) => ed.date),
        test_locations: formData.test_locations.filter(Boolean),
        requirements: formData.requirements.filter(Boolean),
      }

      if (editingUniversity) {
        await fetch(`/api/universities/${editingUniversity.slug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } else {
        await fetch("/api/universities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }

      mutate("/api/universities")
      setIsDialogOpen(false)
      resetForm()
    } catch (err) {
      console.error("Failed to save university:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (slug: string) => {
    try {
      await fetch(`/api/universities/${slug}`, { method: "DELETE" })
      mutate("/api/universities")
      setDeleteConfirm(null)
    } catch (err) {
      console.error("Failed to delete university:", err)
    }
  }

  const addArrayItem = (field: "exam_dates" | "test_locations" | "requirements") => {
    if (field === "exam_dates") {
      setFormData((prev) => ({
        ...prev,
        exam_dates: [...prev.exam_dates, { date: "", note: "" }],
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: [...prev[field], ""],
      }))
    }
  }

  const removeArrayItem = (field: "exam_dates" | "test_locations" | "requirements", index: number) => {
    if (field === "exam_dates") {
      setFormData((prev) => ({
        ...prev,
        exam_dates: prev.exam_dates.filter((_, i) => i !== index),
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index),
      }))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "upcoming":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "closed":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return ""
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                  <GraduationCap className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-foreground">Admin Dashboard</h1>
                  <p className="text-xs text-muted-foreground">Manage University Data</p>
                </div>
              </div>
            </div>

            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open)
                if (!open) resetForm()
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add University
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingUniversity ? "Edit University" : "Add New University"}</DialogTitle>
                  <DialogDescription>
                    {editingUniversity
                      ? "Update the university information below."
                      : "Fill in the details for the new university."}
                  </DialogDescription>
                </DialogHeader>

                {/* --- START MAGIC FILL UI --- */}
  <div className="bg-muted/50 p-4 rounded-lg my-4 border border-dashed">
    <Label className="flex items-center gap-2 mb-2 text-primary">
      <Sparkles className="w-4 h-4 text-yellow-500" />
      AI Magic Fill
    </Label>
    <Textarea 
      placeholder="Paste announcement text here (e.g. 'UPCAT applications open on Aug 1...')"
      value={rawText}
      onChange={(e) => setRawText(e.target.value)}
      className="mb-2 text-xs min-h-[80px]"
    />
    <Button 
      type="button" 
      size="sm" 
      onClick={handleMagicFill} 
      disabled={isParsing || !rawText}
      className="w-full"
      variant="secondary"
    >
      {isParsing ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin mr-2"/> Parsing...
        </>
      ) : (
        <>
          <Sparkles className="w-3 h-3 mr-2" /> Auto-fill Form
        </>
      )}
    </Button>
  </div>
  {/* --- END MAGIC FILL UI --- */}

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">University Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="University of the Philippines"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="short_name">Short Name</Label>
                      <Input
                        id="short_name"
                        value={formData.short_name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, short_name: e.target.value }))}
                        placeholder="UP"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="slug">Slug (URL-friendly ID)</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                        placeholder="up"
                        disabled={!!editingUniversity}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="exam_name">Exam Name</Label>
                      <Input
                        id="exam_name"
                        value={formData.exam_name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, exam_name: e.target.value }))}
                        placeholder="UPCAT"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="exam_fee">Exam Fee</Label>
                      <Input
                        id="exam_fee"
                        value={formData.exam_fee}
                        onChange={(e) => setFormData((prev) => ({ ...prev, exam_fee: e.target.value }))}
                        placeholder="₱500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="application_status">Application Status</Label>
                      <Select
                        value={formData.application_status}
                        onValueChange={(value: "upcoming" | "ongoing" | "closed") =>
                          setFormData((prev) => ({ ...prev, application_status: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="upcoming">Upcoming</SelectItem>
                          <SelectItem value="ongoing">Open</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="application_start">Application Start</Label>
                      <Input
                        id="application_start"
                        value={formData.application_start}
                        onChange={(e) => setFormData((prev) => ({ ...prev, application_start: e.target.value }))}
                        placeholder="August 1, 2025"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="application_end">Application End</Label>
                      <Input
                        id="application_end"
                        value={formData.application_end}
                        onChange={(e) => setFormData((prev) => ({ ...prev, application_end: e.target.value }))}
                        placeholder="September 15, 2025"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="results_release">Results Release</Label>
                    <Input
                      id="results_release"
                      value={formData.results_release}
                      onChange={(e) => setFormData((prev) => ({ ...prev, results_release: e.target.value }))}
                      placeholder="January 2026"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admission_link">Admission Link</Label>
                    <Input
                      id="admission_link"
                      value={formData.admission_link}
                      onChange={(e) => setFormData((prev) => ({ ...prev, admission_link: e.target.value }))}
                      placeholder="https://upcat.up.edu.ph"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logo">Logo URL (optional)</Label>
                    <Input
                      id="logo"
                      value={formData.logo}
                      onChange={(e) => setFormData((prev) => ({ ...prev, logo: e.target.value }))}
                      placeholder="/up-logo.jpg"
                    />
                  </div>

                  {/* Exam Dates */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Exam Dates</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem("exam_dates")}>
                        <Plus className="h-3 w-3 mr-1" /> Add Date
                      </Button>
                    </div>
                    {formData.exam_dates.map((examDate, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={examDate.date}
                          onChange={(e) => {
                            const newDates = [...formData.exam_dates]
                            newDates[index] = { ...newDates[index], date: e.target.value }
                            setFormData((prev) => ({ ...prev, exam_dates: newDates }))
                          }}
                          placeholder="November 16, 2025"
                          className="flex-1"
                        />
                        <Input
                          value={examDate.note || ""}
                          onChange={(e) => {
                            const newDates = [...formData.exam_dates]
                            newDates[index] = { ...newDates[index], note: e.target.value }
                            setFormData((prev) => ({ ...prev, exam_dates: newDates }))
                          }}
                          placeholder="Note (optional)"
                          className="flex-1"
                        />
                        {formData.exam_dates.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeArrayItem("exam_dates", index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Test Locations */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Test Locations</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem("test_locations")}>
                        <Plus className="h-3 w-3 mr-1" /> Add Location
                      </Button>
                    </div>
                    {formData.test_locations.map((location, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={location}
                          onChange={(e) => {
                            const newLocations = [...formData.test_locations]
                            newLocations[index] = e.target.value
                            setFormData((prev) => ({ ...prev, test_locations: newLocations }))
                          }}
                          placeholder="UP Diliman, Quezon City"
                          className="flex-1"
                        />
                        {formData.test_locations.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeArrayItem("test_locations", index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Requirements */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Requirements</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem("requirements")}>
                        <Plus className="h-3 w-3 mr-1" /> Add Requirement
                      </Button>
                    </div>
                    {formData.requirements.map((requirement, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={requirement}
                          onChange={(e) => {
                            const newRequirements = [...formData.requirements]
                            newRequirements[index] = e.target.value
                            setFormData((prev) => ({ ...prev, requirements: newRequirements }))
                          }}
                          placeholder="Accomplished Application Form"
                          className="flex-1"
                        />
                        {formData.requirements.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeArrayItem("requirements", index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {universities.map((university) => (
              <Card key={university.id} className="bg-card">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={university.logo || "/placeholder.svg"}
                        alt={`${university.name} logo`}
                        className="h-12 w-12 rounded-lg bg-secondary object-cover"
                      />
                      <div>
                        <CardTitle className="text-base">{university.short_name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{university.exam_name}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("text-xs", getStatusColor(university.application_status))}>
                      {university.application_status === "ongoing"
                        ? "Open"
                        : university.application_status === "upcoming"
                          ? "Upcoming"
                          : "Closed"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-1">{university.name}</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={() => openEditDialog(university)}
                    >
                      <Pencil className="mr-2 h-3 w-3" />
                      Edit
                    </Button>
                    {deleteConfirm === university.slug ? (
                      <div className="flex gap-1">
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(university.slug)}>
                          Confirm
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(university.slug)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
