"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, BookOpen, Download, FileText, Link as LinkIcon, Search, Plus, Upload } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { getGlobalMaterials, uploadMaterial, type StudyMaterial } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function MaterialsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [materials, setMaterials] = useState<StudyMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Upload State
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newSubject, setNewSubject] = useState("")
  const [newSemester, setNewSemester] = useState("")
  const [newType, setNewType] = useState("pdf")
  const [newUrl, setNewUrl] = useState("")
  const [newFile, setNewFile] = useState<File | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/")
    }
  }, [authLoading, user, router])

  const loadMaterials = async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await getGlobalMaterials()
      setMaterials(data)
    } catch {
      setError("Failed to load study materials.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMaterials()
  }, [user])

  const handleUpload = async () => {
    if (!newTitle.trim()) return
    setUploading(true)
    
    const formData = new FormData()
    formData.append("title", newTitle)
    formData.append("description", newDescription)
    formData.append("subject", newSubject)
    formData.append("semester", newSemester)
    formData.append("material_type", newType)
    formData.append("is_public", "true")
    
    if (newFile) {
      formData.append("file", newFile)
    } else if (newUrl) {
      formData.append("url", newUrl)
    }

    try {
      await uploadMaterial(formData)
      setIsUploadOpen(false)
      // Reset form
      setNewTitle("")
      setNewDescription("")
      setNewSubject("")
      setNewSemester("")
      setNewType("pdf")
      setNewUrl("")
      setNewFile(null)
      // Reload
      loadMaterials()
    } catch (err) {
      console.error(err)
      alert("Failed to upload material.")
    } finally {
      setUploading(false)
    }
  }

  const filteredMaterials = materials.filter((m) => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading materials...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold text-foreground">Study Materials</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Browse and download resources shared by the community across all study rooms.
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-grow md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search materials..." 
                className="pl-9 bg-card"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> Upload
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Upload Study Material</DialogTitle>
                  <DialogDescription>
                    Share helpful resources with the community. These will be visible to everyone.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Calculus II Midterm Notes" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Briefly describe what this is..." />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input id="subject" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="Math" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="semester">Semester</Label>
                      <Input id="semester" value={newSemester} onChange={(e) => setNewSemester(e.target.value)} placeholder="Sem 1" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="type">Type</Label>
                      <Select value={newType} onValueChange={setNewType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="doc">Word</SelectItem>
                          <SelectItem value="image">Image</SelectItem>
                          <SelectItem value="link">Link</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {newType === 'link' ? (
                    <div className="grid gap-2">
                      <Label htmlFor="url">Link URL</Label>
                      <Input id="url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://..." />
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      <Label htmlFor="file">File</Label>
                      <Input id="file" type="file" onChange={(e) => setNewFile(e.target.files?.[0] || null)} />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
                  <Button onClick={handleUpload} disabled={uploading || !newTitle.trim()}>
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                    Upload Material
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {filteredMaterials.length === 0 && !loading && !error ? (
          <div className="rounded-3xl border border-dashed border-border bg-muted p-12 text-center text-muted-foreground flex flex-col items-center gap-4">
            <BookOpen className="h-10 w-10 text-muted-foreground/50" />
            <p>No study materials found.</p>
            <Button variant="outline" onClick={() => setIsUploadOpen(true)}>Be the first to upload</Button>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMaterials.map((material) => (
              <Card key={material.id} className="border-border bg-card flex flex-col hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-4">
                    <CardTitle className="text-lg leading-tight line-clamp-2">
                      {material.title}
                    </CardTitle>
                    <Badge variant="secondary" className="capitalize shrink-0">
                      {material.material_type}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2 mt-2">
                    {material.description || "No description provided."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 flex-grow text-sm text-muted-foreground">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="font-medium text-foreground">Subject</p>
                      <p className="truncate">{material.subject || "General"}</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Semester</p>
                      <p className="truncate">{material.semester || "Any"}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border mt-4 text-xs">
                    <p>Uploaded by {material.uploaded_by?.username} • {new Date(material.created_at).toLocaleDateString()}</p>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 border-t border-border/50 bg-muted/20">
                  {material.url ? (
                    <Button variant="outline" className="w-full gap-2" asChild>
                      <a href={material.url} target="_blank" rel="noopener noreferrer">
                        <LinkIcon className="h-4 w-4" /> Open Link
                      </a>
                    </Button>
                  ) : material.file ? (
                    <Button variant="outline" className="w-full gap-2" asChild>
                      <a href={material.file} target="_blank" rel="noopener noreferrer" download>
                        <Download className="h-4 w-4" /> Download File
                      </a>
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full gap-2" disabled>
                      <FileText className="h-4 w-4" /> No File Available
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
