"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { Loader2, MessageCircle, Plus, Bookmark, User, MessageSquare, Clock4 } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import {
  getForumPosts,
  createForumPost,
  getForumReplies,
  createForumReply,
  type ForumPost,
  type ForumReply,
} from "@/lib/api"

const categories = ["General", "Homework", "Exam Prep", "Resources", "Question"]

export default function ForumPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null)
  const [replies, setReplies] = useState<ForumReply[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [replying, setReplying] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [subject, setSubject] = useState("")
  const [category, setCategory] = useState(categories[0])
  const [newReply, setNewReply] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/")
    }
  }, [authLoading, user, router])

  const loadPosts = async () => {
    setLoading(true)
    try {
      const data = await getForumPosts()
      setPosts(data)
      if (!selectedPost && data.length) {
        setSelectedPost(data[0])
      }
    } catch {
      setError("Could not load forum posts.")
    } finally {
      setLoading(false)
    }
  }

  const loadReplies = async (postId: number) => {
    try {
      const data = await getForumReplies(postId)
      setReplies(data)
    } catch {
      setError("Could not load replies.")
    }
  }

  useEffect(() => {
    if (user) {
      loadPosts()
    }
  }, [user])

  useEffect(() => {
    if (selectedPost) {
      loadReplies(selectedPost.id)
    } else {
      setReplies([])
    }
  }, [selectedPost])

  const handleCreatePost = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim() || !content.trim() || !subject.trim()) {
      setError("Title, subject, and content are required.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const post = await createForumPost({
        title,
        content,
        category,
        subject,
      })
      setTitle("")
      setContent("")
      setSubject("")
      setCategory(categories[0])
      setPosts((prev) => [post, ...prev])
      setSelectedPost(post)
    } catch {
      setError("Unable to create post.")
    } finally {
      setSaving(false)
    }
  }

  const handleReply = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedPost || !newReply.trim()) return
    setReplying(true)
    setError(null)
    try {
      const reply = await createForumReply(selectedPost.id, newReply)
      setNewReply("")
      setReplies((prev) => [...prev, reply])
      setPosts((prev) => prev.map((post) => post.id === selectedPost.id ? { ...post, reply_count: post.reply_count + 1 } : post))
    } catch {
      setError("Unable to post reply.")
    } finally {
      setReplying(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading forum...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="space-y-3 text-center">
          <h1 className="text-3xl font-semibold text-foreground">Study Forum</h1>
          <p className="max-w-2xl mx-auto text-sm text-muted-foreground">
            Share questions, collaborate with classmates, and keep the study conversation going.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-5">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Start a new discussion
                </CardTitle>
                <CardDescription>Ask a question or post a study prompt.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleCreatePost}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="forumTitle">Title</Label>
                      <Input
                        id="forumTitle"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="What would you like help with?"
                      />
                    </div>
                    <div>
                      <Label htmlFor="forumSubject">Subject</Label>
                      <Input
                        id="forumSubject"
                        value={subject}
                        onChange={(event) => setSubject(event.target.value)}
                        placeholder="e.g. Physics"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="forumCategory">Category</Label>
                      <select
                        id="forumCategory"
                        aria-label="Forum category"
                        value={category}
                        onChange={(event) => setCategory(event.target.value)}
                        className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
                      >
                        {categories.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div />
                  </div>

                  <div>
                    <Label htmlFor="forumContent">Details</Label>
                    <Textarea
                      id="forumContent"
                      value={content}
                      onChange={(event) => setContent(event.target.value)}
                      placeholder="Explain the problem or share your study question."
                      className="min-h-[140px]"
                    />
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving} className="gap-2">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Post discussion
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Latest conversations</CardTitle>
                <CardDescription>Browse recent forum posts and jump into the discussion.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ScrollArea className="max-h-[520px] pr-2">
                  <div className="space-y-3">
                    {posts.map((post) => (
                      <button
                        key={post.id}
                        type="button"
                        onClick={() => setSelectedPost(post)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${selectedPost?.id === post.id ? 'border-primary bg-primary/5' : 'border-border bg-muted hover:border-primary/50'}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-foreground">{post.title}</p>
                            <p className="text-xs text-muted-foreground">{post.subject} · {post.category}</p>
                          </div>
                          <Badge variant="secondary" className="text-xs">{post.reply_count} replies</Badge>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="h-3.5 w-3.5" /> {post.author.username}
                          <Clock4 className="h-3.5 w-3.5" /> {new Date(post.created_at).toLocaleDateString()}
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-5">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bookmark className="h-5 w-5 text-primary" />
                  {selectedPost ? selectedPost.title : 'Select a post'}
                </CardTitle>
                <CardDescription>View the selected discussion and contribute a reply.</CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedPost ? (
                  <p className="text-sm text-muted-foreground">Choose a topic from the list to see details.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-3xl border border-border bg-muted p-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="h-3.5 w-3.5" /> {selectedPost.author.username}
                        <Clock4 className="h-3.5 w-3.5" /> {new Date(selectedPost.created_at).toLocaleString()}
                      </div>
                      <p className="mt-3 text-sm text-foreground whitespace-pre-wrap">{selectedPost.content}</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-foreground">Replies</h3>
                        <Badge variant="outline" className="text-xs">{replies.length}</Badge>
                      </div>
                      <div className="space-y-3">
                        {replies.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-border bg-muted p-4 text-sm text-muted-foreground">
                            No replies yet. Be the first to respond.
                          </div>
                        ) : (
                          replies.map((reply) => (
                            <div key={reply.id} className="rounded-2xl border border-border bg-muted p-4">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                <User className="h-3.5 w-3.5" /> {reply.author.username}
                                <Clock4 className="h-3.5 w-3.5" /> {new Date(reply.created_at).toLocaleString()}
                              </div>
                              <p className="text-sm text-foreground whitespace-pre-wrap">{reply.content}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <form className="space-y-3" onSubmit={handleReply}>
                      <Label htmlFor="forumReply">Write a reply</Label>
                      <Textarea
                        id="forumReply"
                        value={newReply}
                        onChange={(event) => setNewReply(event.target.value)}
                        placeholder="Share a helpful answer or study tip."
                        className="min-h-[120px]"
                      />
                      <div className="flex justify-end">
                        <Button type="submit" disabled={replying} className="gap-2">
                          {replying ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                          Reply
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </main>
  )
}
