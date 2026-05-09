"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, CalendarDays, Clock4, Users, MapPin, Plus, Share2 } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { getSchedules, createSchedule, rsvpSchedule, type StudySchedule } from "@/lib/api"

export default function SchedulePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [schedules, setSchedules] = useState<StudySchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState("")
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [scheduledAt, setScheduledAt] = useState("")
  const [duration, setDuration] = useState(60)
  const [frequency, setFrequency] = useState("One-time")
  const [maxParticipants, setMaxParticipants] = useState(10)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/")
    }
  }, [authLoading, user, router])

  const loadSchedules = async () => {
    setLoading(true)
    try {
      const data = await getSchedules()
      setSchedules(data)
    } catch {
      setError("Unable to load study schedules.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadSchedules()
    }
  }, [user])

  const handleCreateSchedule = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim() || !subject.trim() || !scheduledAt) {
      setError("Title, subject, and schedule time are required.")
      return
    }
    setSaving(true)
    setError(null)

    try {
      const schedule = await createSchedule({
        title,
        subject,
        description,
        scheduled_at: scheduledAt,
        duration_minutes: duration,
        frequency,
        max_participants: maxParticipants,
      })
      setTitle("")
      setSubject("")
      setDescription("")
      setScheduledAt("")
      setDuration(60)
      setFrequency("One-time")
      setMaxParticipants(10)
      setSchedules((prev) => [schedule, ...prev])
    } catch {
      setError("Unable to schedule session.")
    } finally {
      setSaving(false)
    }
  }

  const handleRsvp = async (scheduleId: number) => {
    try {
      await rsvpSchedule(scheduleId, true)
      loadSchedules()
    } catch {
      setError("Unable to RSVP.")
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading schedules...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="space-y-3 text-center">
          <h1 className="text-3xl font-semibold text-foreground">Study Schedule</h1>
          <p className="max-w-2xl mx-auto text-sm text-muted-foreground">
            Plan upcoming sessions, invite classmates, and RSVP to study events.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-5">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  Create a session
                </CardTitle>
                <CardDescription>Schedule a focused study session and invite other members.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleCreateSchedule}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="sessionTitle">Title</Label>
                      <Input
                        id="sessionTitle"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Exam review session"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sessionSubject">Subject</Label>
                      <Input
                        id="sessionSubject"
                        value={subject}
                        onChange={(event) => setSubject(event.target.value)}
                        placeholder="e.g. Biology"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="sessionDescription">Description</Label>
                    <Textarea
                      id="sessionDescription"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Add details about the material and goals."
                      className="min-h-[120px]"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="sessionDate">Date & time</Label>
                      <Input
                        id="sessionDate"
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(event) => setScheduledAt(event.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sessionDuration">Duration (minutes)</Label>
                      <Input
                        id="sessionDuration"
                        type="number"
                        value={duration}
                        min={15}
                        onChange={(event) => setDuration(Number(event.target.value))}
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="sessionFrequency">Frequency</Label>
                      <select
                        id="sessionFrequency"
                        aria-label="Session frequency"
                        value={frequency}
                        onChange={(event) => setFrequency(event.target.value)}
                        className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
                      >
                        <option>One-time</option>
                        <option>Daily</option>
                        <option>Weekly</option>
                        <option>Bi-weekly</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="sessionCapacity">Max participants</Label>
                      <Input
                        id="sessionCapacity"
                        type="number"
                        min={2}
                        value={maxParticipants}
                        onChange={(event) => setMaxParticipants(Number(event.target.value))}
                      />
                    </div>
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving} className="gap-2">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Schedule session
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-5">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Upcoming sessions</CardTitle>
                <CardDescription>See the next study events and RSVP to join.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[660px] pr-2">
                  <div className="space-y-4">
                    {schedules.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-border bg-muted p-8 text-center text-sm text-muted-foreground">
                        No sessions scheduled yet.
                      </div>
                    ) : (
                      schedules.map((schedule) => {
                        const attendingCount = schedule.reminders.filter((reminder) => reminder.is_attending).length
                        const isAttending = schedule.reminders.some((reminder) => reminder.user.id === user?.id && reminder.is_attending)
                        return (
                          <Card key={schedule.id} className="border-border bg-muted p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-[0.24em]">
                                  <CalendarDays className="h-3.5 w-3.5" /> {schedule.subject}
                                </div>
                                <h3 className="text-base font-semibold text-foreground">{schedule.title}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">{schedule.description || 'No description provided.'}</p>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                  <span className="inline-flex items-center gap-1"><Clock4 className="h-3.5 w-3.5" /> {new Date(schedule.scheduled_at).toLocaleString()}</span>
                                  <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {attendingCount} attending</span>
                                </div>
                              </div>
                                <div className="flex flex-col items-start gap-2 sm:items-end">
                                  <div className="text-xs text-muted-foreground">Organized by {schedule.organizer.username}</div>
                                  <Badge variant={schedule.is_cancelled ? 'destructive' : isAttending ? 'secondary' : 'outline'} className="text-xs">
                                    {schedule.is_cancelled ? 'Cancelled' : isAttending ? 'Going' : 'Open'}
                                  </Badge>
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => {
                                      const url = schedule.room ? `${window.location.origin}/room/${schedule.room}` : window.location.href;
                                      navigator.clipboard.writeText(url);
                                      alert("Meeting link copied to clipboard!");
                                    }}>
                                      <Share2 className="h-4 w-4 mr-1" /> Share
                                    </Button>
                                    {!schedule.is_cancelled && !isAttending && (
                                      <Button size="sm" onClick={() => handleRsvp(schedule.id)}>
                                        RSVP
                                      </Button>
                                    )}
                                  </div>
                                </div>
                            </div>
                          </Card>
                        )
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </main>
  )
}
