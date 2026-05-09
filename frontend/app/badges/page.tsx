"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Award, Sparkles } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { getBadges, getMyBadges, type Badge as BadgeType, type UserBadge } from "@/lib/api"

export default function BadgesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [badges, setBadges] = useState<BadgeType[]>([])
  const [earned, setEarned] = useState<UserBadge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/")
    }
  }, [authLoading, user, router])

  const loadBadges = async () => {
    setLoading(true)
    try {
      const [allBadges, earnedBadges] = await Promise.all([getBadges(), getMyBadges()])
      setBadges(allBadges)
      setEarned(earnedBadges)
    } catch {
      setError("Unable to load badges.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadBadges()
    }
  }, [user])

  const earnedIds = new Set(earned.map((item) => item.badge.id))

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading badges...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="space-y-3 text-center">
          <h1 className="text-3xl font-semibold text-foreground">Achievements & Badges</h1>
          <p className="max-w-2xl mx-auto text-sm text-muted-foreground">
            Track your earned badges and discover new goals to unlock as you contribute to the study community.
          </p>
        </div>

        <Card className="border-border bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> How to Earn Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm text-muted-foreground">
              <div className="space-y-1">
                <p className="font-medium text-foreground">Active Participation</p>
                <p>Join study rooms and participate in real-time chat and video sessions.</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">Share Resources</p>
                <p>Upload helpful study materials to your study rooms.</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">Help Others</p>
                <p>Answer questions in the community forum.</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">Use AI Teacher</p>
                <p>Ask great questions to the Gemini-powered AI Teacher.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="space-y-5">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" /> Earned badges
                </CardTitle>
                <CardDescription>Badges you've unlocked so far.</CardDescription>
              </CardHeader>
              <CardContent>
                {earned.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-border bg-muted p-8 text-center text-sm text-muted-foreground">
                    No badges earned yet. Participate in sessions, share resources, and ask questions to start earning.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {earned.map((item) => (
                      <Card key={item.id} className="border-border bg-muted">
                        <CardContent className="space-y-2 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-foreground">{item.badge.name}</p>
                              <p className="text-sm text-muted-foreground">{item.badge.description}</p>
                            </div>
                            <Badge className="text-xs">Earned</Badge>
                          </div>
                          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Unlocked {new Date(item.earned_at).toLocaleDateString()}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="space-y-5">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" /> Available badges
                </CardTitle>
                <CardDescription>Goals you can unlock with more activity.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {badges.map((badge) => (
                    <Card key={badge.id} className="border-border bg-muted">
                      <CardContent className="space-y-2 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-foreground">{badge.name}</p>
                            <p className="text-sm text-muted-foreground">{badge.description}</p>
                          </div>
                          <Badge variant={earnedIds.has(badge.id) ? 'secondary' : 'outline'} className="text-xs">
                            {earnedIds.has(badge.id) ? 'Collected' : `${badge.points} pts`}
                          </Badge>
                        </div>
                        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{badge.badge_type}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </main>
  )
}
