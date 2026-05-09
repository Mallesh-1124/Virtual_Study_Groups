'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, UserCircle2, Star, Award } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { getMyProfile, updateMyProfile, getMyProgress, getMyBadges, type UserProfile, type UserProgress, type UserBadge } from '@/lib/api'

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading, logout } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [badges, setBadges] = useState<UserBadge[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bio, setBio] = useState('')
  const [preferredSubjects, setPreferredSubjects] = useState('')
  const [learningGoal, setLearningGoal] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    async function fetchProfileData() {
      setLoading(true)
      try {
        const [profileData, progressData, badgeData] = await Promise.all([
          getMyProfile(),
          getMyProgress(),
          getMyBadges(),
        ])
        setProfile(profileData)
        setProgress(progressData)
        setBadges(badgeData)
        setBio(profileData.bio)
        setPreferredSubjects(profileData.preferred_subjects)
        setLearningGoal(profileData.learning_goal)
      } catch (err: any) {
        if (err?.status === 401) {
          router.push('/login')
          return
        }
        setError(err?.detail || 'Failed to load profile.')
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchProfileData()
    }
  }, [user, authLoading, router])

  const handleSave = async () => {
    setError(null)
    setSaving(true)
    try {
      const updatedProfile = await updateMyProfile({
        bio,
        preferred_subjects: preferredSubjects,
        learning_goal: learningGoal,
      })
      setProfile(updatedProfile)
    } catch (err: any) {
      setError(err?.detail || 'Unable to save profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Your profile</p>
            <h1 className="mt-3 text-3xl font-semibold text-foreground">Student dashboard</h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
              Manage your study profile, monitor your progress, and unlock badges as you contribute.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={logout} className="w-full sm:w-auto">
            Sign out
          </Button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Profile details</CardTitle>
                <CardDescription>Edit the information used to personalize your experience.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" value={user?.username ?? ''} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user?.email ?? ''} disabled />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Input
                    id="bio"
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                    placeholder="Share your study focus or goals"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="preferredSubjects">Preferred subjects</Label>
                    <Input
                      id="preferredSubjects"
                      value={preferredSubjects}
                      onChange={(event) => setPreferredSubjects(event.target.value)}
                      placeholder="Math, Physics, Computer Science"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="learningGoal">Learning goal</Label>
                    <Input
                      id="learningGoal"
                      value={learningGoal}
                      onChange={(event) => setLearningGoal(event.target.value)}
                      placeholder="Ace this semester with structured sessions"
                    />
                  </div>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving profile...
                    </>
                  ) : (
                    'Save changes'
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Learning progress</CardTitle>
                <CardDescription>Track your study stats over time and stay motivated.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-border bg-muted p-5">
                    <div className="flex items-center gap-3 text-primary">
                      <UserCircle2 className="h-5 w-5" />
                      <p className="font-medium text-foreground">Sessions attended</p>
                    </div>
                    <p className="mt-4 text-3xl font-bold text-foreground">{progress?.total_sessions ?? 0}</p>
                  </div>
                  <div className="rounded-3xl border border-border bg-muted p-5">
                    <div className="flex items-center gap-3 text-amber-500">
                      <Star className="h-5 w-5" />
                      <p className="font-medium text-foreground">Total points</p>
                    </div>
                    <p className="mt-4 text-3xl font-bold text-foreground">{progress?.total_points ?? 0}</p>
                  </div>
                  <div className="rounded-3xl border border-border bg-muted p-5">
                    <div className="flex items-center gap-3 text-sky-500">
                      <Award className="h-5 w-5" />
                      <p className="font-medium text-foreground">Materials uploaded</p>
                    </div>
                    <p className="mt-4 text-3xl font-bold text-foreground">{progress?.materials_uploaded ?? 0}</p>
                  </div>
                  <div className="rounded-3xl border border-border bg-muted p-5">
                    <div className="flex items-center gap-3 text-emerald-500">
                      <Star className="h-5 w-5" />
                      <p className="font-medium text-foreground">Current streak</p>
                    </div>
                    <p className="mt-4 text-3xl font-bold text-foreground">{progress?.current_streak ?? 0} days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Badges earned</CardTitle>
                <CardDescription>Show off your contributions and achievements.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {badges.length === 0 ? (
                  <p className="text-sm text-muted-foreground">You haven't earned any badges yet. Share notes or ask the AI teacher to get started.</p>
                ) : (
                  <div className="grid gap-3">
                    {badges.map((badge) => (
                      <div key={badge.id} className="flex items-start gap-3 rounded-3xl border border-border bg-muted p-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Award className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{badge.badge.name}</p>
                          <p className="text-sm text-muted-foreground mt-1">{badge.badge.description}</p>
                          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-primary">Earned {new Date(badge.earned_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Quick actions</CardTitle>
                <CardDescription>Get to the features that help you study faster.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full" onClick={() => router.push('/room/1')}>
                  Join a study room
                </Button>
                <Button variant="secondary" className="w-full" onClick={() => router.push('/admin')}>
                  Open admin tools
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
