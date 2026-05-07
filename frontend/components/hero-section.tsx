"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Plus, Users, Video, Bot, MessageSquare } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"

export function HeroSection() {
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-6">
            <Badge variant="secondary" className="w-fit">
              AI-Powered Learning Platform
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              <span className="text-balance">Study Together,</span>
              <br />
              <span className="text-primary">Anywhere.</span>
            </h1>
            <p className="max-w-lg text-lg text-muted-foreground">
              Virtual study rooms with live video, AI teacher guidance, and structured learning. 
              Collaborate in real-time with students worldwide.
            </p>
            <div className="flex flex-wrap gap-3">
              {mounted ? (
                <>
                  <Link href={user ? "/admin" : "/login"}>
                    <Button size="lg" className="gap-2">
                      <Play className="h-4 w-4" />
                      Join a Study Room
                    </Button>
                  </Link>
                  <Link href={user ? "/admin" : "/login"}>
                    <Button size="lg" variant="outline" className="gap-2 bg-transparent">
                      <Plus className="h-4 w-4" />
                      Create a Study Room
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Button size="lg" className="gap-2 opacity-50 cursor-not-allowed">
                    <Play className="h-4 w-4" />
                    Join a Study Room
                  </Button>
                  <Button size="lg" variant="outline" className="gap-2 bg-transparent opacity-50 cursor-not-allowed">
                    <Plus className="h-4 w-4" />
                    Create a Study Room
                  </Button>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-8 pt-4">
              <div>
                <p className="text-2xl font-bold text-foreground">10K+</p>
                <p className="text-sm text-muted-foreground">Active Students</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">500+</p>
                <p className="text-sm text-muted-foreground">Study Rooms</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">98%</p>
                <p className="text-sm text-muted-foreground">Satisfaction</p>
              </div>
            </div>
          </div>

          <div className="relative mt-8 lg:mt-0">
            <div className="rounded-xl border border-border bg-card p-2 sm:p-4 shadow-lg overflow-hidden">
              <div className="aspect-video rounded-lg bg-muted/50 relative overflow-hidden">
                <img
                  src="/images/vsg.png"
                  alt="AceAI StudyHub Preview"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              
              {/* Floating badges - hidden on very small screens or adjusted */}
              <div className="absolute -right-2 top-4 sm:-right-4 sm:top-8 rounded-lg border border-border bg-card px-2 py-1 sm:px-3 sm:py-2 shadow-md">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-primary/10">
                    <Video className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium text-foreground">Live Session</span>
                </div>
              </div>
              <div className="absolute -left-2 top-1/4 sm:-left-4 sm:top-1/3 rounded-lg border border-border bg-card px-2 py-1 sm:px-3 sm:py-2 shadow-md">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium text-foreground">AI Assistant</span>
                </div>
              </div>
              <div className="absolute -right-2 bottom-4 sm:-right-4 sm:bottom-8 rounded-lg border border-border bg-card px-2 py-1 sm:px-3 sm:py-2 shadow-md">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-primary/10">
                    <MessageSquare className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium text-foreground">Real-time Chat</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
