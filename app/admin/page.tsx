"use client"

import { useState, useMemo } from "react"
import useSWR, { mutate } from "swr"
import type { University, ExamDate } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import { 
  GraduationCap, Plus, Pencil, Trash2, ArrowLeft, Loader2, Save, X, 
  Sparkles, LogOut, LayoutDashboard, Calendar, BarChart3 
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts"

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
  
  // AI States
  const [rawText, setRawText] = useState("")
  const [isParsing, setIsParsing] = useState(false)

  // Auth
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  // Dashboard Analytics
  const stats = useMemo(() => {
    return {
      total: universities.length,
      ongoing: universities.filter(u => u.application_status === 'ongoing').length,
      upcoming: universities.filter(u => u.application_status === 'upcoming').length,
      closed: universities.filter(u => u.application_status === 'closed').length,
    }
  }, [universities])

  const chartData = [
    { name: 'Open', value: stats.ongoing, color: '#22c55e' }, // green
    { name: 'Upcoming', value: stats.upcoming, color: '#eab308' }, // yellow
    { name: 'Closed', value: stats.closed, color: '#ef4444' }, // red
  ]

  // AI Handler
  const handleMagicFill = async () => {
    if (!rawText) return
    setIsParsing(true)
    try {
      const res = await fetch("/api/admin/parse-announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText }),
      })
      const data = await res.json()
      
      setFormData(prev => ({
        ...prev,
        ...data,
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
    setRawText("")
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
        return "bg-green-500/20 text-green-600 border-green-500/30"
      case "upcoming":
        return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30"
      case "closed":
        return "bg-red-500/20 text-red-600 border-red-500/30"
      default:
        return ""
    }
  }

  return (
    <div className="min-h-screen bg-muted/10">
      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 font-semibold">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <span>CET Admin</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              View Site
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        
        {/* Analytics Section */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Universities</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Tracked in database</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applications Open</CardTitle>
              <div className="h-2 w-2 rounded-full bg-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.ongoing}</div>
              <p className="text-xs text-muted-foreground">Currently accepting</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Exams</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcoming}</div>
              <p className="text-xs text-muted-foreground">Opening soon</p>
            </CardContent>
          </Card>
          <Card className="col-span-1 lg:col-span-1">
             <CardContent className="p-0 h-full flex items-center justify-center">
                <div className="h-[80px] w-full mt-4 pr-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" hide />
                      <Tooltip 
                        contentStyle={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px' }}
                        cursor={{fill: 'transparent'}}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
             </CardContent>
          </Card>
        </div>

        {/* List Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Manage Universities</h2>
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

                {/* AI Magic Fill UI */}
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

                {/* Form Fields (Same as before) */}
                <div className="grid gap-4 py-4">
                  {/* ... (University Name & Short Name) ... */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">University Name</Label>
                      <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="University of the Philippines" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="short_name">Short Name</Label>
                      <Input id="short_name" value={formData.short_name} onChange={(e) => setFormData({...formData, short_name: e.target.value})} placeholder="UP" />
                    </div>
                  </div>

                  {/* ... (Slug & Exam Name) ... */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="slug">Slug (URL ID)</Label>
                      <Input id="slug" value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} placeholder="up" disabled={!!editingUniversity} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="exam_name">Exam Name</Label>
                      <Input id="exam_name" value={formData.exam_name} onChange={(e) => setFormData({...formData, exam_name: e.target.value})} placeholder="UPCAT" />
                    </div>
                  </div>

                  {/* ... (Status & Fee) ... */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="exam_fee">Exam Fee</Label>
                      <Input id="exam_fee" value={formData.exam_fee} onChange={(e) => setFormData({...formData, exam_fee: e.target.value})} placeholder="₱500" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="application_status">Status</Label>
                      <Select value={formData.application_status} onValueChange={(v: any) => setFormData({...formData, application_status: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="upcoming">Upcoming</SelectItem>
                          <SelectItem value="ongoing">Open</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* ... (Dates) ... */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="application_start">App Start</Label>
                      <Input id="application_start" value={formData.application_start} onChange={(e) => setFormData({...formData, application_start: e.target.value})} placeholder="August 1" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="application_end">App End</Label>
                      <Input id="application_end" value={formData.application_end} onChange={(e) => setFormData({...formData, application_end: e.target.value})} placeholder="September 15" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="results_release">Results Release</Label>
                    <Input id="results_release" value={formData.results_release} onChange={(e) => setFormData({...formData, results_release: e.target.value})} placeholder="January 2026" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="admission_link">Admission Link</Label>
                    <Input id="admission_link" value={formData.admission_link} onChange={(e) => setFormData({...formData, admission_link: e.target.value})} placeholder="https://..." />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logo">Logo URL</Label>
                    <Input id="logo" value={formData.logo} onChange={(e) => setFormData({...formData, logo: e.target.value})} placeholder="/up-logo.jpg" />
                  </div>

                  {/* Dynamic Fields: Exam Dates */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Exam Dates</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem("exam_dates")}><Plus className="h-3 w-3 mr-1" /> Add</Button>
                    </div>
                    {formData.exam_dates.map((examDate, index) => (
                      <div key={index} className="flex gap-2">
                        <Input value={examDate.date} onChange={(e) => { const n = [...formData.exam_dates]; n[index].date = e.target.value; setFormData({...formData, exam_dates: n}) }} placeholder="Date" className="flex-1" />
                        <Input value={examDate.note || ""} onChange={(e) => { const n = [...formData.exam_dates]; n[index].note = e.target.value; setFormData({...formData, exam_dates: n}) }} placeholder="Note" className="flex-1" />
                        {formData.exam_dates.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem("exam_dates", index)}><X className="h-4 w-4" /></Button>}
                      </div>
                    ))}
                  </div>

                  {/* Dynamic Fields: Requirements */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Requirements</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem("requirements")}><Plus className="h-3 w-3 mr-1" /> Add</Button>
                    </div>
                    {formData.requirements.map((req, index) => (
                      <div key={index} className="flex gap-2">
                        <Input value={req} onChange={(e) => { const n = [...formData.requirements]; n[index] = e.target.value; setFormData({...formData, requirements: n}) }} placeholder="Requirement" className="flex-1" />
                        {formData.requirements.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem("requirements", index)}><X className="h-4 w-4" /></Button>}
                      </div>
                    ))}
                  </div>
                  
                  {/* Dynamic Fields: Locations */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Locations</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem("test_locations")}><Plus className="h-3 w-3 mr-1" /> Add</Button>
                    </div>
                    {formData.test_locations.map((loc, index) => (
                      <div key={index} className="flex gap-2">
                        <Input value={loc} onChange={(e) => { const n = [...formData.test_locations]; n[index] = e.target.value; setFormData({...formData, test_locations: n}) }} placeholder="Location" className="flex-1" />
                        {formData.test_locations.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem("test_locations", index)}><X className="h-4 w-4" /></Button>}
                      </div>
                    ))}
                  </div>

                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Save</>}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* List Grid */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Loading universities...</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {universities.map((university) => (
                <Card key={university.id} className="bg-card hover:shadow-md transition-shadow">
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
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditDialog(university)}
                      >
                        <Pencil className="mr-2 h-3 w-3" />
                        Edit
                      </Button>
                      {deleteConfirm === university.slug ? (
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(university.slug)}>
                          Confirm
                        </Button>
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
        </div>
      </main>
    </div>
  )
}