"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  BookOpen, Users, MessageSquare, Bot, DoorOpen,
  Plus, Trash2, Loader2, LogOut, ArrowRight, BarChart3,
} from "lucide-react"
import {
  getMe, logout, getAdminStats, getRooms, createRoom, deleteRoom,
} from "@/lib/api"
import type { User, StudyRoom, AdminStats } from "@/lib/api"

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [rooms, setRooms] = useState<StudyRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  // Create room form
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newRoomName, setNewRoomName] = useState("")
  const [newRoomSubject, setNewRoomSubject] = useState("")
  const [newRoomDescription, setNewRoomDescription] = useState("")

  const fetchData = useCallback(async () => {
    try {
      const [userData, statsData, roomsData] = await Promise.all([
        getMe(),
        getAdminStats(),
        getRooms(),
      ])
      setUser(userData)
      setStats(statsData)
      setRooms(roomsData)
    } catch (err: any) {
      if (err?.status === 401) {
        router.push("/login")
        return
      }
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoomName.trim()) return
    setCreating(true)
    try {
      await createRoom({
        name: newRoomName,
        subject: newRoomSubject,
        description: newRoomDescription,
      })
      setNewRoomName("")
      setNewRoomSubject("")
      setNewRoomDescription("")
      setShowCreateForm(false)
      fetchData()
    } catch {
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteRoom = async (roomId: number) => {
    try {
      await deleteRoom(roomId)
      fetchData()
    } catch {}
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch {}
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const statCards = [
    { label: "Study Rooms", value: stats?.stats.total_rooms ?? 0, icon: DoorOpen, color: "text-blue-500" },
    { label: "Total Users", value: stats?.stats.total_users ?? 0, icon: Users, color: "text-green-500" },
    { label: "Messages", value: stats?.stats.total_messages ?? 0, icon: MessageSquare, color: "text-purple-500" },
    { label: "AI Responses", value: stats?.stats.ai_messages ?? 0, icon: Bot, color: "text-amber-500" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Manage your study rooms and view platform statistics.</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {statCards.map((stat) => (
            <Card key={stat.label} className="border-border bg-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-3 text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Study Rooms Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Study Rooms</h2>
            <Button size="sm" className="gap-2" onClick={() => setShowCreateForm(!showCreateForm)}>
              <Plus className="h-4 w-4" />
              Create Room
            </Button>
          </div>

          {/* Create room form */}
          {showCreateForm && (
            <Card className="mb-4 border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Create New Study Room</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateRoom} className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="roomName" className="text-sm">Room Name</Label>
                      <Input
                        id="roomName"
                        placeholder="e.g. Calculus Study Group"
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="roomSubject" className="text-sm">Subject</Label>
                      <Input
                        id="roomSubject"
                        placeholder="e.g. Mathematics"
                        value={newRoomSubject}
                        onChange={(e) => setNewRoomSubject(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="roomDesc" className="text-sm">Description (optional)</Label>
                    <Input
                      id="roomDesc"
                      placeholder="Brief description of the study session"
                      value={newRoomDescription}
                      onChange={(e) => setNewRoomDescription(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={creating}>
                      {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                      Create Room
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setShowCreateForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Room list */}
          {rooms.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <DoorOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No study rooms yet. Create your first one!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <Card key={room.id} className="border-border bg-card hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-foreground">{room.name}</h3>
                        {room.subject && (
                          <Badge variant="secondary" className="text-xs mt-1">{room.subject}</Badge>
                        )}
                      </div>
                      <Badge className="bg-green-500/10 text-green-600 text-xs">Active</Badge>
                    </div>
                    {room.description && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{room.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {room.member_count} members
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-destructive hover:text-destructive"
                          onClick={() => handleDeleteRoom(room.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <Link href={`/room/${room.id}`}>
                          <Button size="sm" className="h-7 text-xs gap-1">
                            Join <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Recent Activity</h2>
          <Card>
            <CardContent className="p-0">
              {stats?.recent_messages && stats.recent_messages.length > 0 ? (
                <div className="divide-y divide-border">
                  {stats.recent_messages.slice(0, 10).map((msg) => (
                    <div key={msg.id} className="flex items-center gap-3 px-4 py-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                        msg.is_ai ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                      }`}>
                        {msg.is_ai ? <Bot className="h-4 w-4" /> : msg.sender_name?.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className={`font-medium ${msg.is_ai ? "text-primary" : "text-foreground"}`}>
                            {msg.sender_name}
                          </span>
                          <span className="text-muted-foreground"> — {msg.content.substring(0, 100)}{msg.content.length > 100 ? "..." : ""}</span>
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No activity yet. Start a study session!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
